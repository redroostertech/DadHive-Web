//  MARK:- Controls main website page renderings.
//  1. Index Page
//  2. Login Page
//  3. Registration Page
//  4. PreRegistration Page
//
//
//

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
var isLive = process.env.isLive || configs.isLive;

router.get('/', function(req, res) {
    res.status('200').render('index');
});

router.get('/preregister', function(req, res){
    res.status('200').render('preregister');
});

router.get('/register', function(req, res){
    if (isLive) {
        res.status('200').render('register');
    } else {
        res.redirect('/');
    }
});

module.exports = router;