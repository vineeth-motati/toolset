import express from 'express';
import { nanoid } from 'nanoid';
import db from './db.mjs';
import cors from 'cors';
const app = express();

// Parse JSON request bodies
app.use(express.json());

// Enable CORS
app.use(cors());

// Enable CORS for all OPTIONS requests
app.options('*', cors());

// Define API routes
app.post('/api/share', (req, res) => {
    const { data } = req.body;
    const id = nanoid(10);

    db.run(
        `INSERT INTO shared_links (id, data, createdAt) VALUES (?, ?, ?)`,
        [id, JSON.stringify(data), new Date().toISOString()],
        function (err) {
            if (err) return res.status(500).send(err.message);
            res.status(201).send({ id });
        }
    );
});
app.get('/api/share/:id', (req, res) => {
    const { id } = req.params;

    db.get(`SELECT data FROM shared_links WHERE id = ?`, [id], (err, row) => {
        if (err) return res.status(500).send(err.message);
        if (!row) return res.status(404).send('Not Found');
        res.send(JSON.parse(row.data)); // Send back the full structured data
    });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
