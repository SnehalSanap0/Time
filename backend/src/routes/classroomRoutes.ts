import { Router } from "express";
import { getClassrooms, createClassroom, updateClassroom, deleteClassroom } from "../controllers/classroomController";

const router = Router();

router.get("/", getClassrooms);
router.post("/", createClassroom);
router.put("/:id", updateClassroom);
router.delete("/:id", deleteClassroom);

export default router;
