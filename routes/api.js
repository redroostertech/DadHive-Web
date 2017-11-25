//  MARK:- Controls all functions related to the usage of the api; i.e. working with mobile app and etc.
//  1. Retrieve authentication token
//  2. Retrieve keys for specific services, i.e. client keys, aws S3 keys and more
//  3. Checking a users session
//
//
//

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

//  MARK:- Add constants for JWT Token
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const configs = require('../configs');

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

//  MARK:- Bring in object model(s)


//  MARK:- Handle everything else.
var port = process.env.PORT || configs.port;
var jwtsec = process.env.JWT_SECRET || configs.secret;
var databaseUri = process.env.MONGODB_URI || configs.url;

router.post('/mo-login', function(req, res) {
    console.log(req.body);
})

router.post('/authtoken', function(req, res){
    var idForUseWithToken = req.body.id;
    console.log(req.body);
    if (!idForUseWithToken) return res.status(401).send({
        response: 401,
        message: "Did not provide any information. Please try again.",
        error: "Error"
    });
    //  MARK:- Step 1 & 2: Create Token using device ID and set an expiration date of 24 hours.
    var token = jwt.sign({
        id: req.body.id
    }, configs.secret, {
        expiresIn: 21600
    });
    
    //  MARK:- Step 3: Send Response Back
    res.status(200).send({
        response: 200,
        message: "Data was returned from the database.",
        data: {
            auth_token: token
        }
    });
});

router.get('/retrievekeys', function(req, res){
    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).send({
        response: 401,
        message: "Token has not been provided. Please try again.",
        error: "Error"
    });
    
    jwt.verify(token, configs.secret, function(err, decoded){
        if (err) return res.status(500).send({
            response: 500,
            message: "Failed to authenticate token. Please try again",
            error: err
        });
        res.status(200).send({
            response: 200,
            message: "Data was returned from the database.",
            data: {
                api: process.env.APP_ID,
                masterKey: process.env.SERVER_URL,
                awsaccess: process.env.AWS_ACCESS_KEY_ID,
                awssecret: process.env.AWS_SECRET_ACCESS_KEY,
                s3bucket: process.env.S3_BUCKET_NAME
            }
        });
    });
});

router.get('/sessioncheck', function(req, res){
    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).send({
        response: 401,
        message: "Token has not been provided. Please try again.",
        error: "Error"
    });
    
    jwt.verify(token, configs.secret, function(err, decoded){
        if (err) return res.status(500).send({
            response: 500,
            message: "Failed to authenticate token. Please try again",
            error: err
        });
        res.status(200).send({
            response: 200,
            message: "Data was returned from the database.",
            data: {
                api: process.env.APP_ID,
                masterKey: process.env.MASTER_KEY,
                server: process.env.SERVER_URL
            }
        });
    });
});

module.exports = router;