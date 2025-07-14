import { Router } from 'express';
import {
  create_chat,
  get_chats,
  get_chat_by_id,
  update_chat,
  delete_chat
} from '../controllers/chats.controller.js';

const router = Router();

router.post('/create_chat', create_chat);
router.get('/get_chats', get_chats);
router.get('/get_chat_by_id/:id', get_chat_by_id);
router.put('/update_chat/:id', update_chat);
router.delete('/delete_chat/:id', delete_chat);

export default router; 