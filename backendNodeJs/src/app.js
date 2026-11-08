import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import userRoute from "./routes/user.route.js";
import authRouter from "./routes/auth.route.js";
import resumeRoute from "./routes/resume.route.js";

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
  return res.status(statusCode).json({
    statusCode,
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.error || [],
  });
});

export { app };
