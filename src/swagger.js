import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Support Hub API',
      version: '1.0.0',
      description: 'A comprehensive support hub backend system with tenant isolation, user management, ticket tracking, chat functionality, and activity monitoring.',
      contact: {
        name: 'Support Hub Team',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            status_code: {
              type: 'integer',
              example: 200
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            message: {
              type: 'string',
              example: 'Success'
            }
          }
        },
        ApiError: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error'
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        },
        Tenant: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'TNT_0000000001'
            },
            name: {
              type: 'string',
              example: 'Acme Corporation'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'CAT_0000000001'
            },
            tenant_id: {
              type: 'string',
              example: 'TNT_0000000001'
            },
            name: {
              type: 'string',
              example: 'Technical Support'
            },
            description: {
              type: 'string',
              example: 'Technical support tickets'
            }
          }
        },
        EscalationType: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'ESC_0000000001'
            },
            tenant_id: {
              type: 'string',
              example: 'TNT_0000000001'
            },
            label: {
              type: 'string',
              example: 'Urgent'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'USR_0000000001'
            },
            tenant_id: {
              type: 'string',
              example: 'TNT_0000000001'
            },
            name: {
              type: 'string',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              example: 'john@example.com'
            },
            role: {
              type: 'string',
              enum: ['admin', 'agent', 'customer'],
              example: 'customer'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Template: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'TPL_0000000001'
            },
            tenant_id: {
              type: 'string',
              example: 'TNT_0000000001'
            },
            category_id: {
              type: 'string',
              example: 'CAT_0000000001'
            },
            title: {
              type: 'string',
              example: 'Welcome Email'
            },
            body: {
              type: 'string',
              example: 'Welcome to our support system!'
            },
            type: {
              type: 'string',
              enum: ['email', 'sms', 'push'],
              example: 'email'
            }
          }
        },
        Ticket: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'TKT_0000000001'
            },
            tenant_id: {
              type: 'string',
              example: 'TNT_0000000001'
            },
            subject: {
              type: 'string',
              example: 'Login Issue'
            },
            description: {
              type: 'string',
              example: 'Cannot login to the system'
            },
            status: {
              type: 'string',
              enum: ['open', 'pending', 'closed', 'resolved'],
              example: 'open'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              example: 'medium'
            },
            category_id: {
              type: 'string',
              example: 'CAT_0000000001'
            },
            customer_id: {
              type: 'string',
              example: 'USR_0000000001'
            },
            agent_id: {
              type: 'string',
              example: 'USR_0000000002'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Chat: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'CHT_0000000001'
            },
            tenant_id: {
              type: 'string',
              example: 'TNT_0000000001'
            },
            ticket_id: {
              type: 'string',
              example: 'TKT_0000000001'
            },
            started_by_user_id: {
              type: 'string',
              example: 'USR_0000000001'
            },
            assigned_agent_id: {
              type: 'string',
              example: 'USR_0000000002'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            closed_at: {
              type: 'string',
              format: 'date-time',
              nullable: true
            }
          }
        },
        ChatMessage: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'MSG_0000000001'
            },
            chat_id: {
              type: 'string',
              example: 'CHT_0000000001'
            },
            sender_id: {
              type: 'string',
              example: 'USR_0000000001'
            },
            message: {
              type: 'string',
              example: 'Hello, I need help with my account'
            },
            sent_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Recording: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'REC_0000000001'
            },
            tenant_id: {
              type: 'string',
              example: 'TNT_0000000001'
            },
            ticket_id: {
              type: 'string',
              example: 'TKT_0000000001'
            },
            chat_id: {
              type: 'string',
              example: 'CHT_0000000001'
            },
            url: {
              type: 'string',
              example: 'https://example.com/recording.mp4'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Communication: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'COM_0000000001'
            },
            tenant_id: {
              type: 'string',
              example: 'TNT_0000000001'
            },
            ticket_id: {
              type: 'string',
              example: 'TKT_0000000001'
            },
            chat_id: {
              type: 'string',
              example: 'CHT_0000000001',
              nullable: true
            },
            type: {
              type: 'string',
              enum: ['email', 'sms', 'call', 'push'],
              example: 'email'
            },
            user_id: {
              type: 'string',
              example: 'USR_0000000002'
            },
            summary: {
              type: 'string',
              example: 'Follow-up call made to customer'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Escalation: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'ESC_0000000001'
            },
            ticket_id: {
              type: 'string',
              example: 'TKT_0000000001'
            },
            raised_by_user_id: {
              type: 'string',
              example: 'USR_0000000002'
            },
            type_id: {
              type: 'string',
              example: 'ESC_0000000001'
            },
            reason: {
              type: 'string',
              example: 'Customer requested escalation due to urgent issue'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        RecentActivity: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              example: 'ticket_created'
            },
            id: {
              type: 'string',
              example: 'TKT_0000000001'
            },
            tenant_id: {
              type: 'string',
              example: 'TNT_0000000001'
            },
            user_id: {
              type: 'string',
              example: 'USR_0000000001'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            entity_type: {
              type: 'string',
              example: 'ticket'
            },
            title: {
              type: 'string',
              example: 'Login Issue'
            },
            user: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  example: 'John Doe'
                },
                email: {
                  type: 'string',
                  example: 'john@example.com'
                },
                role: {
                  type: 'string',
                  example: 'customer'
                }
              }
            }
          }
        }
      },
      parameters: {
        tenantId: {
          name: 'tenant_id',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'Tenant ID'
        },
        entityId: {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'Entity ID'
        }
      }
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints'
      },
      {
        name: 'Tenants',
        description: 'Tenant management operations'
      },
      {
        name: 'Categories',
        description: 'Category management operations'
      },
      {
        name: 'Escalation Types',
        description: 'Escalation type management operations'
      },
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Templates',
        description: 'Template management operations'
      },
      {
        name: 'Tickets',
        description: 'Ticket management operations'
      },
      {
        name: 'Chats',
        description: 'Chat management operations'
      },
      {
        name: 'Chat Messages',
        description: 'Chat message operations'
      },
      {
        name: 'Recordings',
        description: 'Recording management operations'
      },
      {
        name: 'Communications',
        description: 'Communication tracking operations'
      },
      {
        name: 'Escalations',
        description: 'Escalation management operations'
      },
      {
        name: 'Recent Activities',
        description: 'Activity monitoring and history'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

export const specs = swaggerJsdoc(options); 