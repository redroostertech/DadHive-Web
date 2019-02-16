'use strict';

const express           = require('express');
const bcrypt            = require('bcryptjs');
const bodyParser        = require('body-parser');
const path              = require('path');
const firebase          = require('./firebase.js');
const aws               = require('./aws.js');
const configs           = require('./configs');
const fs                = require('fs');
const session           = require('client-sessions');
const nodemailer        = require('nodemailer');
const randomstring      = require('randomstring');
const xoauth2           = require('xoauth2');
const NodeCache         = require('node-cache');

var oneDay              = configs.oneDay;
var port                = process.env.PORT || configs.port;
var jwtsec              = process.env.JWT_SECRET || configs.secret;
var nodemailerUsr       = process.env.NODEMAIL_USR || configs.nodemailusr;
var nodemailerPass      = process.env.NODEMAIL_PSW || configs.nodemailpass;
var nodemailerClientID  = process.env.NODEMAIL_CLIENT || configs.nodemailerclientid;
var nodemailerClientSecret = process.env.NODEMAIL_CLIENTSEC || configs.nodemailerclientsecret;
var nodemailerClientToken = process.env.NODEMAIL_REFTOKEN || configs.nodemailerclienttoken;
var siteTitle           = process.env.SITE_TITLE || configs.siteTitle;

var app = express();
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(configs.basePublic, {
    maxage: oneDay * 21
}));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(session({
    cookieName: process.env.COOKIENAME || configs.cookiename,
    secret: process.env.COOKIESEC || configs.cookiesecret,
    duration: 60 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
}));

var nodeCache = new NodeCache({ 
    stdTTL: 0, 
    checkperiod: 604800,
    useClones: true
});

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

app.all('/assets/*', function(req, res) {
    res.sendStatus(404);
});

app.all('/data/*', function(req, res) {
    res.sendStatus(404);
});

app.get('/', function(req, res) {
    res.status('200').render('index');
});

app.get('/privacy', function(req, res) {
    res.json({
        "text" : "Privacy Policy"
    })
});

app.get('/tos', function(req, res) {
    res.json({
        "text" : "Terms of Service"
    })
});

app.get('/preregister', function(req, res){
    res.status('200').render('preregister');
});

app.get('/register', function(req, res){
    if (isLive === true || isLive === "true") {
        res.status('200').render('register');
    } else {
        res.redirect('/');
    }
});

//  API
app.post('/mo-login', function(req, res) {
    console.log(req.body);
    if (!req.body.email) return res.status(401).send({
        response: 401,
        message: "Did not provide any information. Please try again.",
        error: "Error"
    });
    //  MARK:- Step 1 & 2: Create Token using device ID and set an expiration date of 24 hours.
    var token = jwt.sign({
        id: req.body.email
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

app.post('/mo-lookup', function(req, res) {
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
})

app.post('/mo-register', function(req, res) {
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
    
    console.log(req.body);
    //  MARK:- Step 3: Send Response Back
    res.status(200).send({
        response: 200,
        message: "Data was returned from the database.",
        data: {
            auth_token: token
        }
    });
});

app.post('/authtoken', function(req, res){
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

app.get('/retrievekeys', function(req, res){
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

app.get('/sessioncheck', function(req, res){
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

//  AUTHCONTROLLER
app.post('/register', function(req, res) {
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
app.post('/preregister', function(req, res){
    // MARK:- Step 1: Create user
    var regKey; 
    if (req.body.uname.split(" ").length > 1) {
        regKey = req.body.uname.split(" ")[0][0] + req.body.uname.split(" ")[1][0] + randomstring.generate(6)
    } else {
        regKey = req.body.uname.split(" ")[0][0] + randomstring.generate(7)
    }
    
    
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
            html: '<b>Welcome to the DadHive, ' + req.body.uname + '!</b><br><br>My name is Mike, founder of the DadHive and Father\'s rights advocate. Did you know that one of the leading reasons as to why fathers lose custody battles is because of the <b>fear of the common belief that men ALWAYS lose</b>?<br><br>The fear generally stems from a lack of knowledge and understanding of the laws and protocol regarding obtaining your rights as a father.<br><br>I founded the DadHive to create a platform that will serve as a resource and outlet for you to hold yourself accountable as you travel the journey called <b>fatherhood</b>. We are almost finished with the platform, but it is our hope that our platform will be of a great resource for you and anyone you know that is a father.<br><br>Your pre-registration code is <b>' + regKey.toUpperCase() + '</b>. You can use this code to expidite login into the platform when it is launched.<br><br>Cheers!<br><br><b>Michael Westbrooks</b>, <i>Founder of the DadHive</i>'
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
app.post('/login', function(req, res){
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

app.post('/regcode', function(req, res){
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

//  USERCONTROLLER
//  FIND ME USERS in the DB
app.get('/me', function(req, res){
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
app.get('/', function(req, res){
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
app.post('/search', function(req, res){
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

//  MARK:- Start Server
var httpServer = require('http').createServer(app);
httpServer.setTimeout(configs.timeout);
httpServer.timeout = configs.timeout;
httpServer.agent= false;
httpServer.listen(port, function() {
    console.log('DadHive running on port ' + port + '.');
    firebase.setup();
});

const io = require('socket.io')(httpServer);

io.on('connection', function(socket){
    console.log('a user is connected');
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
});

module.exports.port = port;
module.exports.firebase = firebase;
module.exports.cache = nodeCache;