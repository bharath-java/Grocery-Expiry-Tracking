import { Router } from 'express';
import { 
  sendAIChat, 
  getAIChatHistory, 
  clearAIChatHistory 
} from '../controllers/aiController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.post('/chat', sendAIChat);
router.get('/history', getAIChatHistory);
router.delete('/history', clearAIChatHistory);

export default router;
