import db from '../../utils/db.js';

export default defineEventHandler(async (event) => {
  // Set CORS headers
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*', // Allow all origins (or specify your domain)
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // Specify allowed methods
    'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Specify allowed headers
  });

  // Handle OPTIONS preflight request
  if (event.node.req.method === 'OPTIONS') {
    return { status: 'ok' }; // Return an empty 200 response for preflight
  }

  const { id } = event.context.params;

  return new Promise((resolve, reject) => {
    db.get(`SELECT data FROM shared_links WHERE id = ?`, [id], (err, row) => {
      if (err) {
        reject(createError({ statusCode: 500, message: err.message }));
      } else if (!row) {
        reject(createError({ statusCode: 404, message: 'Not Found' }));
      } else {
        resolve(JSON.parse(row.data));
      }
    });
  });
});
