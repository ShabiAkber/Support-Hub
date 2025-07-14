import { pool } from '../db/index.js';
import { async_handler } from '../utils/async_handler.js';
import { api_error } from '../utils/api_error.js';
import { api_response } from '../utils/api_response.js';
import { generate_chat_id } from '../utils/id_generator.js';

const create_chat = async_handler(async (req, res) => {
  const { tenant_id, ticket_id, started_by_user_id, assigned_agent_id } = req.body;
  if (!tenant_id || !ticket_id || !started_by_user_id) {
    throw new api_error(400, 'tenant_id, ticket_id, and started_by_user_id are required');
  }
  
  try {
    // Validate that the ticket belongs to the specified tenant
    const ticketCheck = await pool.query(
      'SELECT id FROM tickets WHERE id = $1 AND tenant_id = $2',
      [ticket_id, tenant_id]
    );
    
    if (ticketCheck.rows.length === 0) {
      throw new api_error(400, 'Ticket does not belong to the specified tenant');
    }
    
    // Validate that the user who started the chat belongs to the specified tenant and has customer role
    const userCheck = await pool.query(
      'SELECT id, role FROM users WHERE id = $1 AND tenant_id = $2',
      [started_by_user_id, tenant_id]
    );
    
    if (userCheck.rows.length === 0) {
      throw new api_error(400, 'User does not belong to the specified tenant');
    }
    
    if (userCheck.rows[0].role !== 'customer') {
      throw new api_error(400, 'Chat can only be started by a customer');
    }
    
    // Validate that the assigned agent belongs to the specified tenant and has agent/admin role (if provided)
    if (assigned_agent_id) {
      const agentCheck = await pool.query(
        'SELECT id, role FROM users WHERE id = $1 AND tenant_id = $2',
        [assigned_agent_id, tenant_id]
      );
      
      if (agentCheck.rows.length === 0) {
        throw new api_error(400, 'Assigned agent does not belong to the specified tenant');
      }
      
      if (!['agent', 'admin'].includes(agentCheck.rows[0].role)) {
        throw new api_error(400, 'Assigned agent must be a user with agent or admin role');
      }
      
      // Validate that the user who started the chat is not the same as the assigned agent
      if (started_by_user_id === assigned_agent_id) {
        throw new api_error(400, 'User who started the chat cannot be assigned as the agent');
      }
    }
    
    const new_id = await generate_chat_id();
    const result = await pool.query(
      'INSERT INTO chats (id, tenant_id, ticket_id, started_by_user_id, assigned_agent_id, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [new_id, tenant_id, ticket_id, started_by_user_id, assigned_agent_id || null]
    );
    return res.status(201).json(new api_response(201, result.rows[0], 'Chat created'));
  } catch (err) {
    if (err.status_code === 400) {
      throw err; // Re-throw our custom validation error
    }
    if (err.code === '23503') {
      throw new api_error(400, 'Invalid tenant_id, ticket_id, started_by_user_id, or assigned_agent_id');
    }
    if (err.code === '23505') {
      throw new api_error(409, 'A chat already exists for this ticket');
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

const get_chats = async_handler(async (req, res) => {
  const result = await pool.query('SELECT * FROM chats ORDER BY created_at DESC');
  return res.status(200).json(new api_response(200, result.rows));
});

const get_chat_by_id = async_handler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM chats WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new api_error(404, 'Chat not found');
  return res.status(200).json(new api_response(200, result.rows[0]));
});

const update_chat = async_handler(async (req, res) => {
  const { id } = req.params;
  const { assigned_agent_id, closed_at } = req.body;
  
  try {
    // First, get the current chat to validate tenant relationships
    const currentChat = await pool.query(
      'SELECT tenant_id FROM chats WHERE id = $1',
      [id]
    );
    
    if (currentChat.rows.length === 0) {
      throw new api_error(404, 'Chat not found');
    }
    
    const tenant_id = currentChat.rows[0].tenant_id;
    
    // Validate that the assigned agent belongs to the same tenant and has agent/admin role (if provided)
    if (assigned_agent_id) {
      const agentCheck = await pool.query(
        'SELECT id, role FROM users WHERE id = $1 AND tenant_id = $2',
        [assigned_agent_id, tenant_id]
      );
      
      if (agentCheck.rows.length === 0) {
        throw new api_error(400, 'Assigned agent does not belong to the chat\'s tenant');
      }
      
      if (!['agent', 'admin'].includes(agentCheck.rows[0].role)) {
        throw new api_error(400, 'Assigned agent must be a user with agent or admin role');
      }
    }
    
    const result = await pool.query(
      'UPDATE chats SET assigned_agent_id = $1, closed_at = $2 WHERE id = $3 RETURNING *',
      [assigned_agent_id || null, closed_at || null, id]
    );
    
    return res.status(200).json(new api_response(200, result.rows[0], 'Chat updated'));
  } catch (err) {
    if (err.status_code === 400 || err.status_code === 404) {
      throw err; // Re-throw our custom validation errors
    }
    if (err.code === '23503') {
      throw new api_error(400, 'Invalid assigned_agent_id');
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

const delete_chat = async_handler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM chats WHERE id = $1 RETURNING *', [id]);
  if (result.rows.length === 0) throw new api_error(404, 'Chat not found');
  return res.status(200).json(new api_response(200, result.rows[0], 'Chat deleted'));
});

export {
  create_chat,
  get_chats,
  get_chat_by_id,
  update_chat,
  delete_chat
}; 