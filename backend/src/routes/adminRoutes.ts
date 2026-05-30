import { Router } from 'express';
import { 
  getAdminStats, 
  getAllUsers, 
  updateUserRole, 
  triggerSystemCron 
} from '../controllers/adminController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);
router.use(authorize('admin')); // Restricts all child routes exclusively to admin users

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.put('/users/:userId/role', updateUserRole);
router.post('/trigger-cron', triggerSystemCron);

export default router;
