import { Router } from 'express';
import {
  create_escalation_type,
  get_escalation_types,
  get_escalation_type_by_id,
  update_escalation_type,
  delete_escalation_type
} from '../controllers/escalation_types.controller.js';

const router = Router();

router.post('/create_escalation_type', create_escalation_type);
router.get('/get_escalation_types', get_escalation_types);
router.get('/get_escalation_type_by_id/:id', get_escalation_type_by_id);
router.put('/update_escalation_type/:id', update_escalation_type);
router.delete('/delete_escalation_type/:id', delete_escalation_type);

export default router; 