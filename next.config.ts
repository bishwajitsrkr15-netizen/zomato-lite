import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* This tiny app reads route params and lives on runtime data.
     Next 16's new prerender pipeline wants Suspense boundaries around
     all of that — we opt out of Cache Components instead. */
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
