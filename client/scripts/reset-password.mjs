/**
 * Sets a new password for an existing user.
 *
 *   node scripts/reset-password.mjs you@example.com "new password"
 *
 * There is no "forgot password" email flow, so this is how a locked-out
 * account gets back in. It also repairs accounts created before passwords
 * were hashed, whose stored password can never match and so can never log in.
 */
import bcrypt from "bcryptjs";
import { prisma } from "./lib/db.mjs";

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error('Usage: node scripts/reset-password.mjs <email> "<new password>"');
  process.exit(1);
}

if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

// Hashed here rather than in a schema hook, because the signup route hashes
// explicitly too and a hook would double-hash whatever it already sent.
const hash = await bcrypt.hash(password, 10);

const result = await prisma.user.updateMany({
  where: { email },
  data: { password: hash },
});

if (result.count === 0) {
  console.error(`No user found with email: ${email}`);
  process.exitCode = 1;
} else {
  console.log(`Password updated for ${email}. You can log in with it now.`);
}

await prisma.$disconnect();
