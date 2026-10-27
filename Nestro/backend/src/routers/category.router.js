import express from "express";
import { create, read, readById, deleteById, edit, updateById } from "../controllers/category.controller.js";
import upload from "../middleware/multer.js";
import { requireAdmin } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { taxonomySchema } from "../validators/catalog.validator.js";

const router = express.Router();

router.get("/", read);
router.get("/:id", readById);

router.post("/create", requireAdmin, upload.single("image"), validate(taxonomySchema), create);
router.put("/edit/:id", requireAdmin, upload.single("image"), validate(taxonomySchema.partial()), edit);
router.patch("/status-update/:id", requireAdmin, updateById);
router.delete("/delete/:id", requireAdmin, deleteById);

export default router;
