import { Router } from 'express';
import { AuthController } from './controller';
import { validate } from '../../middleware/validate';
import { registerSchema, loginSchema } from './validation';
import { protect } from '../../middleware/auth';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.put('/profile', protect as any, AuthController.updateProfile);

export default router;
