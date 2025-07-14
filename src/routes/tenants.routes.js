import { Router } from 'express';
import {
  create_tenant,
  get_tenants,
  get_tenant_by_id,
  update_tenant,
  delete_tenant
} from '../controllers/tenants.controller.js';

const router = Router();

router.post('/create_tenant', create_tenant);
router.get('/get_tenants', get_tenants);
router.get('/get_tenant_by_id/:id', get_tenant_by_id);
router.put('/update_tenant/:id', update_tenant);
router.delete('/delete_tenant/:id', delete_tenant);

export default router; 