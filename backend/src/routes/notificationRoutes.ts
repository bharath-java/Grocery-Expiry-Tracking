import { Router } from 'express';
import { 
  getNotifications, 
  markAsRead, 
  subscribePush 
} from '../controllers/notificationController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', getNotifications);
router.put('/read', markAsRead);
router.post('/subscribe', subscribePush);

export default router;
