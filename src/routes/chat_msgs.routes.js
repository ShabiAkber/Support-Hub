import { Router } from 'express';
import {
  create_chat_msg,
  get_chat_msgs,
  get_chat_msg_by_id,
  update_chat_msg,
  delete_chat_msg
} from '../controllers/chat_msgs.controller.js';

const router = Router();

router.post('/create_chat_msg', create_chat_msg);
router.get('/get_chat_msgs', get_chat_msgs);
router.get('/get_chat_msg_by_id/:id', get_chat_msg_by_id);
router.put('/update_chat_msg/:id', update_chat_msg);
router.delete('/delete_chat_msg/:id', delete_chat_msg);

export default router; 