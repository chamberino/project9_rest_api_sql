var express = require('express');
var router = express.Router();
var Course = require("../models").Course;
var User = require("../models").User;
const Sequelize = require('sequelize');
const authenticateUser = require('./authenticate');
const { check, validationResult } = require('express-validator/check');


// Get all courses route
router.get('/', (req, res, next) => {
    // Query the db to get all courses, returning the specified attributes
    Course.findAll({
        attributes: [ 
                      'id', 
                      'title', 
                      'description', 
                      'estimatedTime', 
                      'materialsNeeded', 
                      'userId'
                    ],
        $sort: { id: 1 }    
    })
    .then((results) => {
        if (!results) {
            // Log error and set status code if there's a problem retrieving the courses
            const error = new Error('There was an error retrieving the list of courses'); //throw custom error    
            error.status = 400;
            next(error); // pass error along to global error handler
        } else {
            // Set status code 200 and send resulting data
            res.status(200).json(results).end();
        }
    }).catch((error) => {
        // catch any other errors and pass errors to global error handler
        next(error);  
    });
});

// Get individual course route
router.get('/:id', (req, res, next) => {
    // Query the db to get individual course, returning the specified attributes
    Course.findByPk(req.params.id, {
        attributes: [
            'id',
            'title',
            'description',
            'estimatedTime',
            'materialsNeeded',
            'userId'
        ]
      })
    .then((course) => {
        if (!course) {
            // Log error and set status code if there's a problem retrieving the courses
            const error = new Error('No course attached to provided ID'); //throw custom error    
            error.status = 409;
            next(error) // pass error along to global error handler
        } else {
            // Set status code 200 and send resulting data
            res.status(200).json(course).end();
        }
    }).catch((error)=>{
        // catch any other errors and pass errors to global error handler
        next(error);
    });
});

// Post course route
// Use express-validation middleware to check incoming data
router.post('/', [
    check('title')
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Please enter a class title'),
      check('description')
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Please enter a class description')
  ], authenticateUser, (req, res, next) => {
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
        Course.findOne({ where: {title: req.body.title} })
        .then((course) => {
            if (course) {
                const error = new Error('This course already exists'); //throw custom error    
                error.status = 409;
                next(error); // pass error along to global error handler
            } else {
                //req.body contains a json object with the values of the form which maps 1:1 to the Course model.
                req.body.userId = req.currentUser.id;                
                Course.create(req.body)
                .then((course)=>{
                    if(!course){
                        const error = new Error('There was a problem posting the course'); //throw custom error
                        error.status =400;
                        next(error); // pass error along to global error handler
                    } else {
                        res.location(`/api/courses/${course.id}`);
                        res.status(201).end();
                    }
                }).catch((error)=> {  // check for errors within body
                    if (error.name === "SequelizeValidationError") {
                        // Use Sequelize ORM to catch any validation errors
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
            };
        }).catch((error) => {
            // catch any other errors and pass errors to global error handler
            next(error);
        });
    };      
});

// Update course route
router.put('/:id', [
    check('title')
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Please enter a class title'),
      check('description')
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Please enter a class description')
  ], authenticateUser, (req, res, next) => {
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
        // Get course by id
        Course.findByPk(req.params.id)
        .then((course) => {
            if(!(course.userId == req.currentUser.id)) {
                res.status(403).json({ message: 'Users may only update courses they created themselves' });
            } else {
                if (!course) { 
                    const error = new Error('Cannot find the requested resource to update'); // custom error message
                    error.status = 400;
                    next(error) // pass error along to global error handler
                } else { // if matching course exists, update it with the json data
                    req.body.userId = req.currentUser.id;
                    course.update(req.body)
                    .then((course) => { 
                        if (!course){
                            const error = new Error('There was a problem posting the course'); // custom error message
                            error.status = 400;
                            next(error); // pass error along to global error handler
                        } else {
                            res.status(204).end();
                        }
                    }).catch((error)=>{
                        // Use Sequelize ORM to catch any validation errors
                        if (error.name === "SequelizeValidationError") {
                            const errorsArray = error.errors.map((error) => {
                                return error.message;                
                            })
                            const err = new Error(errorsArray);
                            error.status = 400;
                            next(err);
                        } else {
                            next(error); // catch any other errors and pass errors to global error handler
                        }
                    });
                    return null
                }
            }
        }).catch((error) => {  
            // catch any other errors and pass errors to global error handler
            next(error);
        });
    }
});

// Delete course route
router.delete("/:id", authenticateUser, (req, res, next) => {
    Course.findByPk(req.params.id)
    .then((course) => {
        if(!(course.userId == req.currentUser.id)) {
            res.status(403).json({ message: 'Users may only delete courses they created themselves' });
        } else {
            if (!course) { 
                const error = new Error('Cannot find the requested resource to update'); // custom error message
                error.status = 400;
                next(error); // catch any other errors and pass errors to global error handler
            } else { // delete matched course
                return course.destroy()
                .then((course)=>{
                    if (!course) { 
                        const error = new Error('There was a problem deleting the course'); // custom error message
                        error.status = 400;
                        next(error);
                    } else {
                    res.status(204).end();
                    }
                }).catch((error) => {
                    // catch any other errors and pass errors to global error handler
                    next(error);
                });
            }
        }
    }).catch((error) => {  
        // catch any other errors and pass errors to global error handler
        next(error);
    });
});

module.exports = router;