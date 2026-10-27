import express from "express";
import { list, create, update, setDefault, remove } from "../controllers/address.controller.js";
import { verifyToken } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { addressSchema } from "../validators/address.validator.js";

const router = express.Router();
router.use(verifyToken);

router.get("/", list);
router.post("/", validate(addressSchema), create);
router.put("/:id", validate(addressSchema.partial()), update);
router.patch("/:id/default", setDefault);
router.delete("/:id", remove);

export default router;
