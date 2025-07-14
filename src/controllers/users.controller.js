import { pool } from '../db/index.js';
import { async_handler } from '../utils/async_handler.js';
import { api_error } from '../utils/api_error.js';
import { api_response } from '../utils/api_response.js';
import { generate_user_id } from '../utils/id_generator.js';

const create_user = async_handler(async (req, res) => {
  const { tenant_id, name, email, role } = req.body;
  if (!tenant_id || !name || !email || !role) throw new api_error(400, 'tenant_id, name, email, and role are required');
  try {
    const new_id = await generate_user_id();
    const result = await pool.query(
      'INSERT INTO users (id, tenant_id, name, email, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
      [new_id, tenant_id, name, email, role]
    );
    return res.status(201).json(new api_response(201, result.rows[0], 'User created'));
  } catch (err) {
    if (err.code === '23505') {
      throw new api_error(409, 'A user with this email already exists');
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

const get_users = async_handler(async (req, res) => {
  const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
  return res.status(200).json(new api_response(200, result.rows));
});

const get_user_by_id = async_handler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new api_error(404, 'User not found');
  return res.status(200).json(new api_response(200, result.rows[0]));
});

const update_user = async_handler(async (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2, role = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [name, email, role, id]
    );
    if (result.rows.length === 0) throw new api_error(404, 'User not found');
    return res.status(200).json(new api_response(200, result.rows[0], 'User updated'));
  } catch (err) {
    if (err.code === '23505') {
      throw new api_error(409, 'A user with this email already exists');
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

const delete_user = async_handler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
  if (result.rows.length === 0) throw new api_error(404, 'User not found');
  return res.status(200).json(new api_response(200, result.rows[0], 'User deleted'));
});

export {
  create_user,
  get_users,
  get_user_by_id,
  update_user,
  delete_user
}; 