import mysql from "mysql2";

const connectionInstance = mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "resume_studio",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

export const db = connectionInstance.promise();

export const connectDb = () => {
  return new Promise((resolve, reject) => {
    connectionInstance.connect((err) => {
      if (err) {
        console.error("MySQL connection error:", err.message);
        return reject(err);
      }
      console.log("MySQL connection successful");
      resolve();
    });
  });
};
