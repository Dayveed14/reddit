import express from "express";
import { createComment, deleteComment, getComments } from '../controllers/comment.controller.js'
import { protect } from "../middleware/auth.middleware.js";


const router = express.Router();

router.get('/:postId', getComments);
router.post('/', protect,createComment);
router.delete('/:commentId',protect, deleteComment)

export default router;