import { Router } from 'express';
import {
  create_communication,
  get_communications,
  get_communication_by_id,
  update_communication,
  delete_communication
} from '../controllers/communications.controller.js';

const router = Router();

router.post('/create_communication', create_communication);
router.get('/get_communications', get_communications);
router.get('/get_communication_by_id/:id', get_communication_by_id);
router.put('/update_communication/:id', update_communication);
router.delete('/delete_communication/:id', delete_communication);

export default router; 