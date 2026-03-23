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

/** Connects to the admin MongoDB (MONGO_URI_ADMIN) and returns a separate connection. */
export async function connectAdminDB(): Promise<mongoose.Connection> {
  const MONGO_URI_ADMIN = process.env.MONGO_URI_ADMIN;
  if (!MONGO_URI_ADMIN) throw new Error("MONGO_URI_ADMIN not found in environment variables");

  if (!global.mongooseAdminConn) {
    global.mongooseAdminConn = { conn: null, promise: null };
  }

  if (global.mongooseAdminConn.conn) {
    return global.mongooseAdminConn.conn;
  }

  if (!global.mongooseAdminConn.promise) {
    global.mongooseAdminConn.promise = mongoose
      .createConnection(MONGO_URI_ADMIN, { dbName: "AgentoAdmin" })
      .asPromise();
  }

  global.mongooseAdminConn.conn = await global.mongooseAdminConn.promise;
  return global.mongooseAdminConn.conn;
}
