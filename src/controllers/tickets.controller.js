import { pool } from '../db/index.js';
import { async_handler } from '../utils/async_handler.js';
import { api_error } from '../utils/api_error.js';
import { api_response } from '../utils/api_response.js';
import { generate_ticket_id } from '../utils/id_generator.js';

const create_ticket = async_handler(async (req, res) => {
  const { tenant_id, subject, description, status, priority, category_id, customer_id, agent_id } = req.body;
  if (!tenant_id || !subject || !status || !priority || !category_id || !customer_id) {
    throw new api_error(400, 'tenant_id, subject, status, priority, category_id, and customer_id are required');
  }
  
  try {
    // Validate that the category belongs to the specified tenant
    const categoryCheck = await pool.query(
      'SELECT id FROM categories WHERE id = $1 AND tenant_id = $2',
      [category_id, tenant_id]
    );
    
    if (categoryCheck.rows.length === 0) {
      throw new api_error(400, 'Category does not belong to the specified tenant');
    }
    
    // Validate that the customer belongs to the specified tenant and has customer role
    const customerCheck = await pool.query(
      'SELECT id, role FROM users WHERE id = $1 AND tenant_id = $2',
      [customer_id, tenant_id]
    );
    
    if (customerCheck.rows.length === 0) {
      throw new api_error(400, 'Customer does not belong to the specified tenant');
    }
    
    if (customerCheck.rows[0].role !== 'customer') {
      throw new api_error(400, 'Customer ID must be a user with customer role');
    }
    
    // Validate that the agent belongs to the specified tenant and has agent/admin role (if provided)
    if (agent_id) {
      const agentCheck = await pool.query(
        'SELECT id, role FROM users WHERE id = $1 AND tenant_id = $2',
        [agent_id, tenant_id]
      );
      
      if (agentCheck.rows.length === 0) {
        throw new api_error(400, 'Agent does not belong to the specified tenant');
      }
      
      if (!['agent', 'admin'].includes(agentCheck.rows[0].role)) {
        throw new api_error(400, 'Agent ID must be a user with agent or admin role');
      }
      
      // Validate that customer and agent are not the same person
      if (customer_id === agent_id) {
        throw new api_error(400, 'Customer and agent cannot be the same person');
      }
    }
    
    const new_id = await generate_ticket_id();
    const result = await pool.query(
      'INSERT INTO tickets (id, tenant_id, subject, description, status, priority, category_id, customer_id, agent_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING *',
      [new_id, tenant_id, subject, description || null, status, priority, category_id, customer_id, agent_id || null]
    );
    return res.status(201).json(new api_response(201, result.rows[0], 'Ticket created'));
  } catch (err) {
    if (err.status_code === 400) {
      throw err; // Re-throw our custom validation error
    }
    if (err.code === '23503') {
      throw new api_error(400, 'Invalid tenant_id, category_id, customer_id, or agent_id');
    }
    if (err.code === '23505') {
      throw new api_error(409, 'A ticket with this subject already exists for this tenant');
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

const get_tickets = async_handler(async (req, res) => {
  const result = await pool.query('SELECT * FROM tickets ORDER BY created_at DESC');
  return res.status(200).json(new api_response(200, result.rows));
});

const get_ticket_by_id = async_handler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new api_error(404, 'Ticket not found');
  return res.status(200).json(new api_response(200, result.rows[0]));
});

const update_ticket = async_handler(async (req, res) => {
  const { id } = req.params;
  const { subject, description, status, priority, category_id, customer_id, agent_id } = req.body;
  
  try {
    // First, get the current ticket to validate tenant relationships
    const currentTicket = await pool.query(
      'SELECT tenant_id FROM tickets WHERE id = $1',
      [id]
    );
    
    if (currentTicket.rows.length === 0) {
      throw new api_error(404, 'Ticket not found');
    }
    
    const tenant_id = currentTicket.rows[0].tenant_id;
    
    // Validate that the category belongs to the same tenant (if provided)
    if (category_id) {
      const categoryCheck = await pool.query(
        'SELECT id FROM categories WHERE id = $1 AND tenant_id = $2',
        [category_id, tenant_id]
      );
      
      if (categoryCheck.rows.length === 0) {
        throw new api_error(400, 'Category does not belong to the ticket\'s tenant');
      }
    }
    
    // Validate that the customer belongs to the same tenant and has customer role (if provided)
    if (customer_id) {
      const customerCheck = await pool.query(
        'SELECT id, role FROM users WHERE id = $1 AND tenant_id = $2',
        [customer_id, tenant_id]
      );
      
      if (customerCheck.rows.length === 0) {
        throw new api_error(400, 'Customer does not belong to the ticket\'s tenant');
      }
      
      if (customerCheck.rows[0].role !== 'customer') {
        throw new api_error(400, 'Customer ID must be a user with customer role');
      }
    }
    
    // Validate that the agent belongs to the same tenant and has agent/admin role (if provided)
    if (agent_id) {
      const agentCheck = await pool.query(
        'SELECT id, role FROM users WHERE id = $1 AND tenant_id = $2',
        [agent_id, tenant_id]
      );
      
      if (agentCheck.rows.length === 0) {
        throw new api_error(400, 'Agent does not belong to the ticket\'s tenant');
      }
      
      if (!['agent', 'admin'].includes(agentCheck.rows[0].role)) {
        throw new api_error(400, 'Agent ID must be a user with agent or admin role');
      }
      
      // Validate that customer and agent are not the same person (if both are provided)
      if (customer_id && customer_id === agent_id) {
        throw new api_error(400, 'Customer and agent cannot be the same person');
      }
    }
    
    const result = await pool.query(
      'UPDATE tickets SET subject = $1, description = $2, status = $3, priority = $4, category_id = $5, customer_id = $6, agent_id = $7, updated_at = NOW() WHERE id = $8 RETURNING *',
      [subject, description || null, status, priority, category_id, customer_id, agent_id || null, id]
    );
    
    return res.status(200).json(new api_response(200, result.rows[0], 'Ticket updated'));
  } catch (err) {
    if (err.status_code === 400 || err.status_code === 404) {
      throw err; // Re-throw our custom validation errors
    }
    if (err.code === '23503') {
      throw new api_error(400, 'Invalid category_id, customer_id, or agent_id');
    }
    if (err.code === '23505') {
      throw new api_error(409, 'A ticket with this subject already exists for this tenant');
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

const delete_ticket = async_handler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM tickets WHERE id = $1 RETURNING *', [id]);
  if (result.rows.length === 0) throw new api_error(404, 'Ticket not found');
  return res.status(200).json(new api_response(200, result.rows[0], 'Ticket deleted'));
});

export {
  create_ticket,
  get_tickets,
  get_ticket_by_id,
  update_ticket,
  delete_ticket
}; 