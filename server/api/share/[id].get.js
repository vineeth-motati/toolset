import db from '../../utils/db.js';

export default defineEventHandler(async (event) => {
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
