import express from 'express';
import { getUserProfile } from '../controllers/userController.js';

const router = express.Router();

// Route to get user profile
router.get('/profile', getUserProfile);

export default router;
