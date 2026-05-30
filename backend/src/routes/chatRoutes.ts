import { Router } from 'express';
import { protect } from '../middleware/auth';
import { 
  chatAlex, 
  chatMaya, 
  chatBuddy, 
  chatSam 
} from '../controllers/chatController';

const router = Router();

router.use(protect);

router.post('/alex', chatAlex);
router.post('/maya', chatMaya);
router.post('/buddy', chatBuddy);
router.post('/sam', chatSam);

export default router;
