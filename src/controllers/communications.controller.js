import { pool } from '../db/index.js';
import { async_handler } from '../utils/async_handler.js';
import { api_error } from '../utils/api_error.js';
import { api_response } from '../utils/api_response.js';
import { generate_communication_id } from '../utils/id_generator.js';

const create_communication = async_handler(async (req, res) => {
  const { tenant_id, ticket_id, chat_id, type, user_id, summary } = req.body;
  if (!tenant_id || !ticket_id || !type || !user_id) {
    throw new api_error(400, 'tenant_id, ticket_id, type, and user_id are required');
  }
  
  // Validate communication type enum
  const validTypes = ['email', 'sms', 'call', 'push'];
  if (!validTypes.includes(type)) {
    throw new api_error(400, 'Type must be one of: email, sms, call, push');
  }
  
  try {
    // Validate that the ticket belongs to the specified tenant
    const ticketCheck = await pool.query(
      'SELECT id, status FROM tickets WHERE id = $1 AND tenant_id = $2',
      [ticket_id, tenant_id]
    );
    
    if (ticketCheck.rows.length === 0) {
      throw new api_error(400, 'Ticket does not belong to the specified tenant');
    }
    
    // Validate that the user belongs to the specified tenant and has appropriate role
    const userCheck = await pool.query(
      'SELECT id, role FROM users WHERE id = $1 AND tenant_id = $2',
      [user_id, tenant_id]
    );
    
    if (userCheck.rows.length === 0) {
      throw new api_error(400, 'User does not belong to the specified tenant');
    }
    
    // Business logic: Only agents and admins can create communications
    if (!['agent', 'admin'].includes(userCheck.rows[0].role)) {
      throw new api_error(403, 'Only agents and admins can create communications');
    }
    
    // Validate that the chat belongs to the same ticket and tenant (if provided)
    if (chat_id) {
      const chatCheck = await pool.query(
        'SELECT id, ticket_id FROM chats WHERE id = $1 AND tenant_id = $2',
        [chat_id, tenant_id]
      );
      
      if (chatCheck.rows.length === 0) {
        throw new api_error(400, 'Chat does not belong to the specified tenant');
      }
      
      if (chatCheck.rows[0].ticket_id !== ticket_id) {
        throw new api_error(400, 'Chat is not associated with the specified ticket');
      }
    }
    
    // Validate summary length if provided (max 1000 characters)
    if (summary && summary.length > 1000) {
      throw new api_error(400, 'Summary cannot exceed 1000 characters');
    }
    
    // Check for duplicate communications (same ticket, type, and user within a short time window)
    const duplicateCheck = await pool.query(
      'SELECT id FROM communications WHERE ticket_id = $1 AND type = $2 AND user_id = $3 AND created_at > NOW() - INTERVAL \'5 minutes\'',
      [ticket_id, type, user_id]
    );
    
    if (duplicateCheck.rows.length > 0) {
      throw new api_error(409, 'A similar communication was recently created for this ticket');
    }
    
    const new_id = await generate_communication_id();
    const result = await pool.query(
      'INSERT INTO communications (id, tenant_id, ticket_id, chat_id, type, user_id, summary, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *',
      [new_id, tenant_id, ticket_id, chat_id || null, type, user_id, summary || null]
    );
    return res.status(201).json(new api_response(201, result.rows[0], 'Communication created'));
  } catch (err) {
    if (err.status_code === 400 || err.status_code === 403 || err.status_code === 409) {
      throw err; // Re-throw our custom validation errors
    }
    if (err.code === '23503') {
      throw new api_error(400, 'Invalid tenant_id, ticket_id, chat_id, or user_id');
    }
    if (err.code === '23505') {
      throw new api_error(409, 'A similar communication was recently created for this ticket');
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

const get_communications = async_handler(async (req, res) => {
  const result = await pool.query('SELECT * FROM communications ORDER BY created_at DESC');
  return res.status(200).json(new api_response(200, result.rows));
});

const get_communication_by_id = async_handler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM communications WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new api_error(404, 'Communication not found');
  return res.status(200).json(new api_response(200, result.rows[0]));
});

const update_communication = async_handler(async (req, res) => {
  const { id } = req.params;
  const { type, summary } = req.body;
  
  try {
    // First, get the current communication to validate it exists
    const currentCommunication = await pool.query(
      'SELECT id, tenant_id, ticket_id FROM communications WHERE id = $1',
      [id]
    );
    
    if (currentCommunication.rows.length === 0) {
      throw new api_error(404, 'Communication not found');
    }
    
    // Validate communication type enum if provided
    if (type) {
      const validTypes = ['email', 'sms', 'call', 'push'];
      if (!validTypes.includes(type)) {
        throw new api_error(400, 'Type must be one of: email, sms, call, push');
      }
    }
    
    // Validate summary length if provided
    if (summary && summary.length > 1000) {
      throw new api_error(400, 'Summary cannot exceed 1000 characters');
    }
    
    const result = await pool.query(
      'UPDATE communications SET type = $1, summary = $2 WHERE id = $3 RETURNING *',
      [type, summary || null, id]
    );
    
    return res.status(200).json(new api_response(200, result.rows[0], 'Communication updated'));
  } catch (err) {
    if (err.status_code === 400 || err.status_code === 404) {
      throw err; // Re-throw our custom validation errors
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

const delete_communication = async_handler(async (req, res) => {
  const { id } = req.params;
  
  try {
    // First, get the current communication to validate it exists
    const currentCommunication = await pool.query(
      'SELECT id FROM communications WHERE id = $1',
      [id]
    );
    
    if (currentCommunication.rows.length === 0) {
      throw new api_error(404, 'Communication not found');
    }
    
    const result = await pool.query('DELETE FROM communications WHERE id = $1 RETURNING *', [id]);
    return res.status(200).json(new api_response(200, result.rows[0], 'Communication deleted'));
  } catch (err) {
    if (err.status_code === 404) {
      throw err; // Re-throw our custom validation errors
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

export {
  create_communication,
  get_communications,
  get_communication_by_id,
  update_communication,
  delete_communication
}; 