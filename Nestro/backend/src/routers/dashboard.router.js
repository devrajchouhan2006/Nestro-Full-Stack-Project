import express from "express";
import { overview, customers } from "../controllers/dashboard.controller.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAdmin);

router.get("/overview", overview);
router.get("/customers", customers);

export default router;
