'use strict';

var express = require('express');
var router = express.Router();
var Course = require("../models").Course;
var User = require("../models").User;
const Sequelize = require('sequelize');
const { check, validationResult } = require('express-validator/check');
var bcrypt = require('bcryptjs');
const authenticateUser = require('./authenticate');
var auth = require('basic-auth');

const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/


router.get('/', authenticateUser, (req, res) => {
    // Set status and return currently authenticated User
    res.status(200).json(req.currentUser);
  });

// Post user route
// Use express-validation middleware to check incoming data
router.post('/', [
    check('firstName')
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Please enter a first name'),
      check('lastName')
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Please enter a last name'),
    check('emailAddress')
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Please provide a valid email'),
    check('password')
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Please provide a password'),
  ],  (req, res, next) => {
    // Attempt to get the validation result from the Request object.
    const errors = validationResult(req);
    // If there are validation errors...
    if (!errors.isEmpty()) {
        // Use the Array `map()` method to get a list of error messages.
        const errorMessages = errors.array().map(error => error.msg);
        // Create custom error with 400 status code
        const error = new Error(errorMessages);
        error.status = 400;
        next(error); // pass error along to global error handler
    } else {
        if (!emailRegEx.test(req.body.emailAddress)) { // Test email against regex
            const error = new Error('Please enter a valid address. Example: foo@bar.com'); //Set custom error    
            error.status = 409;
            next(error); // pass error along to global error handler
        } else { // query the database to see if a user has already been created with that email address
            User.findOne({ where: {emailAddress: req.body.emailAddress} })
            .then((user) => {
                if (user) {
                    const error = new Error('A user with this email address already exists'); //Set custom error    
                    error.status = 409;
                    next(error); // pass error along to global error handler
                } else {
                    // Hash the new user's password before persisting to the database.
                    var hash = bcrypt.hashSync(req.body.password);
                    req.body.password = hash;
                    //req.body contains a json object with the values of the form which maps 1:1 to the Book model.
                    User.create(req.body) // create new user
                    .then((user) => {
                        if(!user){ // Log error if user could not be created
                            const error = new Error('There was a problem creating new user'); //Set custom error
                            error.status =400;
                            next(error); // pass error along to global error handler   
                        } else {
                            // set location header, set status code and close response returning no data
                            res.location('/');
                            res.status(201).end();
                        }
                    }).catch((error) => {  // check for errors within body
                        // Use Sequelize ORM to catch any validation errors
                        if (error.name === "SequelizeValidationError") {
                            // If errors exist, map over array of error objects and return array
                            // with error messages
                            const errorsArray = error.errors.map((error) => {
                                return error.message;                
                            })
                            const err = new Error(errorsArray); //custom error message
                            err.status = 400;
                            next(err) // pass error along to global error handler
                        } else {
                            // catch any other errors and pass errors to global error handler
                            next(error);
                        }
                    });
                    return null;
                }
            }).catch((error) => {
                // catch any other errors and pass errors to global error handler
                next(error);
            });
        };
    };
});

// Delete user route
router.delete("/:id", (req, res, next) => {
    // Query db for user
    User.findByPk(req.params.id)
    .then((user) => {
        // Check to see if user exists
        if (!user) { 
            const error = new Error('Cannot find the requested resource to update'); // custom error message
            error.status = 400;
            next(error); // pass error along to global error handler
        } else { // delete matched course
            user.destroy()
            .then(() => {
                // set status and close response returning no content
                res.status(204).end();
            })
        }
    }).catch((error) => {  
        // catch any other errors and pass errors to global error handler
        next(error);
    });
});

module.exports = router;
