import { Router } from 'express';
import {
  create_template,
  get_templates,
  get_template_by_id,
  update_template,
  delete_template
} from '../controllers/templates.controller.js';

const router = Router();

router.post('/create_template', create_template);
router.get('/get_templates', get_templates);
router.get('/get_template_by_id/:id', get_template_by_id);
router.put('/update_template/:id', update_template);
router.delete('/delete_template/:id', delete_template);

export default router; 