//  This controls the data in and out of the database.
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

//  MARK:- Add constants for JWT Token
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const configs = require('../../configs');

router.use(bodyParser.urlencoded({ extended: true }));

//  MARK:- Bring in object model(s)
var RegUser = require('../models/User');

//  MARK:- Handle everything else.
var port = process.env.PORT || configs.port;
var jwtsec = process.env.JWT_SECRET || configs.secret;
var databaseUri = process.env.MONGODB_URI || configs.url;

//  CREATE a NEW USER
//  ***MOVED TO AUTHCONTROLLER***
/*router.post('/register', function(req, res) {
    User.create({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password
    }, function(err, user){
        if (err) return res.status(500).send({
            response: 500,
            message: "There was a problem adding the information to the database.",
            error: err
        });
        res.status(200).send({
            response: 200,
            message: "Data was returned from the database.",
            data: user
        });
    });
})*/

//  FIND ME USERS in the DB
router.get('/me', function(req, res){
    //  MARK:- Ensure token is validated
    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).send({
        response: 401,
        message: "Token has not been provided. Please try again.",
        error: err
    });
    
    jwt.verify(token, configs.secret, function(err, decoded){
        if (err) return res.status(500).send({
            response: 500,
            message: "Failed to authenticate token. Please try again",
            error: err
        });
        
        /*User.find({}, function(err, users){
            if (err) return res.status(500).send({
                response: 500,
                message: "There was a problem adding the information to the database.",
                data: users,
                error: err
            });
            if (users) {
                res.status(200).send({
                    response: 200,
                    message: "Data was returned from the database.",
                    data: users
                });
            } else {
                res.status(404).send({
                    response: 404,
                    message: "There was no data returned from the database.",
                    data: users
                });
            }
        })*/
    })
})

//  FIND ALL USERS in the DB
router.get('/', function(req, res){
    User.find({}, function(err, users){
        if (err) return res.status(500).send({
            response: 500,
            message: "There was a problem adding the information to the database.",
            data: users,
            error: err
        });
        if (users) {
            res.status(200).send({
                response: 200,
                message: "Data was returned from the database.",
                data: users
            });
        } else {
            res.status(404).send({
                response: 404,
                message: "There was no data returned from the database.",
                data: users
            });
        }
    })
})

//  MARK:- FIND a USER by QUERY in the DB
router.post('/search', function(req, res){
    var query = req.body;
    console.log("Users get query is:");
    console.log(query);
    User.find(query, function(err, users){
        if (err) return res.status(500).send({
            response: 500,
            message: "There was a problem adding the information to the database.",
            data: users,
            error: err
        });
        if (users) {
            res.status(200).send({
                response: 200,
                message: "Data was returned from the database.",
                data: users
            });
        } else {
            res.status(404).send({
                response: 404,
                message: "There was no data returned from the database.",
                data: users
            });
        }
    })
})


//  MARK:- FIND a USER by ID in the DB
//  Work in progress
/*
router.get('/search/:params', function(req, res){
    var query = req.params;
    console.log("Users get query is:");
    console.log(query);
    User.find(query, function(err, users){
        if (err) return res.status(500).send({
            response: 500,
            message: "There was a problem adding the information to the database.",
            data: users,
            error: err
        });
        if (users.count >= 1) {
            res.status(200).send({
                response: 200,
                message: "Data was returned from the database.",
                data: users
            });
        } else {
            res.status(404).send({
                response: 404,
                message: "There was no data returned from the database.",
                data: users
            });
        }
    })
})
*/

module.exports = router;