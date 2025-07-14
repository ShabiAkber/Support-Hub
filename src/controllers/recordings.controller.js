import { pool } from '../db/index.js';
import { async_handler } from '../utils/async_handler.js';
import { api_error } from '../utils/api_error.js';
import { api_response } from '../utils/api_response.js';
import { generate_recording_id } from '../utils/id_generator.js';

const create_recording = async_handler(async (req, res) => {
  const { tenant_id, ticket_id, chat_id, url } = req.body;
  if (!tenant_id || !ticket_id || !chat_id || !url) {
    throw new api_error(400, 'tenant_id, ticket_id, chat_id, and url are required');
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
    
    // Validate that the chat belongs to the specified tenant and is associated with the ticket
    const chatCheck = await pool.query(
      'SELECT id, ticket_id, closed_at FROM chats WHERE id = $1 AND tenant_id = $2',
      [chat_id, tenant_id]
    );
    
    if (chatCheck.rows.length === 0) {
      throw new api_error(400, 'Chat does not belong to the specified tenant');
    }
    
    if (chatCheck.rows[0].ticket_id !== ticket_id) {
      throw new api_error(400, 'Chat is not associated with the specified ticket');
    }
    
    // Validate that the chat is not closed (no recordings for closed chats)
    if (chatCheck.rows[0].closed_at) {
      throw new api_error(400, 'Cannot create recordings for closed chats');
    }
    
    // Validate URL format (basic validation)
    try {
      new URL(url);
    } catch (urlError) {
      throw new api_error(400, 'Invalid URL format');
    }
    
    // Check for duplicate recordings for the same chat/ticket combination
    const duplicateCheck = await pool.query(
      'SELECT id FROM recordings WHERE ticket_id = $1 AND chat_id = $2',
      [ticket_id, chat_id]
    );
    
    if (duplicateCheck.rows.length > 0) {
      throw new api_error(409, 'A recording already exists for this ticket and chat combination');
    }
    
    const new_id = await generate_recording_id();
    const result = await pool.query(
      'INSERT INTO recordings (id, tenant_id, ticket_id, chat_id, url, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [new_id, tenant_id, ticket_id, chat_id, url]
    );
    return res.status(201).json(new api_response(201, result.rows[0], 'Recording created'));
  } catch (err) {
    if (err.status_code === 400 || err.status_code === 409) {
      throw err; // Re-throw our custom validation errors
    }
    if (err.code === '23503') {
      throw new api_error(400, 'Invalid tenant_id, ticket_id, or chat_id');
    }
    if (err.code === '23505') {
      throw new api_error(409, 'A recording already exists for this ticket and chat combination');
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

const get_recordings = async_handler(async (req, res) => {
  const result = await pool.query('SELECT * FROM recordings ORDER BY created_at DESC');
  return res.status(200).json(new api_response(200, result.rows));
});

const get_recording_by_id = async_handler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM recordings WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new api_error(404, 'Recording not found');
  return res.status(200).json(new api_response(200, result.rows[0]));
});

const update_recording = async_handler(async (req, res) => {
  const { id } = req.params;
  const { url } = req.body;
  
  if (!url) {
    throw new api_error(400, 'URL is required for update');
  }
  
  try {
    // First, get the current recording to validate it exists and check chat status
    const currentRecording = await pool.query(
      `SELECT r.id, c.closed_at FROM recordings r 
       JOIN chats c ON r.chat_id = c.id 
       WHERE r.id = $1`,
      [id]
    );
    
    if (currentRecording.rows.length === 0) {
      throw new api_error(404, 'Recording not found');
    }
    
    // Validate that the chat is not closed (cannot update recordings for closed chats)
    if (currentRecording.rows[0].closed_at) {
      throw new api_error(400, 'Cannot update recordings for closed chats');
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch (urlError) {
      throw new api_error(400, 'Invalid URL format');
    }
    
    const result = await pool.query(
      'UPDATE recordings SET url = $1 WHERE id = $2 RETURNING *',
      [url, id]
    );
    
    return res.status(200).json(new api_response(200, result.rows[0], 'Recording updated'));
  } catch (err) {
    if (err.status_code === 400 || err.status_code === 404) {
      throw err; // Re-throw our custom validation errors
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

const delete_recording = async_handler(async (req, res) => {
  const { id } = req.params;
  
  try {
    // First, get the current recording to check chat status
    const currentRecording = await pool.query(
      `SELECT r.id, c.closed_at FROM recordings r 
       JOIN chats c ON r.chat_id = c.id 
       WHERE r.id = $1`,
      [id]
    );
    
    if (currentRecording.rows.length === 0) {
      throw new api_error(404, 'Recording not found');
    }
    
    // Validate that the chat is not closed (cannot delete recordings for closed chats)
    if (currentRecording.rows[0].closed_at) {
      throw new api_error(400, 'Cannot delete recordings for closed chats');
    }
    
    const result = await pool.query('DELETE FROM recordings WHERE id = $1 RETURNING *', [id]);
    return res.status(200).json(new api_response(200, result.rows[0], 'Recording deleted'));
  } catch (err) {
    if (err.status_code === 400 || err.status_code === 404) {
      throw err; // Re-throw our custom validation errors
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

export {
  create_recording,
  get_recordings,
  get_recording_by_id,
  update_recording,
  delete_recording
}; 