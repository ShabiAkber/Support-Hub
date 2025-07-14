import { Router } from 'express';
import {
  create_escalation,
  get_escalations,
  get_escalation_by_id,
  update_escalation,
  delete_escalation
} from '../controllers/escalations.controller.js';

const router = Router();

router.post('/create_escalation', create_escalation);
router.get('/get_escalations', get_escalations);
router.get('/get_escalation_by_id/:id', get_escalation_by_id);
router.put('/update_escalation/:id', update_escalation);
router.delete('/delete_escalation/:id', delete_escalation);

export default router; 