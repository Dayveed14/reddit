import express from "express";
import { createPost, deletePost, getAllPost, getPost } from '../controllers/post.controller.js'
import { protect } from "../middleware/auth.middleware.js";
import  upload  from "../middleware/upload.middleware.js";

const router = express.Router();

router.get('/', getAllPost);
router.get('/:postId', getPost);
router.post('/', protect, upload.single('image'), createPost);
router.delete('/:postId',protect, deletePost)

export default router;