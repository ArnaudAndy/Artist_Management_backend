const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const server = express();

// Use CORS middleware to allow requests from your Angular frontend
server.use(cors());
server.use(bodyParser.json());

// Configure storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Directory where files will be saved
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    },
});

const upload = multer({ storage });

// Serve uploaded files statically
server.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Establish the database connection
const db = mysql.createConnection({
    host: 'burgamjq2x0ycsadlhmj-mysql.services.clever-cloud.com',
    user: 'uikmbpwbuz6gzjfa',
    password: 'jZEZKgQqlMeH8LozCzEH',
    database: 'burgamjq2x0ycsadlhmj',
});

db.connect((error) => {
    if (error) {
        console.log('Error Connecting to DB');
    } else {
        console.log('Successfully Connected to DB');
    }
});

// Establish the Port
server.listen(8085, (error) => {
    if (error) {
        console.log('Error starting server');
    } else {
        console.log('Server started on port 8085');
    }
});

// Endpoint to upload an image
server.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send({ status: false, message: 'No file uploaded' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.status(200).send({ status: true, imageUrl });
});

// Check if Artist with same name or stage name exists
server.get('/api/artists/checkDuplicate', (req, res) => {
    const { name, stage_name } = req.query;

    const checkDuplicateQuery = 'SELECT * FROM Artists WHERE name = ? OR stage_name = ?';
    db.query(checkDuplicateQuery, [name, stage_name], (error, result) => {
        if (error) {
            res.send({ status: false, message: 'Error checking for duplicate artist' });
        } else {
            if (result.length > 0) {
                res.send({ status: false, message: 'An artist with the same name or stage name already exists' });
            } else {
                res.send({ status: true });
            }
        }
    });
});

// Create an Artist with duplicate check
server.post('/api/artists', (req, res) => {
    const { name, stage_name, albums_count, social_links, record_label, publishing_house, career_start_date, image_url } = req.body;

    // Check if an artist with the same name or stage name already exists
    const checkDuplicateQuery = 'SELECT * FROM Artists WHERE name = ? OR stage_name = ?';
    db.query(checkDuplicateQuery, [name, stage_name], (error, result) => {
        if (result.length > 0) {
            // If artist already exists
            res.send({ status: false, message: 'An artist with the same name or stage name already exists' });
        } else {
            // Proceed with inserting new artist
            const details = {
                image_url,
                name,
                stage_name,
                albums_count,
                social_links,
                record_label,
                publishing_house,
                career_start_date,
            };
            const sql = 'INSERT INTO Artists SET ?';
            db.query(sql, details, (error) => {
                if (error) {
                    res.send({ status: false, message: 'Artist creation failed' });
                } else {
                    res.send({ status: true, message: 'Artist created successfully' });
                }
            });
        }
    });
});

// View all Artists (with Pagination)
server.get('/api/artists', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const sql = `SELECT * FROM Artists LIMIT ${limit} OFFSET ${offset}`;
    db.query(sql, (error, result) => {
        if (error) {
            res.send({ status: false, message: 'Error fetching artists' });
        } else {
            res.send({ status: true, data: result });
        }
    });
});

// Get an Artist by ID
server.get('/api/artists/:id', (req, res) => {
    const artistId = req.params.id;
    const sql = 'SELECT * FROM Artists WHERE artist_id = ?';
    db.query(sql, [artistId], (error, result) => {
        if (error) {
            res.send({ status: false, message: 'Error fetching artist' });
        } else {
            res.send({ status: true, data: result });
        }
    });
});

// Update an Artist
server.put('/api/artists/:id', (req, res) => {
    const artistId = req.params.id;
    const details = {
        image_url: req.body.image_url,
        name: req.body.name,
        stage_name: req.body.stage_name,
        albums_count: req.body.albums_count,
        social_links: req.body.social_links,
        record_label: req.body.record_label,
        publishing_house: req.body.publishing_house,
        career_start_date: req.body.career_start_date,
    };

    const sql = 'UPDATE Artists SET ? WHERE artist_id = ?';
    db.query(sql, [details, artistId], (error) => {
        if (error) {
            res.send({ status: false, message: 'Artist update failed' });
        } else {
            res.send({ status: true, message: 'Artist updated successfully' });
        }
    });
});

// Delete an Artist
server.delete('/api/artists/:id', (req, res) => {
    const artistId = req.params.id;
    const sql = 'DELETE FROM Artists WHERE artist_id = ?';
    db.query(sql, [artistId], (error) => {
        if (error) {
            res.send({ status: false, message: 'Artist deletion failed' });
        } else {
            res.send({ status: true, message: 'Artist deleted successfully' });
        }
    });
});

// Rate an Artist
server.post('/api/artists/:id/rate', (req, res) => {
    const artistId = req.params.id;
    const userId = req.body.user_id;
    const ratingValue = req.body.rating_value;

    const checkDuplicate = 'SELECT * FROM Ratings WHERE artist_id = ? AND user_id = ?';
    db.query(checkDuplicate, [artistId, userId], (error, result) => {
        if (result.length > 0) {
            res.send({ status: false, message: 'You have already rated this artist' });
        } else {
            const sql = 'INSERT INTO Ratings (artist_id, user_id, rating_value) VALUES (?, ?, ?)';
            db.query(sql, [artistId, userId, ratingValue], (error) => {
                if (error) {
                    res.send({ status: false, message: 'Rating failed' });
                } else {
                    const avgRatingQuery = 'SELECT AVG(rating_value) AS avg_rating FROM Ratings WHERE artist_id = ?';
                    db.query(avgRatingQuery, [artistId], (error, result) => {
                        if (error) {
                            res.send({ status: false, message: 'Error calculating average rating' });
                        } else {
                            const avgRating = result[0].avg_rating;
                            const updateRating = 'UPDATE Artists SET rating = ? WHERE artist_id = ?';
                            db.query(updateRating, [avgRating, artistId], (error) => {
                                if (error) {
                                    res.send({ status: false, message: 'Error updating artist rating' });
                                } else {
                                    res.send({ status: true, message: 'Rating submitted successfully' });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

// Search Artists based on multiple attributes
server.get('/api/artists/search', (req, res) => {
    const { name, stage_name, albums_count, record_label, publishing_house, career_start_date } = req.query;

    // Start building the query dynamically
    let query = 'SELECT * FROM Artists WHERE 1=1';
    let params = [];

    // Add conditions for each field if they are provided in the query
    if (name) {
        query += ' AND name LIKE ?';
        params.push(`%${name}%`);
    }

    if (stage_name) {
        query += ' AND stage_name LIKE ?';
        params.push(`%${stage_name}%`);
    }

    if (albums_count) {
        query += ' AND albums_count = ?';
        params.push(albums_count);
    }

    if (record_label) {
        query += ' AND record_label LIKE ?';
        params.push(`%${record_label}%`);
    }

    if (publishing_house) {
        query += ' AND publishing_house LIKE ?';
        params.push(`%${publishing_house}%`);
    }

    if (career_start_date) {
        query += ' AND career_start_date = ?';
        params.push(career_start_date);
    }

    // Execute the query with the dynamically built conditions
    db.query(query, params, (error, result) => {
        if (error) {
            res.send({ status: false, message: 'Error fetching search results' });
        } else {
            res.send({ status: true, data: result });
        }
    });
});
