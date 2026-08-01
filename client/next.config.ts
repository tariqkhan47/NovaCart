import path from "node:path";
import type { NextConfig } from "next";
import { config as loadEnv } from "dotenv";

// Hostinger's Node.js App runner only loads .env.local into the build step —
// the process that actually serves requests never sees it, so a plain
// `process.env.DATABASE_URL` read at request time comes back empty there
// (confirmed: build succeeds, then every request 500s with "Please define
// the DATABASE_URL environment variable"). Loading it here and re-exposing
// the values through `env` below bakes them into the compiled output as
// literal strings at build time, so they survive regardless of what the
// runtime filesystem has.
loadEnv({ path: ".env.local" });

const nextConfig: NextConfig = {
  // There is a package-lock.json in the repo root as well as in client/, so
  // Next has to be told which one is ours or it guesses the wrong root.
  turbopack: {
    root: path.resolve("."),
  },

  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
  },

  // The product photos in public/img/. Next serves everything under public/
  // with `Cache-Control: public, max-age=0`, because it cannot know whether a
  // file will be replaced — which for 2,200 catalog photos means every one of
  // them is revalidated on every page view, and the shop feels slower than it
  // did when the pictures were on a CDN. These filenames are a sha1 of the
  // source image, so a changed picture is a changed name and the old one is
  // simply never asked for again: safe to pin for a year and mark immutable.
  // Header rules are matched before the filesystem, so this wins over the
  // default. See scripts/localize-images.mjs.
  async headers() {
    return [
      {
        source: "/img/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Standalone mode ships a pruned .next/standalone folder that never gets
  // our own .env files copied into it — fine for the Dockerfile, which
  // copies them in itself (see COPY steps there), but fatal for any host
  // that just runs `next start` next to the checked-out source (Vercel,
  // Hostinger's Node.js App hosting): the server boots with none of
  // DATABASE_URL, JWT_SECRET, etc. set. Only the Dockerfile opts into this,
  // via DOCKER_BUILD=true in its build stage.
  ...(process.env.DOCKER_BUILD ? { output: "standalone" as const } : {}),
};

export default nextConfig;
