import { pool } from '../db/index.js';

// Table prefixes for ID generation
const TABLE_PREFIXES = {
  tenants: 'TNT',
  categories: 'CAT', 
  escalation_types: 'ESC',
  users: 'USR',
  tickets: 'TKT',
  templates: 'TPL',
  chats: 'CHT',
  chat_msgs: 'MSG',
  recordings: 'REC',
  communications: 'COM',
  escalations: 'ESC',
  // recent_activities: 'ACT' -- removed, no longer needed
};

/**
 * Generate the next ID for a given table
 * @param {string} tableName - The name of the table
 * @returns {string} - The next ID in format PREFIX_0000000001
 */
export const generate_next_id = async (tableName) => {
  const prefix = TABLE_PREFIXES[tableName];
  if (!prefix) {
    throw new Error(`No prefix defined for table: ${tableName}`);
  }

  try {
    // Get the maximum ID for this table
    const result = await pool.query(
      `SELECT id FROM ${tableName} ORDER BY id DESC LIMIT 1`
    );

    let nextNumber = 1; // Default to 1 if no records exist

    if (result.rows.length > 0) {
      const maxId = result.rows[0].id;
      if (maxId && maxId.startsWith(prefix)) {
        // Extract the number part and increment
        const numberPart = maxId.substring(prefix.length + 1); // +1 for the underscore
        nextNumber = parseInt(numberPart, 10) + 1;
      }
    }

    // Format the number with leading zeros (10 digits)
    const formattedNumber = nextNumber.toString().padStart(10, '0');
    return `${prefix}_${formattedNumber}`;
  } catch (error) {
    throw new Error(`Error generating ID for table ${tableName}: ${error.message}`);
  }
};

// Individual functions for each table (for convenience)
export const generate_tenant_id = () => generate_next_id('tenants');
export const generate_category_id = () => generate_next_id('categories');
export const generate_escalation_type_id = () => generate_next_id('escalation_types');
export const generate_user_id = () => generate_next_id('users');
export const generate_ticket_id = () => generate_next_id('tickets');
export const generate_template_id = () => generate_next_id('templates');
export const generate_chat_id = () => generate_next_id('chats');
export const generate_chat_msg_id = () => generate_next_id('chat_msgs');
export const generate_recording_id = () => generate_next_id('recordings');
export const generate_communication_id = () => generate_next_id('communications');
export const generate_escalation_id = () => generate_next_id('escalations');
// export const generate_recent_activity_id = () => generate_next_id('recent_activities'); -- removed, no longer needed 