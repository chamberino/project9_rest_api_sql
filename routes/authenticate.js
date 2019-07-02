'use strict'

var express = require('express');
var User = require("../models").User;
var bcrypt = require('bcryptjs');
var auth = require('basic-auth');

module.exports = (req, res, next) => {
    let message = null;
  
    // Parse the user's credentials from the Authorization header.
    const credentials = auth(req);
    // If the user's credentials are available...
    if (!credentials || !credentials.pass || !credentials.name ) {
        const error = new Error('Access Denied');
        error.status = 401;
        next(error);
    } else {
      // Attempt to retrieve the user from the data store
      // by their email (i.e. the user's "key"
      // from the Authorization header).
        User.findOne({ where: {emailAddress: credentials.name} })
        .then((user)=>{
            if (user) {
                // Use the bcryptjs npm package to compare the user's password
                // (from the Authorization header) to the user's password
                // that was retrieved from the data store.
                // Will return true or false
                const authenticated = bcrypt.compareSync(credentials.pass, user.password);
                if (authenticated) {
                    console.log(`Authentication successful for username: ${user.firstName} + ${user.lastName}`);              
                    // Then store the retrieved user object on the request object
                    // so any middleware functions that follow this middleware function
                    // will have access to the user's information.
                    req.currentUser = {
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        fullName: `${user.firstName} ${user.lastName}`,
                        emailAddress: user.emailAddress
                    }
                    next();
                    return null
                } else {
                    // Else log authentication error message to use and set 401 status code
                    message = `Authentication failure for username: ${user.firstName} + ${user.lastName}`;
                    res.status(401).json({ message: 'Access Denied' });
                }
            } else {
                // Else log authentication error message to use and set 401 status code
                message = `User not found`;
                res.status(401).json({ message: 'Access Denied' });
            }
        }).catch((error) => {  
            // catch any other errors and pass errors to global error handler
            next(error);
        });
    }; 
};
  
