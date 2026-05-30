import { Router } from 'express';
import { 
  register, 
  login, 
  logout, 
  verifyOtp, 
  forgotPassword, 
  resetPassword, 
  googleLogin 
} from '../controllers/authController';
import { validate } from '../middleware/validate';
import { 
  registerSchema, 
  loginSchema, 
  verifyOtpSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema 
} from '../validators';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/google', googleLogin);

export default router;
