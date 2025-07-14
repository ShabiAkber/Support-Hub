import { pool } from '../db/index.js';
import { async_handler } from '../utils/async_handler.js';
import { api_error } from '../utils/api_error.js';
import { api_response } from '../utils/api_response.js';
import { generate_template_id } from '../utils/id_generator.js';

const create_template = async_handler(async (req, res) => {
  const { tenant_id, category_id, title, body, type } = req.body;
  if (!tenant_id || !category_id || !title || !body || !type) {
    throw new api_error(400, 'tenant_id, category_id, title, body, and type are required');
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
    
    const new_id = await generate_template_id();
    const result = await pool.query(
      'INSERT INTO templates (id, tenant_id, category_id, title, body, type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [new_id, tenant_id, category_id, title, body, type]
    );
    return res.status(201).json(new api_response(201, result.rows[0], 'Template created'));
  } catch (err) {
    if (err.status_code === 400) {
      throw err; // Re-throw our custom validation error
    }
    if (err.code === '23503') {
      throw new api_error(400, 'Invalid tenant_id or category_id');
    }
    if (err.code === '23505') {
      throw new api_error(409, 'A template with this title already exists for this tenant');
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

const get_templates = async_handler(async (req, res) => {
  const result = await pool.query('SELECT * FROM templates ORDER BY title ASC');
  return res.status(200).json(new api_response(200, result.rows));
});

const get_template_by_id = async_handler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM templates WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new api_error(404, 'Template not found');
  return res.status(200).json(new api_response(200, result.rows[0]));
});

const update_template = async_handler(async (req, res) => {
  const { id } = req.params;
  const { title, body, type } = req.body;
  
  try {
    // First, get the current template to validate tenant relationships
    const currentTemplate = await pool.query(
      'SELECT tenant_id FROM templates WHERE id = $1',
      [id]
    );
    
    if (currentTemplate.rows.length === 0) {
      throw new api_error(404, 'Template not found');
    }
    
    const tenant_id = currentTemplate.rows[0].tenant_id;
    
    // Validate that the title is not already used by another template in the same tenant
    if (title) {
      const titleCheck = await pool.query(
        'SELECT id FROM templates WHERE title = $1 AND tenant_id = $2 AND id != $3',
        [title, tenant_id, id]
      );
      
      if (titleCheck.rows.length > 0) {
        throw new api_error(409, 'A template with this title already exists for this tenant');
      }
    }
    
    const result = await pool.query(
      'UPDATE templates SET title = $1, body = $2, type = $3 WHERE id = $4 RETURNING *',
      [title, body, type, id]
    );
    
    return res.status(200).json(new api_response(200, result.rows[0], 'Template updated'));
  } catch (err) {
    if (err.status_code === 400 || err.status_code === 404 || err.status_code === 409) {
      throw err; // Re-throw our custom validation errors
    }
    if (err.code === '23505') {
      throw new api_error(409, 'A template with this title already exists for this tenant');
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

const delete_template = async_handler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM templates WHERE id = $1 RETURNING *', [id]);
  if (result.rows.length === 0) throw new api_error(404, 'Template not found');
  return res.status(200).json(new api_response(200, result.rows[0], 'Template deleted'));
});

export {
  create_template,
  get_templates,
  get_template_by_id,
  update_template,
  delete_template
}; 