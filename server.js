const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors'); // Import the CORS package

const server = express();

// Use CORS middleware to allow requests from your Angular frontend
server.use(cors());

// If you want to allow only specific origins, you can configure CORS like this:
// const corsOptions = {
//     origin: 'http://localhost:4200', // Replace with your Angular frontend URL
//     methods: 'GET, POST, PUT, DELETE',
//     allowedHeaders: 'Content-Type, Authorization',
// };
// server.use(cors(corsOptions));
//some changes

server.use(bodyParser.json());

// Establish the database connection
const db = mysql.createConnection({
    host: 'burgamjq2x0ycsadlhmj-mysql.services.clever-cloud.com',
    user: 'uikmbpwbuz6gzjfa',
    password: 'jZEZKgQqlMeH8LozCzEH',
    database: 'burgamjq2x0ycsadlhmj', // Adjust database name
});

db.connect(function (error) {
    if (error) {
        console.log('Error Connecting to DB');
    } else {
        console.log('Successfully Connected to DB');
    }
});

// Establish the Port
server.listen(8085, function check(error) {
    if (error) {
        console.log('Error starting server');
    } else {
        console.log('Server started on port 8085');
    }
});

// Create an Artist
server.post('/api/artists', (req, res) => {
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
    const sql = 'INSERT INTO Artists SET ?';
    db.query(sql, details, (error) => {
        if (error) {
            res.send({ status: false, message: 'Artist creation failed' });
        } else {
            res.send({ status: true, message: 'Artist created successfully' });
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
        career_start_date: req.body.career_start_date, // Ensure this is correctly handled
    };

    const sql = 'UPDATE Artists SET ? WHERE artist_id = ?';
    db.query(sql, [details, artistId], (error) => {
        if (error) {
            console.error('Error during artist update:', error);
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
                    // Calculate average rating
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
