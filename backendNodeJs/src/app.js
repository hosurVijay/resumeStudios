import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import userRoute from "./routes/user.route.js";
import authRouter from "./routes/auth.route.js";
import resumeRoute from "./routes/resume.route.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust reverse proxy for secure cookies on Render, Heroku, etc.
app.set("trust proxy", 1);

const getAllowedOrigins = () => {
  const envOrigin = process.env.CORS_ORIGIN;
  if (!envOrigin || envOrigin === "*") return true;
  if (envOrigin.includes(",")) {
    return envOrigin.split(",").map((o) => o.trim().replace(/\/$/, ""));
  }
  return envOrigin.trim().replace(/\/$/, "");
};

app.use(
  cors({
    origin: getAllowedOrigins(),
    credentials: true,
  }),
);

app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(express.static("public/temp"));
app.use("/uploads", express.static(path.resolve(__dirname, "../public/uploads")));
app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res
    .status(200)
    .json({ status: "ok", message: "Resume Studio Backend is running" });
});

app.use("/api/v1/users", userRoute);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/resumes", resumeRoute);

// Serve frontend static production build if present (Unified Single-Service Deployment)
const frontendDistPath = path.resolve(__dirname, "../../frontendReactJs/dist");

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.get("{*path}", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  let clientMessage = err.message || "Internal Server Error";

  // Guard against leaking internal SQL, database, or runtime crash details to clients
  if (statusCode >= 500 && !err.statusCode) {
    console.error("Unhandled Server Error:", err);
    clientMessage = "Something went wrong on our end. Please try again in a moment.";
  }

  return res.status(statusCode).json({
    statusCode,
    success: false,
    message: clientMessage,
    errors: err.error || [],
  });
});

export { app };
