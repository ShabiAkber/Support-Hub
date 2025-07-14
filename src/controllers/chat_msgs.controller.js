import { pool } from '../db/index.js';
import { async_handler } from '../utils/async_handler.js';
import { api_error } from '../utils/api_error.js';
import { api_response } from '../utils/api_response.js';
import { generate_chat_msg_id } from '../utils/id_generator.js';

const create_chat_msg = async_handler(async (req, res) => {
  const { chat_id, sender_id, message } = req.body;
  if (!chat_id || !sender_id || !message) {
    throw new api_error(400, 'chat_id, sender_id, and message are required');
  }
  
  try {
    // Get the chat to validate tenant relationships
    const chatCheck = await pool.query(
      'SELECT tenant_id FROM chats WHERE id = $1',
      [chat_id]
    );
    
    if (chatCheck.rows.length === 0) {
      throw new api_error(400, 'Chat not found');
    }
    
    const tenant_id = chatCheck.rows[0].tenant_id;
    
    // Get the chat details to validate sender authorization
    const chatDetails = await pool.query(
      'SELECT c.started_by_user_id, c.assigned_agent_id, c.closed_at, t.customer_id FROM chats c JOIN tickets t ON c.ticket_id = t.id WHERE c.id = $1',
      [chat_id]
    );
    
    if (chatDetails.rows.length === 0) {
      throw new api_error(400, 'Chat not found');
    }
    
    const { started_by_user_id, assigned_agent_id, closed_at, customer_id } = chatDetails.rows[0];
    
    // Validate that the sender belongs to the same tenant as the chat
    const senderCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
      [sender_id, tenant_id]
    );
    
    if (senderCheck.rows.length === 0) {
      throw new api_error(400, 'Sender does not belong to the chat\'s tenant');
    }
    
    // Validate that the chat is not closed
    if (closed_at) {
      throw new api_error(400, 'Cannot send messages to a closed chat');
    }
    
    // Validate that the sender is authorized to send messages in this chat
    // Only the chat starter, assigned agent, or ticket customer can send messages
    if (sender_id !== started_by_user_id && sender_id !== assigned_agent_id && sender_id !== customer_id) {
      throw new api_error(403, 'Only the chat starter, assigned agent, or ticket customer can send messages in this chat');
    }
    
    const new_id = await generate_chat_msg_id();
    const result = await pool.query(
      'INSERT INTO chat_msgs (id, chat_id, sender_id, message, sent_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [new_id, chat_id, sender_id, message]
    );
    return res.status(201).json(new api_response(201, result.rows[0], 'Chat message created'));
  } catch (err) {
    if (err.status_code === 400) {
      throw err; // Re-throw our custom validation error
    }
    if (err.code === '23503') {
      throw new api_error(400, 'Invalid chat_id or sender_id');
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

const get_chat_msgs = async_handler(async (req, res) => {
  const result = await pool.query('SELECT * FROM chat_msgs ORDER BY sent_at ASC');
  return res.status(200).json(new api_response(200, result.rows));
});

const get_chat_msg_by_id = async_handler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM chat_msgs WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new api_error(404, 'Chat message not found');
  return res.status(200).json(new api_response(200, result.rows[0]));
});

const update_chat_msg = async_handler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  
  try {
    // First, get the current chat message to validate it exists
    const currentMessage = await pool.query(
      'SELECT cm.id, c.closed_at FROM chat_msgs cm JOIN chats c ON cm.chat_id = c.id WHERE cm.id = $1',
      [id]
    );
    
    if (currentMessage.rows.length === 0) {
      throw new api_error(404, 'Chat message not found');
    }
    
    // Validate that the chat is not closed (cannot edit messages in closed chats)
    if (currentMessage.rows[0].closed_at) {
      throw new api_error(400, 'Cannot edit messages in a closed chat');
    }
    
    const result = await pool.query(
      'UPDATE chat_msgs SET message = $1 WHERE id = $2 RETURNING *',
      [message, id]
    );
    
    return res.status(200).json(new api_response(200, result.rows[0], 'Chat message updated'));
  } catch (err) {
    if (err.status_code === 400 || err.status_code === 404) {
      throw err; // Re-throw our custom validation errors
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

const delete_chat_msg = async_handler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM chat_msgs WHERE id = $1 RETURNING *', [id]);
  if (result.rows.length === 0) throw new api_error(404, 'Chat message not found');
  return res.status(200).json(new api_response(200, result.rows[0], 'Chat message deleted'));
});

export {
  create_chat_msg,
  get_chat_msgs,
  get_chat_msg_by_id,
  update_chat_msg,
  delete_chat_msg
}; 