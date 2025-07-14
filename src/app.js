import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { api_error } from './utils/api_error.js';
import { api_response } from './utils/api_response.js';
import { async_handler } from './utils/async_handler.js';
import { specs } from './swagger.js';
import tenants_controller from './routes/tenants.routes.js';
import categories_controller from './routes/categories.routes.js';
import escalation_types_controller from './routes/escalation_types.routes.js';
import users_controller from './routes/users.routes.js';
import templates_controller from './routes/templates.routes.js';
import tickets_controller from './routes/tickets.routes.js';
import chats_controller from './routes/chats.routes.js';
import chat_msgs_controller from './routes/chat_msgs.routes.js';
import recordings_controller from './routes/recordings.routes.js';
import communications_controller from './routes/communications.routes.js';
import escalations_controller from './routes/escalations.routes.js';
import recent_activities_controller from './routes/recent_activities.routes.js';

const app = express();

app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Support Hub API Documentation'
}));

// Health check route
app.get('/health', (req, res) => {
  return res.json(new api_response(200, null, 'OK'));
});

// Error handler
app.use((err, req, res, next) => {
  const status = err.status_code || 500;
  res.status(status).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    errors: err.errors || [],
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

app.use('/v1/api/tenants', tenants_controller);
app.use('/v1/api/categories', categories_controller);
app.use('/v1/api/escalation_types', escalation_types_controller);
app.use('/v1/api/users', users_controller);
app.use('/v1/api/templates', templates_controller);
app.use('/v1/api/tickets', tickets_controller);
app.use('/v1/api/chats', chats_controller);
app.use('/v1/api/chat_msgs', chat_msgs_controller);
app.use('/v1/api/recordings', recordings_controller);
app.use('/v1/api/communications', communications_controller);
app.use('/v1/api/escalations', escalations_controller);
app.use('/v1/api/recent_activities', recent_activities_controller);

export default app;
