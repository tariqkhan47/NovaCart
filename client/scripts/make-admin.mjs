/**
 * Promotes an existing user to admin.
 *
 *   node scripts/make-admin.mjs you@example.com
 *
 * Sign up through the website first, then run this once for your own account.
 * There is deliberately no way to create an admin from the browser.
 */
import mongoose from "mongoose";
import { readFileSync } from "node:fs";

// Minimal .env.local reader so this works without extra dependencies.
function loadEnv() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // Fall through to whatever is already in the environment.
  }
}

loadEnv();

const email = process.argv[2];

if (!email) {
  console.error("Usage: node scripts/make-admin.mjs <email>");
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set (expected in .env.local)");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

const User =
  mongoose.models.User ||
  mongoose.model(
    "User",
    new mongoose.Schema({}, { strict: false, collection: "users" })
  );

const result = await User.updateOne(
  { email },
  { $set: { role: "admin" } }
);

if (result.matchedCount === 0) {
  console.error(`No user found with email: ${email}`);
  console.error("Sign up on the website first, then run this again.");
  process.exitCode = 1;
} else {
  console.log(`${email} is now an admin.`);
}

await mongoose.disconnect();
