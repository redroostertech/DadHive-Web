//  MARK:- Controls all functions related to user authentication and initiatives.
//  1. Login Function
//  2. Registration Function
//
//
//

const express = require('express');
const router = express.Router();
const MongoClient   = require('mongodb').MongoClient;
const Mongoose      = require('mongoose');
const firebase = require('firebase');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const xoauth2 = require('xoauth2');

//  MARK:- Add constants for JWT Token
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const configs = require('../../configs');

//  MARK:- Set up app
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

//  MARK:- Bring in object model(s)
var PreRegUser = require('../models/PreRegUser');
var User = require('../models/User');
var isLive = process.env.isLive || configs.isLive;

//  MARK:- Handle everything else.
var port = process.env.PORT || configs.port;
var jwtsec = process.env.JWT_SECRET || configs.secret;
var databaseUri = process.env.MONGODB_URI || configs.url;
var nodemailerUsr = process.env.NODEMAIL_USR || configs.nodemailusr;
var nodemailerPass = process.env.NODEMAIL_PSW || configs.nodemailpass;
var nodemailerClientID = process.env.NODEMAIL_CLIENT || configs.nodemailerclientid;
var nodemailerClientSecret = process.env.NODEMAIL_CLIENTSEC || configs.nodemailerclientsecret;
var nodemailerClientToken = process.env.NODEMAIL_REFTOKEN || configs.nodemailerclienttoken;

//  MARK:- Set up Transport Service
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: nodemailerUsr,
        clientId: nodemailerClientID,
        clientSecret: nodemailerClientSecret,
        refreshToken: nodemailerClientToken
    }
});

//  REGISTER/CREATE a NEW USER
router.post('/register', function(req, res) {
    var userId = randomstring.generate(10)
    firebase.auth().createUserWithEmailAndPassword(req.body.uemail, req.body.upswd).then(function() {
        var userObj = {
            uid: userId,
            uname: req.body.uname,
            uemail: req.body.uemail,
            umar_status: req.body.umar_status,
            uchildren: req.body.uchildren,
            updatedAt: Date(),
            createdAt: Date(),
            uphotoUrl: null,
            ulinkedin: null,
            ufacebook: null,
            uinstagram: null,
            upostscount: 0,
            ufollowcount: 0,
            ufollwerscount: 0,
            ufavoritescount: 0,
            ulastlogin: Date()
        } 
        firebase.database().ref('users/'+firebase.auth().currentUser.uid).set(userObj).then(function(){
            //  MARK:- Send Response
            res.status(200).send({
                response: 200,
                message: "Data was returned from the database.",
                data: {
                    auth_token: "token"
                }
            });
        }).catch(function(error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            
            res.status(500).send({
                response: 500,
                message: errorMessage,
                error: error
            });
        });
        
    }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;

        res.status(500).send({
            response: 500,
            message: errorMessage,
            error: error
        });
    });
});

//  PREREGISTER USER
router.post('/preregister', function(req, res){
    // MARK:- Step 1: Create user
    var regKey = req.body.uname.split(" ")[0][0] + req.body.uname.split(" ")[1][0] + randomstring.generate(6)
    PreRegUser.create({
        uname: req.body.uname,
        uemail: req.body.uemail,
        umar_status: req.body.umar_status,
        uchildren: req.body.uchildren,
        updatedAt: Date(),
        createdAt: Date(),
        ulinkedin: req.body.ulinkedin,
        ufacebook: req.body.ufacebook,
        uinstagram: req.body.uinstagram,
        uregkey: regKey.toUpperCase()
    }, function(err, user){
        if (err) return res.status(500).send({
            response: 500,
            message: "There was a problem registering the user.",
            error: err
        });
        var mailOptions = {
            from: nodemailerUsr,
            to: req.body.uemail,
            subject: 'DadHive Pre-Registration Success!',
            html: '<b>Welcome to the DadHive, ' + req.body.uname + '!</b><br><br>My name is Mike, founder of the DadHive and Father\'s rights advocate. Did you know that one of the leading reasons as to why fathers lose custody battles is because of the <b>fear of the common believe that men ALWAYS lose</b>?<br><br>The fear generally stems from a lack of knowledge and understanding of the laws and protocol regarding obtaining your rights as a father.<br><br>I founded the DadHive to create a platform that will serve as a resource and outlet for you to hold yourself accountable as you travel the journey called <b>fatherhood</b>. We are almost finished with the platform, but it is our hope that our platform will be of a great resource for you and anyone you know that is a father.<br><br>Your pre-registration code is <b>' + regKey.toUpperCase() + '</b>. You can use this code to expidite login into the platform when it is launched.<br><br>Cheers!<br><br><b>Michael Westbrooks</b>, <i>Founder of the DadHive</i>'
        };

        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
                res.status(500).send({
                    response: 500,
                    message: "There was a problem registering the user.",
                    error: err
                });
            } else {
                console.log('Email sent: ' + info.response);
                //  MARK:- Send Response
                res.status(200).send({
                    response: 200,
                    message: "SUCCESS!",
                    error: null
                });
            }
        });
    });
});

//  LOGIN a RETURNING USER
router.post('/login', function(req, res){
    if (isLive === true || isLive === "true") {
        console.log(req.body);
        firebase.auth().signInWithEmailAndPassword(req.body.uemail, req.body.upswd).then(function() {
            firebase.auth().onAuthStateChanged(function(user) {
                if (user) {   
                    console.log(user);
                    res.redirect('/home');
                }
            });
        }).catch(function(error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;

            res.status(500).send({
                response: 500,
                message: errorMessage,
                error: error
            });
        });
    } else {
        res.redirect('/');
    }
});

router.post('/regcode', function(req, res){
    console.log(req.body);
    var code = req.body.regcode;
    PreRegUser.findOne({
        uregkey: code
    }, function(error, result){
        if (error) return res.status(500).send({
            response: 500,
            message: "Failed to retrieve data.",
            error: error
        });

        console.log(result);
        res.status(200).send({
            response: 200,
            message: "SUCCESS!",
            data: result,
            error: null
        });
    });
});

module.exports = router;