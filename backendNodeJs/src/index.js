import "dotenv/config";
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
