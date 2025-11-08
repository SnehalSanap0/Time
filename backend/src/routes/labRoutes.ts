import { Router } from "express";
import { getLabs, createLab, updateLab, deleteLab } from "../controllers/labController";

const router = Router();

router.get("/", getLabs);
router.post("/", createLab);
router.put("/:id", updateLab);
router.delete("/:id", deleteLab);

export default router;
