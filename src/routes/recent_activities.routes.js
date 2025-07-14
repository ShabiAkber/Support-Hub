import { Router } from 'express';
import {
  get_recent_activities,
  get_activity_by_id
} from '../controllers/recent_activities.controller.js';

const router = Router();

router.get('/get_recent_activities', get_recent_activities);
router.get('/get_activity_by_id/:entity_type/:id', get_activity_by_id);

export default router; 