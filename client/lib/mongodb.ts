import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Reuse one connection across hot reloads in dev and across serverless
// invocations that land on the same instance.
const globalForMongoose = global as unknown as {
  mongoose?: MongooseCache;
};

const cached: MongooseCache =
  globalForMongoose.mongoose ?? { conn: null, promise: null };

globalForMongoose.mongoose = cached;

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    // Read the URI here rather than at module load. `next build` collects
    // page data with no environment loaded, so a module-scope check fails
    // the build on any host that does not inject env vars at build time.
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("Please define the MONGODB_URI environment variable");
    }

    cached.promise = mongoose.connect(uri);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Don't keep a rejected promise cached, or every later request fails
    // even after the database comes back.
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
