import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import mysql from "mysql2/promise";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log("Connecting to database:", process.env.DB_HOST, "Port:", process.env.DB_PORT);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "resume_studio",
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    multipleStatements: true,
  });

  console.log("Connected successfully!");

  const schemaPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");

  console.log("Running schema.sql tables creation...");
  await connection.query(sql);

  console.log("All tables created successfully in:", process.env.DB_DATABASE);
  await connection.end();
  process.exit(0);
}

runMigration().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
