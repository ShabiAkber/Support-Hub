import { Router } from 'express';
import {
  create_recording,
  get_recordings,
  get_recording_by_id,
  update_recording,
  delete_recording
} from '../controllers/recordings.controller.js';

const router = Router();

router.post('/create_recording', create_recording);
router.get('/get_recordings', get_recordings);
router.get('/get_recording_by_id/:id', get_recording_by_id);
router.put('/update_recording/:id', update_recording);
router.delete('/delete_recording/:id', delete_recording);

export default router; 