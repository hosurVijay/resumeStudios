import { refreshToken } from "../middleware/auth.middleware.js";
import { Router } from "express";
const router = Router();
router.route("/refresh-token").post(refreshToken);
export default router;
