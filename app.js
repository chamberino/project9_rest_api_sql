'use strict';

// load modules
const express = require('express');
const morgan = require('morgan');
// const models = require('./models');
const { models } = require('./models');
const Sequelize = require('sequelize');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var coursesRouter = require('./routes/courses');

var cors = require('cors');

const options = {
  dialect: 'sqlite',
  storage: './fsjstd-restapi.db',
  // This option configures Sequelize to always force the synchronization
  // of our models by dropping any existing tables.
  sync: { force: true },
  define: {
    // This option removes the `createdAt` and `updatedAt` columns from the tables
    // that Sequelize generates from our models. These columns are often useful
    // with production apps, so we'd typically leave them enabled, but for our
    // purposes let's keep things as simple as possible.
    timestamps: false,
  },
};

// construct the database
const db = new Sequelize(options);

console.log('Testing the connection to the database...');

// Test the connection to the database
  db.authenticate()
    .then(() => {
      console.log('Connected to database.');
      return db.sync();
    })
    .catch(err => console.error('The connection failed.'));

// variable to enable global error logging
const enableGlobalErrorLogging = process.env.ENABLE_GLOBAL_ERROR_LOGGING === 'true';

// create the Express app
const app = express();

//cors cross-origin request enabling middleware
app.use(cors());

//JSON parser
app.use(express.json());

// setup morgan which gives us http request logging
app.use(morgan('dev'));

//Setup your api routes here
app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/courses', coursesRouter);



// setup a friendly greeting for the root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the REST API project!',
  });
});

// send 404 if no other route matched
app.use((req, res) => {
  res.status(404).json({
    message: 'Route Not Found',
  });
});

// setup a global error handler
app.use((err, req, res, next) => {
  if (enableGlobalErrorLogging) {
    console.error(`Global error handler: ${JSON.stringify(err.stack)}`);
  }

  res.status(err.status || 500).json({
    message: err.message,
    errorStatus: err.status,
  });
});

// set our port
app.set('port', process.env.PORT || 5000);
// start listening on our port
const server = app.listen(app.get('port'), () => {
  console.log(`Express server is listening on port ${server.address().port}`);
});
