// Central database access. Every backend query goes through the `sql` object
// created here. Raw SQL only — no ORM.
//
// Transport note (local machine only): a network filter on this machine drops
// Node's outbound TLS handshakes, while curl.exe (Windows' native TLS) works.
// When ZOMATO_DB_TRANSPORT=curl is set (in .env.local, only exists locally),
// we let curl.exe carry the HTTP bytes and the Neon driver does the protocol.
// On Vercel, normal fetch is used. Same POST /sql protocol either way.

import { neon, neonConfig } from "@neondatabase/serverless";
import { execFile } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. It should be in .env.local (local) or Vercel env vars (production).");
}

async function curlFetch(url: string, init: { body?: string }) {
  const stdout = await new Promise<string>((resolve, reject) => {
    execFile(
      "curl.exe",
      [
        "-sS", "--max-time", "30",
        "-X", "POST", url,
        "-H", "Neon-Connection-String:" + databaseUrl,
        "-H", "Neon-Raw-Text-Output:true",
        "-H", "Neon-Array-Mode:true",
        "-H", "Content-Type:application/json",
        "--data-raw", init.body ?? "",
        "-w", "\n__STATUS__%{http_code}",
      ],
      { maxBuffer: 10 * 1024 * 1024 },
      (err, out) => (err ? reject(err) : resolve(String(out)))
    );
  });
  const splitAt = stdout.lastIndexOf("\n__STATUS__");
  const bodyText = stdout.slice(0, splitAt);
  const status = Number(stdout.slice(splitAt + "\n__STATUS__".length).trim());
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => JSON.parse(bodyText),
    text: async () => bodyText,
  };
}

if (process.env.ZOMATO_DB_TRANSPORT === "curl") {
  neonConfig.fetchFunction = curlFetch;
}

export const sql = neon(databaseUrl);
