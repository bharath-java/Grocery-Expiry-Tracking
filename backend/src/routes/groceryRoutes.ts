import { Router } from 'express';
import { 
  createGrocery, 
  getGroceries, 
  updateGrocery, 
  deleteGrocery, 
  archiveGrocery, 
  restoreGrocery 
} from '../controllers/groceryController';
import { protect } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { validate } from '../middleware/validate';
import { grocerySchema } from '../validators';

const router = Router();

router.use(protect); // All grocery endpoints require authentication

router.route('/')
  .get(getGroceries)
  .post(upload.single('image'), validate(grocerySchema), createGrocery);

router.route('/:id')
  .put(upload.single('image'), updateGrocery)
  .delete(deleteGrocery);

router.put('/:id/archive', archiveGrocery);
router.put('/:id/restore', restoreGrocery);

export default router;
