import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

import { app } from "./app.js";
import { connectDb } from "./db/index.js";

const port = process.env.PORT || 8000;

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is live and hot on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Server failed to start:", err.message);
  });
