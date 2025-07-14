import { pool } from '../db/index.js';
import { async_handler } from '../utils/async_handler.js';
import { api_error } from '../utils/api_error.js';
import { api_response } from '../utils/api_response.js';
import { generate_category_id } from '../utils/id_generator.js';

const create_category = async_handler(async (req, res) => {
  const { tenant_id, name, description } = req.body;
  if (!tenant_id || !name) throw new api_error(400, 'tenant_id and name are required');
  try {
    const new_id = await generate_category_id();
    const result = await pool.query(
      'INSERT INTO categories (id, tenant_id, name, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [new_id, tenant_id, name, description || null]
    );
    return res.status(201).json(new api_response(201, result.rows[0], 'Category created'));
  } catch (err) {
    if (err.code === '23505') {
      throw new api_error(409, 'A category with this name already exists for this tenant');
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

const get_categories = async_handler(async (req, res) => {
  const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
  return res.status(200).json(new api_response(200, result.rows));
});

const get_category_by_id = async_handler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new api_error(404, 'Category not found');
  return res.status(200).json(new api_response(200, result.rows[0]));
});

const update_category = async_handler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const result = await pool.query(
      'UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description || null, id]
    );
    if (result.rows.length === 0) throw new api_error(404, 'Category not found');
    return res.status(200).json(new api_response(200, result.rows[0], 'Category updated'));
  } catch (err) {
    if (err.code === '23505') {
      throw new api_error(409, 'A category with this name already exists for this tenant');
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

const delete_category = async_handler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
  if (result.rows.length === 0) throw new api_error(404, 'Category not found');
  return res.status(200).json(new api_response(200, result.rows[0], 'Category deleted'));
});

export {
  create_category,
  get_categories,
  get_category_by_id,
  update_category,
  delete_category
}; 