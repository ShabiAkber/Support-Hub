import { pool } from '../db/index.js';
import { async_handler } from '../utils/async_handler.js';
import { api_error } from '../utils/api_error.js';
import { api_response } from '../utils/api_response.js';

const get_recent_activities = async_handler(async (req, res) => {
  const { 
    entity_type, 
    tenant_id, 
    limit = 20, 
    offset = 0,
    days = 30 
  } = req.query;

  // Validate limit and offset
  const parsedLimit = parseInt(limit);
  const parsedOffset = parseInt(offset);
  const parsedDays = parseInt(days);

  if (parsedLimit < 1 || parsedLimit > 100) {
    throw new api_error(400, 'Limit must be between 1 and 100');
  }

  if (parsedOffset < 0) {
    throw new api_error(400, 'Offset must be 0 or greater');
  }

  if (parsedDays < 1 || parsedDays > 365) {
    throw new api_error(400, 'Days must be between 1 and 365');
  }

  try {
    let activities = [];
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - parsedDays);

    // Build the base query based on entity type filter
    if (!entity_type || entity_type === 'all') {
      // Get activities from all entities
      const allActivitiesQuery = `
        (SELECT 
          'ticket_created' as action,
          id,
          tenant_id,
          customer_id as user_id,
          created_at,
          'ticket' as entity_type,
          subject as title
        FROM tickets 
        WHERE created_at >= $1)
        UNION ALL
        (SELECT 
          'ticket_updated' as action,
          id,
          tenant_id,
          customer_id as user_id,
          updated_at as created_at,
          'ticket' as entity_type,
          subject as title
        FROM tickets 
        WHERE updated_at >= $1 AND updated_at != created_at)
        UNION ALL
        (SELECT 
          'chat_started' as action,
          id,
          tenant_id,
          started_by_user_id as user_id,
          created_at,
          'chat' as entity_type,
          'Chat started' as title
        FROM chats 
        WHERE created_at >= $1)
        UNION ALL
        (SELECT 
          'chat_closed' as action,
          id,
          tenant_id,
          started_by_user_id as user_id,
          closed_at as created_at,
          'chat' as entity_type,
          'Chat closed' as title
        FROM chats 
        WHERE closed_at >= $1)
        UNION ALL
        (SELECT 
          'escalation_raised' as action,
          id,
          (SELECT tenant_id FROM tickets WHERE id = e.ticket_id) as tenant_id,
          raised_by_user_id as user_id,
          created_at,
          'escalation' as entity_type,
          'Escalation raised' as title
        FROM escalations e
        WHERE created_at >= $1)
        UNION ALL
        (SELECT 
          'communication_created' as action,
          id,
          tenant_id,
          user_id,
          created_at,
          'communication' as entity_type,
          type::VARCHAR as title
        FROM communications 
        WHERE created_at >= $1)
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await pool.query(allActivitiesQuery, [sinceDate, parsedLimit, parsedOffset]);
      activities = result.rows;

    } else {
      // Get activities for specific entity type
      switch (entity_type) {
        case 'tickets':
          const ticketsQuery = `
            (SELECT 
              'ticket_created' as action,
              id,
              tenant_id,
              customer_id as user_id,
              created_at,
              'ticket' as entity_type,
              subject as title
            FROM tickets 
            WHERE created_at >= $1)
            UNION ALL
            (SELECT 
              'ticket_updated' as action,
              id,
              tenant_id,
              customer_id as user_id,
              updated_at as created_at,
              'ticket' as entity_type,
              subject as title
            FROM tickets 
            WHERE updated_at >= $1 AND updated_at != created_at)
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
          `;
          const ticketsResult = await pool.query(ticketsQuery, [sinceDate, parsedLimit, parsedOffset]);
          activities = ticketsResult.rows;
          break;

        case 'chats':
          const chatsQuery = `
            (SELECT 
              'chat_started' as action,
              id,
              tenant_id,
              started_by_user_id as user_id,
              created_at,
              'chat' as entity_type,
              'Chat started' as title
            FROM chats 
            WHERE created_at >= $1)
            UNION ALL
            (SELECT 
              'chat_closed' as action,
              id,
              tenant_id,
              started_by_user_id as user_id,
              closed_at as created_at,
              'chat' as entity_type,
              'Chat closed' as title
            FROM chats 
            WHERE closed_at >= $1)
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
          `;
          const chatsResult = await pool.query(chatsQuery, [sinceDate, parsedLimit, parsedOffset]);
          activities = chatsResult.rows;
          break;

        case 'escalations':
          const escalationsQuery = `
            SELECT 
              'escalation_raised' as action,
              id,
              (SELECT tenant_id FROM tickets WHERE id = e.ticket_id) as tenant_id,
              raised_by_user_id as user_id,
              created_at,
              'escalation' as entity_type,
              'Escalation raised' as title
            FROM escalations e
            WHERE created_at >= $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
          `;
          const escalationsResult = await pool.query(escalationsQuery, [sinceDate, parsedLimit, parsedOffset]);
          activities = escalationsResult.rows;
          break;

        case 'communications':
          const communicationsQuery = `
            SELECT 
              'communication_created' as action,
              id,
              tenant_id,
              user_id,
              created_at,
              'communication' as entity_type,
              type::VARCHAR as title
            FROM communications 
            WHERE created_at >= $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
          `;
          const communicationsResult = await pool.query(communicationsQuery, [sinceDate, parsedLimit, parsedOffset]);
          activities = communicationsResult.rows;
          break;

        default:
          throw new api_error(400, 'Invalid entity_type. Must be one of: all, tickets, chats, escalations, communications');
      }
    }

    // Filter by tenant_id if provided
    if (tenant_id) {
      activities = activities.filter(activity => activity.tenant_id === tenant_id);
    }

    // Get user details for each activity
    const activitiesWithUsers = await Promise.all(
      activities.map(async (activity) => {
        if (activity.user_id) {
          const userResult = await pool.query(
            'SELECT name, email, role FROM users WHERE id = $1',
            [activity.user_id]
          );
          return {
            ...activity,
            user: userResult.rows[0] || null
          };
        }
        return {
          ...activity,
          user: null
        };
      })
    );

    // Get total count for pagination
    let totalCount = 0;
    if (!entity_type || entity_type === 'all') {
      const countQuery = `
        SELECT COUNT(*) as total FROM (
          (SELECT id FROM tickets WHERE created_at >= $1)
          UNION ALL
          (SELECT id FROM tickets WHERE updated_at >= $1 AND updated_at != created_at)
          UNION ALL
          (SELECT id FROM chats WHERE created_at >= $1)
          UNION ALL
          (SELECT id FROM chats WHERE closed_at >= $1)
          UNION ALL
          (SELECT id FROM escalations WHERE created_at >= $1)
          UNION ALL
          (SELECT id FROM communications WHERE created_at >= $1)
        ) as all_activities
      `;
      const countResult = await pool.query(countQuery, [sinceDate]);
      totalCount = parseInt(countResult.rows[0].total);
    } else {
      // Count for specific entity type
      let countQuery = '';
      switch (entity_type) {
        case 'tickets':
          countQuery = `
            SELECT COUNT(*) as total FROM (
              (SELECT id FROM tickets WHERE created_at >= $1)
              UNION ALL
              (SELECT id FROM tickets WHERE updated_at >= $1 AND updated_at != created_at)
            ) as ticket_activities
          `;
          break;
        case 'chats':
          countQuery = `
            SELECT COUNT(*) as total FROM (
              (SELECT id FROM chats WHERE created_at >= $1)
              UNION ALL
              (SELECT id FROM chats WHERE closed_at >= $1)
            ) as chat_activities
          `;
          break;
        case 'escalations':
          countQuery = 'SELECT COUNT(*) as total FROM escalations WHERE created_at >= $1';
          break;
        case 'communications':
          countQuery = 'SELECT COUNT(*) as total FROM communications WHERE created_at >= $1';
          break;
      }
      const countResult = await pool.query(countQuery, [sinceDate]);
      totalCount = parseInt(countResult.rows[0].total);
    }

    return res.status(200).json(new api_response(200, {
      activities: activitiesWithUsers,
      pagination: {
        total: totalCount,
        limit: parsedLimit,
        offset: parsedOffset,
        has_more: (parsedOffset + parsedLimit) < totalCount
      },
      filters: {
        entity_type: entity_type || 'all',
        tenant_id: tenant_id || null,
        days: parsedDays
      }
    }, 'Recent activities retrieved successfully'));

  } catch (err) {
    if (err.status_code === 400) {
      throw err; // Re-throw our custom validation errors
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

const get_activity_by_id = async_handler(async (req, res) => {
  const { id, entity_type } = req.params;
  
  if (!entity_type) {
    throw new api_error(400, 'entity_type is required');
  }

  try {
    let activity = null;

    switch (entity_type) {
      case 'ticket':
        const ticketResult = await pool.query(
          'SELECT id, tenant_id, customer_id as user_id, created_at, updated_at, subject as title FROM tickets WHERE id = $1',
          [id]
        );
        if (ticketResult.rows.length > 0) {
          const ticket = ticketResult.rows[0];
          activity = {
            id: ticket.id,
            tenant_id: ticket.tenant_id,
            user_id: ticket.user_id,
            created_at: ticket.created_at,
            updated_at: ticket.updated_at,
            entity_type: 'ticket',
            title: ticket.title,
            actions: ['ticket_created']
          };
          if (ticket.updated_at !== ticket.created_at) {
            activity.actions.push('ticket_updated');
          }
        }
        break;

      case 'chat':
        const chatResult = await pool.query(
          'SELECT id, tenant_id, started_by_user_id as user_id, created_at, closed_at, "Chat" as title FROM chats WHERE id = $1',
          [id]
        );
        if (chatResult.rows.length > 0) {
          const chat = chatResult.rows[0];
          activity = {
            id: chat.id,
            tenant_id: chat.tenant_id,
            user_id: chat.user_id,
            created_at: chat.created_at,
            closed_at: chat.closed_at,
            entity_type: 'chat',
            title: chat.title,
            actions: ['chat_started']
          };
          if (chat.closed_at) {
            activity.actions.push('chat_closed');
          }
        }
        break;

      case 'escalation':
        const escalationResult = await pool.query(
          `SELECT e.id, t.tenant_id, e.raised_by_user_id as user_id, e.created_at, 'Escalation' as title
           FROM escalations e
           JOIN tickets t ON e.ticket_id = t.id
           WHERE e.id = $1`,
          [id]
        );
        if (escalationResult.rows.length > 0) {
          const escalation = escalationResult.rows[0];
          activity = {
            id: escalation.id,
            tenant_id: escalation.tenant_id,
            user_id: escalation.user_id,
            created_at: escalation.created_at,
            entity_type: 'escalation',
            title: escalation.title,
            actions: ['escalation_raised']
          };
        }
        break;

      case 'communication':
        const communicationResult = await pool.query(
          'SELECT id, tenant_id, user_id, created_at, type::VARCHAR as title FROM communications WHERE id = $1',
          [id]
        );
        if (communicationResult.rows.length > 0) {
          const communication = communicationResult.rows[0];
          activity = {
            id: communication.id,
            tenant_id: communication.tenant_id,
            user_id: communication.user_id,
            created_at: communication.created_at,
            entity_type: 'communication',
            title: communication.title,
            actions: ['communication_created']
          };
        }
        break;

      default:
        throw new api_error(400, 'Invalid entity_type. Must be one of: ticket, chat, escalation, communication');
    }

    if (!activity) {
      throw new api_error(404, `${entity_type} not found`);
    }

    // Get user details
    if (activity.user_id) {
      const userResult = await pool.query(
        'SELECT name, email, role FROM users WHERE id = $1',
        [activity.user_id]
      );
      activity.user = userResult.rows[0] || null;
    } else {
      activity.user = null;
    }

    return res.status(200).json(new api_response(200, activity, 'Activity retrieved successfully'));

  } catch (err) {
    if (err.status_code === 400 || err.status_code === 404) {
      throw err; // Re-throw our custom validation errors
    }
    throw new api_error(500, 'Database error', [], err.stack);
  }
});

export {
  get_recent_activities,
  get_activity_by_id
}; 