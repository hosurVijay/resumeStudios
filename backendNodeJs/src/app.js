import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN === "*" ? true : (process.env.CORS_ORIGIN || "http://localhost:5173"),
    credentials: true,
  })
);

app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(express.static("public/temp"));
app.use(express.json({ limit: "16kb" }));

// Basic health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Resume Studio Backend is running" });
});

export { app };
