import express from "express";
import { createCommunity, getCommunities, getCommunity, joinCommunity, leaveCommunity, uploadBanner } from '../controllers/community.controller.js'
import { protect } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";


const router = express.Router();
router.get('/', getCommunities);
router.get('/:name', getCommunity); 
router.post('/', protect, createCommunity);
router.post('/:name/join',protect, joinCommunity); 
router.post('/:name/leave',protect, leaveCommunity); 
router.post('/:name/banner', protect, upload.single('image'), uploadBanner);

export default router;