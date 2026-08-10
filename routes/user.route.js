import express from "express";
import { getAllUsers, getUserProfile, updateProfile, uploadAvatar } from "../controllers/user.controller.js";
import { protect } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();
router.get('/:username', getUserProfile);
router.get('/', getAllUsers);
router.put('/me', protect, updateProfile);
router.post('/me/avatar', protect, upload.single('image'), uploadAvatar);




export default router;
