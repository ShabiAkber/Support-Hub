import { Router } from 'express';
import {
  create_user,
  get_users,
  get_user_by_id,
  update_user,
  delete_user
} from '../controllers/users.controller.js';

const router = Router();

router.post('/create_user', create_user);
router.get('/get_users', get_users);
router.get('/get_user_by_id/:id', get_user_by_id);
router.put('/update_user/:id', update_user);
router.delete('/delete_user/:id', delete_user);

export default router; 