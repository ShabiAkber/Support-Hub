import { pool } from '../db/index.js';
import { async_handler } from '../utils/async_handler.js';
import { api_error } from '../utils/api_error.js';
import { api_response } from '../utils/api_response.js';
import { generate_escalation_type_id } from '../utils/id_generator.js';

const create_escalation_type = async_handler(async (req, res) => {
  const { tenant_id, label } = req.body;
  if (!tenant_id || !label) throw new api_error(400, 'tenant_id and label are required');
  try {
    const new_id = await generate_escalation_type_id();
    const result = await pool.query(
      'INSERT INTO escalation_types (id, tenant_id, label) VALUES ($1, $2, $3) RETURNING *',
      [new_id, tenant_id, label]
    );
    return res.status(201).json(new api_response(201, result.rows[0], 'Escalation type created'));
  } catch (err) {
    if (err.code === '23505') {
      throw new api_error(409, 'An escalation type with this label already exists for this tenant');
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

const get_escalation_types = async_handler(async (req, res) => {
  const result = await pool.query('SELECT * FROM escalation_types ORDER BY label ASC');
  return res.status(200).json(new api_response(200, result.rows));
});

const get_escalation_type_by_id = async_handler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM escalation_types WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new api_error(404, 'Escalation type not found');
  return res.status(200).json(new api_response(200, result.rows[0]));
});

const update_escalation_type = async_handler(async (req, res) => {
  const { id } = req.params;
  const { label } = req.body;
  try {
    const result = await pool.query(
      'UPDATE escalation_types SET label = $1 WHERE id = $2 RETURNING *',
      [label, id]
    );
    if (result.rows.length === 0) throw new api_error(404, 'Escalation type not found');
    return res.status(200).json(new api_response(200, result.rows[0], 'Escalation type updated'));
  } catch (err) {
    if (err.code === '23505') {
      throw new api_error(409, 'An escalation type with this label already exists for this tenant');
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

const delete_escalation_type = async_handler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM escalation_types WHERE id = $1 RETURNING *', [id]);
  if (result.rows.length === 0) throw new api_error(404, 'Escalation type not found');
  return res.status(200).json(new api_response(200, result.rows[0], 'Escalation type deleted'));
});

export {
  create_escalation_type,
  get_escalation_types,
  get_escalation_type_by_id,
  update_escalation_type,
  delete_escalation_type
}; 