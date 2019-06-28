var express = require('express');
var router = express.Router();
var Course = require("../models").Course;
var User = require("../models").User;
const Sequelize = require('sequelize');
var bcrypt = require('bcryptjs');
var salt = bcrypt.genSaltSync(10);
// Store hash in your password DB.


const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

// router.get('/', (req, res, next) => {
//     var hash = bcrypt.hashSync(req.body.password, salt);
//     // load pw from database

//     bcrypt.compareSync("B4c0/\/", hash); // true
//     req.body.password
//     console.log(hash);
// })

// router.get('/', function(req, res, next) {
//     User.findAll()
//     .then((results)=>{
//         if (!results) {
//             const error = new Error('There was an error retrieving the list of courses'); //throw custom error    
//             error.status = 400;
//             next(error);
//         } else {
//             res.json(results)
//             res.status(200).end();
//         }
//     }).catch((error) => {
//         next(error);  
//     });
// });

// Post user route
router.post('/', function(req, res, next){
    console.log(req.body)
    User.findOne({ where: {emailAddress: req.body.emailAddress} })
    .then((user) => {
        if (user) {
            const error = new Error('A user with this email address already exists'); //Set custom error    
            error.status = 409;
            next(error);
        } 
        if (!emailRegEx.test(req.body.emailAddress)) {
            const error = new Error('Please enter a valid address. Example: foo@bar.com'); //Set custom error    
            error.status = 409;
            next(error);
        } else {
            if(!req.body.password) {
                const error = new Error('Please enter a password'); //Set custom error    
                error.status = 409;
                next(error);
            } else {
                var hash = bcrypt.hashSync(req.body.password, salt);
                req.body.password = hash;
                //req.body contains a json object with the values of the form which maps 1:1 to the Book model.
                User.create(req.body)
                .then((user)=>{
                    if(!user){
                        const error = new Error('There was a problem creating new user'); //Set custom error
                        error.status =400;
                        next(error);    
                    } else {
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
            }
        };
    });
});

// Delete user route
router.delete("/:id", function(req, res, next){
    User.findByPk(req.params.id)
    .then((user) => {
        if (!user) { 
            const error = new Error('Cannot find the requested resource to update'); // custom error message
            error.status = 400;
            next(error);
        } else { // delete matched course
            user.destroy()
            .then(()=>{
                res.status(204).end();
            })
        }
    }).catch((error) => {  // catch any errors
        next(error);
    });
});

module.exports = router;