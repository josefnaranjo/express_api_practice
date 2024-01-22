const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

// Allows us to access the .env
require('dotenv').config();

const app = express();
const port = process.env.PORT // default port to listen

const corsOptions = {
   origin: '*', 
   credentials: true,  
   'access-control-allow-credentials': true,
   optionSuccessStatus: 200,
}

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

app.use(cors(corsOptions));

// Makes Express parse the JSON body of any requests and adds the body to the req object
app.use(bodyParser.json());

app.use(async (req, res, next) => {
  try {
    // Connecting to our SQL db. req gets modified and is available down the line in other middleware and endpoint functions
    req.db = await pool.getConnection();
    req.db.connection.config.namedPlaceholders = true;

    // Traditional mode ensures not null is respected for unsupplied fields, ensures valid JavaScript dates, etc.
    await req.db.query('SET SESSION sql_mode = "TRADITIONAL"');
    await req.db.query(`SET time_zone = '-8:00'`);

    // Moves the request on down the line to the next middleware functions and/or the endpoint it's headed for
    await next();

    // After the endpoint has been reached and resolved, disconnects from the database
    req.db.release();
  } catch (err) {
    // If anything downstream throw an error, we must release the connection allocated for the request
    console.log(err)
    // If an error occurs, disconnects from the database
    if (req.db) req.db.release();
    throw err;
  }
});

// Handle DELETE request to toggle deleted flag of a car record
app.delete('/:id', async (req, res) => {
  // Log the record number to be updated
  console.log(`Record number ${req.params.id}`)

  // Get the record id from the request parameters
  const id = req.params.id;

  // Update the record in the database
  await req.db.query(`
    UPDATE car
    SET deleted_flag = IF(deleted_flag = 0, 1, 0)
    WHERE id = :id
  `, { id });

  // Return a success response
  res.json({ success: true })
})

// Handle GET request to /car
app.get('/', async (req, res) => {      // Async function
  console.log('GET to /car');           // Log request

  // Select all non-deleted cars from database
  const [cars] = await req.db.query     // Await query
  (`   
    SELECT * FROM car                    
    WHERE deleted_flag = 0;
  `);

  // Log cars
  console.log('Show all non-deleted cars: ', cars);

  // Send cars as JSON response
  res.json({ cars });
});

// Handle PUT request to /car
app.put('/', async (req, res) => {
  // Log request details 
  console.log('PUT to /car', req.body);

  // Destructure request body 
  const { 
    id,
    year
   } = req.body;

  // Update car year in database 
  const [update] = await req.db.query(`
    UPDATE car
    SET year = :year
    WHERE id = :id
  `, { year, id });

  // Fetch updated car record
  const [record] = await req.db.query(`
    SELECT * 
    FROM car
    WHERE id = :id
  `, { id })

  // Log update status 
  console.log('Update: ', update);

  // Return updated record 
  res.json({
    id,
    year,
    make: record[0].make,
    model: record[0].model,
    deleted_flag: record[0].deleted_flag
   });
});

// Handle POST request to /car
app.post('/', async (req, res) => {
  // Log request body
  console.log('POST to /car: ', req.body);

  // Destructure request body
  const {
    year,
    make,
    model,
    deleted_flag
  } = req.body;

  // Insert new car into database
  const [insert] = await req.db.query(`
      INSERT INTO car (year, make, model, deleted_flag)
      VALUES (:year, :make, :model, :deleted_flag);
  `, { year, make, model, deleted_flag })
  
  // Log database insertion result
  console.log('Insert: ', insert)
  
  // Send car data as JSON response
  res.json({
    id: insert.id,
    make,
    model,
    year,
    deleted_flag
  });
})

app.listen(port, () => {
  // Log message to console when server starts
  console.log(`server started at http://localhost:${port}`);
});