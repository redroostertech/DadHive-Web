const express    = require('express');
const router     = express.Router();
const bodyParser = require('body-parser');
const Mongoose      = require('mongoose');

//  MARK:- Add constants for JWT Token
const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcryptjs');
const configs    = require('../../configs');

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

//  MARK:- Bring in object model(s)
var PreRegUser = require('../models/PreRegUser');

//  MARK:- Handle everything else.
var port = process.env.PORT || configs.port;
var jwtsec = process.env.JWT_SECRET || configs.secret;
var databaseUri = process.env.MONGODB_URI || configs.url;

router.get('/', function(req, res) {
    res.status('200').render('index');
});

router.get('/register', function(req, res){
    res.status('200').render('register');
});

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

module.exports = router;