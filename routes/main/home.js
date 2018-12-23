//  MARK:- Controls all functionality after successful login & registration
//  1. Render Main Home Screen
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
    if (isLive === true || isLive === "true") {
        res.status('200').render('main');
    } else {
        res.redirect('/');
    }
});


module.exports = router;