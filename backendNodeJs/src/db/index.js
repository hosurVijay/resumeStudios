import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2";
import { AsyncLocalStorage } from "node:async_hooks";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "resume_studio",
  ssl:
    process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const rawDb = pool.promise();
const transactionStorage = new AsyncLocalStorage();

export const db = new Proxy(rawDb, {
  get(target, prop) {
    const store = transactionStorage.getStore();
    const activeConn = store?.connection;
    if (activeConn && typeof activeConn[prop] === "function") {
      return activeConn[prop].bind(activeConn);
    }
    const orig = target[prop];
    if (typeof orig === "function") {
      return orig.bind(target);
    }
    return orig;
  },
});

export const connectDb = async () => {
  const host = process.env.DB_HOST || "127.0.0.1";
  const port = Number(process.env.DB_PORT) || 3306;
  console.log(`Connecting to database at ${host}:${port}...`);
  const conn = await pool.promise().getConnection();
  console.log("MySQL connection successful");
  conn.release();
};

export const beginTransaction = async () => {
  const store = transactionStorage.getStore();
  if (store?.connection) {
    return store.connection;
  }
  const connection = await pool.promise().getConnection();
  await connection.beginTransaction();
  transactionStorage.enterWith({ connection });
  return connection;
};

export const commitTransaction = async (explicitConn) => {
  const store = transactionStorage.getStore();
  const conn = explicitConn || store?.connection;
  if (!conn) return;
  try {
    await conn.commit();
  } finally {
    conn.release();
    if (store) store.connection = null;
  }
};

export const rollBackTransaction = async (explicitConn) => {
  const store = transactionStorage.getStore();
  const conn = explicitConn || store?.connection;
  if (!conn) return;
  try {
    await conn.rollback();
  } finally {
    conn.release();
    if (store) store.connection = null;
  }
};
