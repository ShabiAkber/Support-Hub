import { Router } from 'express';
import {
  create_ticket,
  get_tickets,
  get_ticket_by_id,
  update_ticket,
  delete_ticket
} from '../controllers/tickets.controller.js';

const router = Router();

router.post('/create_ticket', create_ticket);
router.get('/get_tickets', get_tickets);
router.get('/get_ticket_by_id/:id', get_ticket_by_id);
router.put('/update_ticket/:id', update_ticket);
router.delete('/delete_ticket/:id', delete_ticket);

export default router; 