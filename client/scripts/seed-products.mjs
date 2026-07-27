/**
 * Puts a few starter products in the database.
 *
 *   node scripts/seed-products.mjs
 *
 * Safe to re-run: it skips any product whose name is already there.
 */
import mongoose from "mongoose";
import { readFileSync } from "node:fs";

function loadEnv() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // Fall through to the ambient environment.
  }
}

loadEnv();

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set (expected in .env.local)");
  process.exit(1);
}

const seed = [
  {
    name: "Wireless Headphones",
    price: 14999,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    description: "High quality wireless headphones with amazing sound.",
    stock: 25,
  },
  {
    name: "Smart Watch",
    price: 22999,
    category: "Accessories",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
    description: "Modern smartwatch with health tracking features.",
    stock: 15,
  },
  {
    name: "Gaming Mouse",
    price: 6499,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1527814050087-3793815479db?w=500",
    description: "Fast and accurate gaming mouse with RGB lights.",
    stock: 40,
  },
  {
    name: "Bluetooth Speaker",
    price: 18999,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500",
    description: "Portable Bluetooth speaker with deep bass.",
    stock: 20,
  },
];

await mongoose.connect(process.env.MONGODB_URI);

const products = mongoose.connection.db.collection("products");

let added = 0;

for (const product of seed) {
  const exists = await products.findOne({ name: product.name });

  if (exists) {
    console.log(`skip  ${product.name} (already there)`);
    continue;
  }

  await products.insertOne({
    ...product,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(`added ${product.name}`);
  added++;
}

console.log(`\nDone. ${added} product(s) added.`);

await mongoose.disconnect();
