import { pool } from '../db/index.js';
import { async_handler } from '../utils/async_handler.js';
import { api_error } from '../utils/api_error.js';
import { api_response } from '../utils/api_response.js';
import { generate_escalation_id } from '../utils/id_generator.js';

const create_escalation = async_handler(async (req, res) => {
  const { ticket_id, raised_by_user_id, type_id, reason } = req.body;
  if (!ticket_id || !raised_by_user_id || !type_id) {
    throw new api_error(400, 'ticket_id, raised_by_user_id, and type_id are required');
  }
  
  try {
    // Get ticket details to validate tenant relationships
    const ticketCheck = await pool.query(
      'SELECT id, tenant_id, status FROM tickets WHERE id = $1',
      [ticket_id]
    );
    
    if (ticketCheck.rows.length === 0) {
      throw new api_error(400, 'Ticket not found');
    }
    
    const ticket = ticketCheck.rows[0];
    const tenant_id = ticket.tenant_id;
    
    // Validate that the user raising escalation belongs to the same tenant
    const userCheck = await pool.query(
      'SELECT id, role FROM users WHERE id = $1 AND tenant_id = $2',
      [raised_by_user_id, tenant_id]
    );
    
    if (userCheck.rows.length === 0) {
      throw new api_error(400, 'User does not belong to the ticket\'s tenant');
    }
    
    // Business logic: Only agents and admins can raise escalations
    if (!['agent', 'admin'].includes(userCheck.rows[0].role)) {
      throw new api_error(403, 'Only agents and admins can raise escalations');
    }
    
    // Validate that the escalation type belongs to the same tenant
    const typeCheck = await pool.query(
      'SELECT id FROM escalation_types WHERE id = $1 AND tenant_id = $2',
      [type_id, tenant_id]
    );
    
    if (typeCheck.rows.length === 0) {
      throw new api_error(400, 'Escalation type does not belong to the ticket\'s tenant');
    }
    
    // Validate reason length if provided (max 2000 characters)
    if (reason && reason.length > 2000) {
      throw new api_error(400, 'Reason cannot exceed 2000 characters');
    }
    
    // Check if ticket is already escalated (prevent multiple escalations)
    const existingEscalation = await pool.query(
      'SELECT id FROM escalations WHERE ticket_id = $1',
      [ticket_id]
    );
    
    if (existingEscalation.rows.length > 0) {
      throw new api_error(409, 'Ticket is already escalated');
    }
    
    // Check for duplicate escalations by the same user for the same ticket within a time window
    const duplicateCheck = await pool.query(
      'SELECT id FROM escalations WHERE ticket_id = $1 AND raised_by_user_id = $2 AND created_at > NOW() - INTERVAL \'10 minutes\'',
      [ticket_id, raised_by_user_id]
    );
    
    if (duplicateCheck.rows.length > 0) {
      throw new api_error(409, 'You have recently escalated this ticket');
    }
    
    const new_id = await generate_escalation_id();
    const result = await pool.query(
      'INSERT INTO escalations (id, ticket_id, raised_by_user_id, type_id, reason, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [new_id, ticket_id, raised_by_user_id, type_id, reason || null]
    );
    return res.status(201).json(new api_response(201, result.rows[0], 'Escalation created'));
  } catch (err) {
    if (err.status_code === 400 || err.status_code === 403 || err.status_code === 409) {
      throw err; // Re-throw our custom validation errors
    }
    if (err.code === '23503') {
      throw new api_error(400, 'Invalid ticket_id, raised_by_user_id, or type_id');
    }
    if (err.code === '23505') {
      throw new api_error(409, 'Ticket is already escalated');
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

const get_escalations = async_handler(async (req, res) => {
  const result = await pool.query('SELECT * FROM escalations ORDER BY created_at DESC');
  return res.status(200).json(new api_response(200, result.rows));
});

const get_escalation_by_id = async_handler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM escalations WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new api_error(404, 'Escalation not found');
  return res.status(200).json(new api_response(200, result.rows[0]));
});

const update_escalation = async_handler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  try {
    // First, get the current escalation to validate it exists
    const currentEscalation = await pool.query(
      'SELECT id FROM escalations WHERE id = $1',
      [id]
    );
    
    if (currentEscalation.rows.length === 0) {
      throw new api_error(404, 'Escalation not found');
    }
    
    // Validate reason length if provided
    if (reason && reason.length > 2000) {
      throw new api_error(400, 'Reason cannot exceed 2000 characters');
    }
    
    const result = await pool.query(
      'UPDATE escalations SET reason = $1 WHERE id = $2 RETURNING *',
      [reason || null, id]
    );
    
    return res.status(200).json(new api_response(200, result.rows[0], 'Escalation updated'));
  } catch (err) {
    if (err.status_code === 400 || err.status_code === 404) {
      throw err; // Re-throw our custom validation errors
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

const delete_escalation = async_handler(async (req, res) => {
  const { id } = req.params;
  
  try {
    // First, get the current escalation to validate it exists
    const currentEscalation = await pool.query(
      'SELECT id FROM escalations WHERE id = $1',
      [id]
    );
    
    if (currentEscalation.rows.length === 0) {
      throw new api_error(404, 'Escalation not found');
    }
    
    const result = await pool.query('DELETE FROM escalations WHERE id = $1 RETURNING *', [id]);
    return res.status(200).json(new api_response(200, result.rows[0], 'Escalation deleted'));
  } catch (err) {
    if (err.status_code === 404) {
      throw err; // Re-throw our custom validation errors
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

export {
  create_escalation,
  get_escalations,
  get_escalation_by_id,
  update_escalation,
  delete_escalation
}; 