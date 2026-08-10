import express from "express";
import { castVote } from "../controllers/vote.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post('/', protect, castVote)


export default router;