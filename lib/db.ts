import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("MONGO_URI not found in environment variables");
}

const MONGO_URI_STRING: string = MONGO_URI;

export async function connectDB(): Promise<typeof mongoose> {
  if (!global.mongooseConn) {
    global.mongooseConn = { conn: null, promise: null };
  }

  if (global.mongooseConn.conn) {
    return global.mongooseConn.conn;
  }

  if (!global.mongooseConn.promise) {
    global.mongooseConn.promise = mongoose.connect(MONGO_URI_STRING, {
      dbName: "Agento",
    });
  }

  global.mongooseConn.conn = await global.mongooseConn.promise;
  return global.mongooseConn.conn;
}
