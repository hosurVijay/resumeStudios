import mysql from "mysql2";
const connectionInstance = mysql.createConnection({
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const db = connectionInstance.promise();
export const connectDb = async () => {
  try {
    connectionInstance.connect((err) => {
      if (!err) {
        console.log("MySql connection successful");
      } else {
        console.log("MySql connection error", err);
      }
    });
  } catch (error) {
    console.log("COnnection with mysql failed!, Try again", error);
    process.exit(1);
  }
};
