import { pool } from '../db/index.js';
import { async_handler } from '../utils/async_handler.js';
import { api_error } from '../utils/api_error.js';
import { api_response } from '../utils/api_response.js';
import { generate_tenant_id } from '../utils/id_generator.js';

/**
 * @swagger
 * /v1/api/tenants/create_tenant:
 *   post:
 *     summary: Create a new tenant
 *     tags: [Tenants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tenant name (must be unique)
 *                 example: "Acme Corporation"
 *     responses:
 *       201:
 *         description: Tenant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: Conflict - tenant with this name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
const create_tenant = async_handler(async (req, res) => {
  const { name } = req.body;
  if (!name) throw new api_error(400, 'Name is required');
  try {
    const new_id = await generate_tenant_id();
    const result = await pool.query(
      'INSERT INTO tenants (id, name, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING *',
      [new_id, name]
    );
    return res.status(201).json(new api_response(201, result.rows[0], 'Tenant created'));
  } catch (err) {
    if (err.code === '23505') {
      // Unique violation
      throw new api_error(409, 'A tenant with this name already exists');
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

/**
 * @swagger
 * /v1/api/tenants/get_tenants:
 *   get:
 *     summary: Get all tenants
 *     tags: [Tenants]
 *     responses:
 *       200:
 *         description: List of all tenants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status_code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tenant'
 *                 message:
 *                   type: string
 *                   example: "Success"
 */
const get_tenants = async_handler(async (req, res) => {
  const result = await pool.query('SELECT * FROM tenants ORDER BY created_at DESC');
  return res.status(200).json(new api_response(200, result.rows));
});

const get_tenant_by_id = async_handler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM tenants WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new api_error(404, 'Tenant not found');
  return res.status(200).json(new api_response(200, result.rows[0]));
});

const update_tenant = async_handler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tenants SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [name, id]
    );
    if (result.rows.length === 0) throw new api_error(404, 'Tenant not found');
    return res.status(200).json(new api_response(200, result.rows[0], 'Tenant updated'));
  } catch (err) {
    if (err.code === '23505') {
      throw new api_error(409, 'A tenant with this name already exists');
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

const delete_tenant = async_handler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM tenants WHERE id = $1 RETURNING *', [id]);
  if (result.rows.length === 0) throw new api_error(404, 'Tenant not found');
  return res.status(200).json(new api_response(200, result.rows[0], 'Tenant deleted'));
});

export {
  create_tenant,
  get_tenants,
  get_tenant_by_id,
  update_tenant,
  delete_tenant
}; 