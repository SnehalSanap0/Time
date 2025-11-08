import { Router } from "express";
import { getFaculty, createFaculty, updateFaculty, deleteFaculty } from "../controllers/facultyController";

const router = Router();

router.get("/", getFaculty);
router.post("/", createFaculty);
router.put("/:id", updateFaculty);
router.delete("/:id", deleteFaculty);

export default router;
