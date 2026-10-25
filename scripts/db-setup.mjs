// Applies db/schema.sql then db/seed.sql to the Neon database, then prints the rows.
// Usage: npm run db:setup
//
// Reads DATABASE_URL (the secret) from .env.local — never hardcode it here.
// Raw SQL only. No ORM.
//
// Transport note: on this local machine, Node's outbound TLS handshakes are
// dropped by something on the network (curl.exe works, node fetch doesn't).
// So locally we let curl.exe do the HTTP round-trip (ZOMATO_DB_TRANSPORT=curl
// in .env.local). On Vercel, normal fetch is used — same protocol, either way.

import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { neon, neonConfig } from "@neondatabase/serverless";

// --- load the secret from .env.local (Next.js does this automatically; a plain script does not) ---
const envPath = path.join(process.cwd(), ".env.local");
const env = fs.readFileSync(envPath, "utf8");
const match = env.match(/^DATABASE_URL=(.*)$/m);
if (!match) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}
const databaseUrl = match[1].trim();
const transport = env.match(/^ZOMATO_DB_TRANSPORT=(.*)$/m)?.[1]?.trim();

// --- the curl.exe transport: same POST /sql protocol, Windows' TLS stack ---
async function curlFetch(url, init) {
  const connString = databaseUrl;
  const stdout = await new Promise((resolve, reject) => {
    execFile(
      "curl.exe",
      [
        "-sS", "--max-time", "30",
        "-X", "POST", url,
        "-H", "Neon-Connection-String:" + connString,
        "-H", "Neon-Raw-Text-Output:true",
        "-H", "Neon-Array-Mode:true",
        "-H", "Content-Type:application/json",
        "--data-raw", init.body,
        "-w", "\n__STATUS__%{http_code}",
      ],
      { maxBuffer: 10 * 1024 * 1024 },
      (err, out) => (err ? reject(err) : resolve(String(out)))
    );
  });
  const splitAt = stdout.lastIndexOf("\n__STATUS__");
  const bodyText = stdout.slice(0, splitAt);
  const status = Number(stdout.slice(splitAt + "__STATUS__".length + 1).trim());
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => JSON.parse(bodyText),
    text: async () => bodyText,
  };
}

const useCurl = process.env.ZOMATO_DB_TRANSPORT === "curl" || transport === "curl";
if (useCurl) {
  neonConfig.fetchFunction = curlFetch;
}
const sql = neon(databaseUrl);

// --- helpers: read a .sql file and run its statements one by one ---
async function runFile(label, filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const statements = raw
    .split(";")
    .map((s) => {
      const withoutComments = s
        .split("\n")
        .filter((line) => !line.trimStart().startsWith("--"))
        .join("\n")
        .trim();
      return withoutComments;
    })
    .filter((s) => s.length > 0);
  for (const statement of statements) {
    await sql.query(statement);
  }
  console.log(`✓ applied ${label} (${statements.length} statements)`);
}

// --- run ---
await runFile("schema", path.join(process.cwd(), "db", "schema.sql"));
await runFile("seed", path.join(process.cwd(), "db", "seed.sql"));

// --- show the rows we just created ---
const restaurants = await sql.query("SELECT * FROM restaurants ORDER BY id");
const reviews = await sql.query("SELECT * FROM reviews ORDER BY id");
console.log("\nrestaurants:");
console.table(
  restaurants.map((r) => ({
    id: r.id,
    name: r.name,
    cuisine: r.cuisine,
    area: r.area,
  }))
);
console.log("reviews:");
console.table(
  reviews.map((r) => ({
    id: r.id,
    restaurant_id: r.restaurant_id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
  }))
);
