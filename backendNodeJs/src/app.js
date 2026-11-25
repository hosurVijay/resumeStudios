import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import userRoute from "./routes/user.route.js";
import authRouter from "./routes/auth.route.js";
import resumeRoute from "./routes/resume.route.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN === "*"
        ? true
        : process.env.CORS_ORIGIN || "http://localhost:5173",
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
