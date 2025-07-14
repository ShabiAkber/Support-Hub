import app from './app.js';
import { pool } from './db/index.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test DB connection
    await pool.query('SELECT 1');
    console.log('Database connected successfully.');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to the database:', err);
    process.exit(1);
  }
}

startServer();
