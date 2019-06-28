var express = require('express');
var router = express.Router();
var Course = require("../models").Course;
var User = require("../models").User;
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

// Get all courses route
router.get('/', function(req, res, next) {
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
    .then((results)=>{
        if (!results) {
            const error = new Error('There was an error retrieving the list of courses'); //throw custom error    
            error.status = 400;
            next(error);
        } else {
            res.status(200).end();
        }
    }).catch((error) => {
        next(error);  
    });
});

// Get individual course route
router.get('/:id', function(req, res, next){
    Course.findByPk(req.params.id)
    .then((course)=>{
        if (!course) {
            const error = new Error('No course attached to ID given'); //throw custom error    
            error.status = 409;
            next(error)
        } else {
            res.status(200).end();
        }
    }).catch((error)=>{
        next(error);
    });
});

// Post course route
router.post('/', function(req, res, next){
    Course.findOne({ where: {title: req.body.title} })
    .then((course) => {
        if (course) {
            const error = new Error('This course already exists'); //throw custom error    
            error.status = 409;
            next(error);
        } else {
            Course.create(req.body)
            .then((course)=>{
                if(!course){
                    const error = new Error('There was a problem posting the course'); //throw custom error
                    error.status =400;
                    next(error);    

                } else {
                    res.location('/' + _id);
                    res.status(201).end();
                }
            }).catch((error)=> {  // check for errors within body
                if (error.name === "SequelizeValidationError") {
                    const errorsArray = error.errors.map((error) => {
                        return error.message;                
                    })
                    const err = new Error(errorsArray); //custom error message
                    err.status = 409;
                    next(err)
                } else {
                    next(error);
                }
            });
        };
    });
});

// Update course route
router.put('/:id', (req, res, next) => {
    // Get course by id
    Course.findByPk(req.params.id)
    .then((course) => {
        if (!course) { 
            const error = new Error('Cannot find the requested resource to update'); // custom error message
            error.status = 400;
            next(error)
        } else { // if matching course exists, update it with the json data
            course.update(req.body)
            .then((course) =>{ 
                if (!course){
                    const error = new Error('There was a problem posting the course'); // custom error message
                    error.status = 400;
                    next(error);
                } else {
                    res.status(204).end();
                }
            }).catch((error)=>{
                if (error.name === "SequelizeValidationError") {
                    const errorsArray = error.errors.map((error) => {
                        return error.message;                
                    })
                    const errors = {
                        errors: errorsArray
                    }
                    res.json(errors);
                } else {
                    next(error);
                }
            })
        }
    }).catch(function(error){  //catch any errors
        next(error);
    });
});

// Delete course route
router.delete("/:id", function(req, res, next){
    Course.findByPk(req.params.id)
    .then((course) => {
        if (!course) { 
            const error = new Error('Cannot find the requested resource to update'); // custom error message
            error.status = 400;
            next(error);
        } else { // delete matched course
            course.destroy()
            .then(()=>{
                res.status(204).end();
            })
        }
    }).catch((error) => {  // catch any errors
        next(error);
    });
});

module.exports = router;