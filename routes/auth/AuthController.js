//  MARK:- Controls all functions related to user authentication and initiatives.
//  1. Login Function
//  2. Registration Function
//
//
//

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

//  MARK:- Add constants for JWT Token
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const configs = require('../../configs');

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

//  MARK:- Bring in object model(s)
var PreRegUser = require('../models/PreRegUser');

//  MARK:- Handle everything else.
var port = process.env.PORT || configs.port;
var jwtsec = process.env.JWT_SECRET || configs.secret;
var databaseUri = process.env.MONGODB_URI || configs.url;


//  REGISTER/CREATE a NEW USER
router.post('/reg', function(req, res) {
    //  MARK:- Step 1: Create user
    User.create({
        facebookId: req.body.id,
        username: req.body.fullname,
        email: req.body.email,
        aboutme: req.body.aboutme,
        updatedAt: Date(),
        createdAt: Date(),
        friendsCount: req.body.friendsCount,
        photoUrl: req.body.photoUrl
    }, function(err, user){
        if (err) return res.status(500).send({
            response: 500,
            message: "There was a problem registering the user.",
            error: err
        });
        
        //  MARK:- Step 2: Create Token using user ID and set an expiration date of 24 hours.
        var token = jwt.sign({
            id: user.facebookId
        }, configs.secret, {
            expiresIn: 86400
        })
        
        //  MARK:- Store token in session.
        
        //  MARK:- Send Response
        res.status(200).send({
            response: 200,
            message: "Data was returned from the database.",
            data: {
                auth_token: token,
                user_data: user
            }
        });
    });
});

//  PREREGISTER USER
router.post('/preregister', function(req, res){
    console.log(req.body);
    //  MARK:- Step 1: Create user
    PreRegUser.create({
        uname: req.body.uname,
        uemail: req.body.uemail,
        umar_status: req.body.umar_status,
        uchildren: req.body.uchildren,
        updatedAt: Date(),
        createdAt: Date(),
        ulinkedin: req.body.ulinkedin,
        ufacebook: req.body.ufacebook,
        uinstagram: req.body.uinstagram
    }, function(err, user){
        if (err) return res.status(500).send({
            response: 500,
            message: "There was a problem registering the user.",
            error: err
        });
        
        //  MARK:- Send Response
        res.status(200).send({
            response: 200,
            message: "SUCCESS!",
            error: null
        });
    });
});

//  LOGIN a RETURNING USER
router.post('/log', function(req, res){
    //  MARK:- Step 3: Create Token
    /*var token = jwt.sign({
        id: 'eifhoiruh38h94398h3ogi4hg3490'
    }, jwtsec, {
        expiresIn: 86400
    })*/
    
    var token = 'eifhoiruh38h94398h3ogi4hg3490';
    //res.redirect('/auth/' + token + '/main');
    res.redirect('/home');
    
    /*console.log(req.body);
    //  MARK:- Step 1: Login User with password
    User.findOne({
        email: req.body.email,
    }, function(err, user) {
        if (err) return res.status(500).send({
            response: 500,
            message: "There was a problem retrieving data.",
            data: user,
            error: err
        });
        if (user) {
            console.log(user['password']);
            
            //  MARK:- Step 2: Compare passwords
            bcrypt.compare(req.body.password, user['password'], function(err, result){
                console.log(err);
                console.log(result);
                
                if (err) return res.status(404).send({
                    response: 404,
                    message: "Login was not successful. Pleas try again",
                    error: err,
                    data: {}
                });
                
                //  MARK:- Step 3: Create Token
                var token = jwt.sign({
                    id: user._id
                }, configs.secret, {
                    expiresIn: 86400
                })
                
                //  MARK:- Step 4: Sent response
                res.status(200).send({
                    response: 200,
                    message: "Successful Login.",
                    data: {
                        auth_token: token,
                        user_data: user
                    }
                })
            })
        } else {
            res.status(404).send({
                response: 404,
                message: "User does not exist.",
                data: {}
            });
        }
    })*/
    
});

module.exports = router;