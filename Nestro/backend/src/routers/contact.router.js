import express from "express";
import { enquiry, subscribe, adminList, adminUpdate } from "../controllers/contact.controller.js";
import validate from "../middleware/validate.js";
import { requireAdmin } from "../middleware/auth.js";
import { contactSchema, newsletterSchema } from "../validators/catalog.validator.js";
import { writeLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

router.post("/enquiry", writeLimiter, validate(contactSchema), enquiry);
router.post("/subscribe", writeLimiter, validate(newsletterSchema), subscribe);

/* admin — the shop's own record of everything the forms collected */
router.get("/admin/all", requireAdmin, adminList);
router.patch("/admin/:id", requireAdmin, adminUpdate);

export default router;
