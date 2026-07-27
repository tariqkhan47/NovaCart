import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // There is a package-lock.json in the repo root as well as in client/, so
  // Next has to be told which one is ours or it guesses the wrong root.
  turbopack: {
    root: path.resolve("."),
  },

  // Needed by the Dockerfile. Vercel builds its own output, and leaving
  // standalone on there just produces a second copy of the app.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
};

export default nextConfig;
