import { Router } from 'express';
import { 
  getProfile, 
  updateProfile, 
  changePassword, 
  backupData, 
  restoreData,
  sendProfileOTP,
  verifyProfileOTP,
  getArchives,
  restoreArchiveItem,
  deleteArchiveItem,
  updateLanguage,
  updateTheme
} from '../controllers/profileController';
import { protect } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(protect);

router.get('/', getProfile);
router.put('/', upload.single('avatar'), updateProfile);
router.put('/update', upload.single('avatar'), updateProfile);
router.put('/change-password', changePassword);
router.get('/backup', backupData);
router.post('/restore', restoreData);

router.post('/send-otp', sendProfileOTP);
router.post('/verify-otp', verifyProfileOTP);

router.get('/archives', getArchives);
router.post('/archives/:id/restore', restoreArchiveItem);
router.delete('/archives/:id', deleteArchiveItem);

router.put('/language', updateLanguage);
router.put('/theme', updateTheme);

export default router;
