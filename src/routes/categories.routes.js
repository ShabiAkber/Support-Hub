import { Router } from 'express';
import {
  create_category,
  get_categories,
  get_category_by_id,
  update_category,
  delete_category
} from '../controllers/categories.controller.js';

const router = Router();

router.post('/create_category', create_category);
router.get('/get_categories', get_categories);
router.get('/get_category_by_id/:id', get_category_by_id);
router.put('/update_category/:id', update_category);
router.delete('/delete_category/:id', delete_category);

export default router; 