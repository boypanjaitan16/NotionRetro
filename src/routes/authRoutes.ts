import { Router } from 'express';
import { signup, login, showLogin, showSignup, logout } from '../controllers/authController';
const router = Router();

router.get('/login', showLogin);
router.get('/signup', showSignup);

router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);

export default router;
