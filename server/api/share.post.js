import { nanoid } from 'nanoid';
import db from '../utils/db.js';

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

    const body = await readBody(event);
    const { data } = body;

    if (!data) {
        throw createError({ statusCode: 400, message: 'Data is required' });
    }

    const id = nanoid(10);

    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO shared_links (id, data, createdAt) VALUES (?, ?, ?)`,
            [id, JSON.stringify(data), new Date().toISOString()],
            function (err) {
                if (err) {
                    reject(
                        createError({ statusCode: 500, message: err.message })
                    );
                } else {
                    resolve({ id });
                }
            }
        );
    });
});
