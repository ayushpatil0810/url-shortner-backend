import { Router } from "express";
import { sendSuccess } from "../utils/response.js";

const router: Router = Router();

router.get("/health", (req, res) => {
  return sendSuccess(res, null, "Server is healthy", 200);
});

export default router;
