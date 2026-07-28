/**
 * Sets a new password for an existing user.
 *
 *   node scripts/reset-password.mjs you@example.com "new password"
 *
 * There is no "forgot password" email flow, so this is how a locked-out
 * account gets back in. It also repairs accounts created before passwords
 * were hashed, whose stored password can never match and so can never log in.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
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

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error('Usage: node scripts/reset-password.mjs <email> "<new password>"');
  process.exit(1);
}

if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
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

// Hashed here rather than in a schema hook, because the signup route hashes
// explicitly too and a hook would double-hash whatever it already sent.
const hash = await bcrypt.hash(password, 10);

const result = await User.updateOne({ email }, { $set: { password: hash } });

if (result.matchedCount === 0) {
  console.error(`No user found with email: ${email}`);
  process.exitCode = 1;
} else {
  console.log(`Password updated for ${email}. You can log in with it now.`);
}

await mongoose.disconnect();