/**
 * Promotes an existing user to admin.
 *
 *   node scripts/make-admin.mjs you@example.com
 *
 * Sign up through the website first, then run this once for your own account.
 * There is deliberately no way to create an admin from the browser.
 */
import { prisma } from "./lib/db.mjs";

const email = process.argv[2];

if (!email) {
  console.error("Usage: node scripts/make-admin.mjs <email>");
  process.exit(1);
}

const result = await prisma.user.updateMany({
  where: { email },
  data: { role: "admin" },
});

if (result.count === 0) {
  console.error(`No user found with email: ${email}`);
  console.error("Sign up on the website first, then run this again.");
  process.exitCode = 1;
} else {
  console.log(`${email} is now an admin.`);
}

await prisma.$disconnect();
