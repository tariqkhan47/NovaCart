/**
 * One-off copy of everything in MongoDB Atlas into the new MySQL database.
 *
 *   node scripts/migrate-to-mysql.mjs           # show what it would copy
 *   node scripts/migrate-to-mysql.mjs --apply   # write it
 *
 * Run this once, after `npx prisma migrate deploy` has created the MySQL
 * schema and before the app is pointed at it. MONGODB_URI must still be set
 * in .env.local alongside the new DATABASE_URL — Atlas is only read from,
 * never written to or torn down, so this is safe to re-run as many times as
 * needed while checking the result. Re-running clears the five MySQL tables
 * first (in FK order) and reloads them from Mongo, rather than trying to
 * merge — there is nothing else writing to the new database yet.
 *
 * Mongo's ObjectId strings become MySQL auto-increment ids, so every
 * reference (an order's user, an order item's product, a review's product
 * and user) has to be remapped through the id it gets on the way in.
 */
import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";
import { prisma } from "./lib/db.mjs";

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

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set (expected in .env.local)");
  process.exit(1);
}

const apply = process.argv.includes("--apply");

const mongo = new MongoClient(process.env.MONGODB_URI);
await mongo.connect();
const db = mongo.db();

const [users, products, orders, reviews, subscribers] = await Promise.all([
  db.collection("users").find({}).toArray(),
  db.collection("products").find({}).toArray(),
  db.collection("orders").find({}).toArray(),
  db.collection("reviews").find({}).toArray(),
  db.collection("subscribers").find({}).toArray(),
]);

console.log("Found in MongoDB:");
console.log(`  ${users.length} user(s)`);
console.log(`  ${products.length} product(s)`);
console.log(`  ${orders.length} order(s)`);
console.log(`  ${reviews.length} review(s)`);
console.log(`  ${subscribers.length} subscriber(s)`);

if (!apply) {
  console.log("\nDry run. Re-run with --apply to write these into MySQL.");
  await mongo.close();
  await prisma.$disconnect();
  process.exit(0);
}

console.log("\nClearing the MySQL tables...");

// Reverse FK order: children before parents.
await prisma.review.deleteMany();
await prisma.orderItem.deleteMany();
await prisma.order.deleteMany();
await prisma.product.deleteMany();
await prisma.subscriber.deleteMany();
await prisma.user.deleteMany();

const userIdMap = new Map(); // Mongo _id (string) -> MySQL id
const productIdMap = new Map();

console.log("\nUsers...");

for (const user of users) {
  const created = await prisma.user.create({
    data: {
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role ?? "customer",
      createdAt: user.createdAt ?? new Date(),
      updatedAt: user.updatedAt ?? new Date(),
    },
  });

  userIdMap.set(String(user._id), created.id);
}

console.log(`  ${userIdMap.size} copied.`);

console.log("\nProducts...");

for (const product of products) {
  const created = await prisma.product.create({
    data: {
      name: product.name,
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? null,
      category: product.category,
      image: product.image,
      description: product.description,
      seoDescription: product.seoDescription ?? null,
      detailHtml: product.detailHtml ?? null,
      stock: product.stock ?? 0,
      featured: Boolean(product.featured),
      createdAt: product.createdAt ?? new Date(),
      updatedAt: product.updatedAt ?? new Date(),
    },
  });

  productIdMap.set(String(product._id), created.id);
}

console.log(`  ${productIdMap.size} copied.`);

console.log("\nOrders...");

let ordersCopied = 0;
let ordersSkipped = 0;
let itemsWithoutProduct = 0;

for (const order of orders) {
  const userId = userIdMap.get(String(order.user));

  if (userId === undefined) {
    // Should not happen — every order belongs to a user — but an order
    // orphaned by a manual database edit is worth skipping loudly rather
    // than crashing the whole run.
    console.warn(`  skipping order ${order._id}: no matching user`);
    ordersSkipped++;
    continue;
  }

  const items = (order.items ?? []).map((item) => {
    const productId = productIdMap.get(String(item.product));
    if (productId === undefined) itemsWithoutProduct++;

    return {
      productId: productId ?? null,
      name: item.name,
      price: item.price,
      image: item.image ?? null,
      quantity: item.quantity,
    };
  });

  await prisma.order.create({
    data: {
      userId,
      deliveryCharge: order.deliveryCharge ?? 0,
      total: order.total,
      customerName: order.customer?.name ?? "",
      customerEmail: order.customer?.email ?? "",
      customerPhone: order.customer?.phone ?? "",
      customerAddress: order.customer?.address ?? "",
      paymentMethod: order.paymentMethod ?? "cod",
      paymentStatus: order.paymentStatus ?? "pending",
      paymentReference: order.paymentReference ?? null,
      // No paymentTracker: the shop stopped taking cards on 2026-08-02 and the
      // column went out of the schema with the rest of the gateway. Passing it
      // would make Prisma reject the whole write on an unknown field.
      status: order.status ?? "Pending",
      createdAt: order.createdAt ?? new Date(),
      updatedAt: order.updatedAt ?? new Date(),
      items: { create: items },
    },
  });

  ordersCopied++;
}

console.log(`  ${ordersCopied} copied${ordersSkipped ? `, ${ordersSkipped} skipped` : ""}.`);
if (itemsWithoutProduct) {
  console.log(
    `  ${itemsWithoutProduct} order item(s) pointed at a since-deleted product — kept as a snapshot with no product link.`
  );
}

console.log("\nReviews...");

let reviewsCopied = 0;
let reviewsSkipped = 0;

for (const review of reviews) {
  const productId = productIdMap.get(String(review.product));
  const userId = userIdMap.get(String(review.user));

  if (productId === undefined || userId === undefined) {
    console.warn(`  skipping review ${review._id}: product or user no longer exists`);
    reviewsSkipped++;
    continue;
  }

  await prisma.review.create({
    data: {
      productId,
      userId,
      name: review.name,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt ?? new Date(),
      updatedAt: review.updatedAt ?? new Date(),
    },
  });

  reviewsCopied++;
}

console.log(`  ${reviewsCopied} copied${reviewsSkipped ? `, ${reviewsSkipped} skipped` : ""}.`);

console.log("\nSubscribers...");

for (const subscriber of subscribers) {
  await prisma.subscriber.create({
    data: {
      email: subscriber.email,
      name: subscriber.name ?? null,
      phone: subscriber.phone ?? null,
      source: subscriber.source ?? "order",
      orderCount: subscriber.orderCount ?? 0,
      active: subscriber.active ?? true,
      unsubscribeToken: subscriber.unsubscribeToken,
      createdAt: subscriber.createdAt ?? new Date(),
      updatedAt: subscriber.updatedAt ?? new Date(),
    },
  });
}

console.log(`  ${subscribers.length} copied.`);

console.log("\nDone.");

await mongo.close();
await prisma.$disconnect();
