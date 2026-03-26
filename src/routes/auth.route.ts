import express from "express";
import { signUp, signIn } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
const router = express.Router();

// authentication routes

router.route("/signup").post(signUp);
router.route("/signin").post(signIn);

export default router;
