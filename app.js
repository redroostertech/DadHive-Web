'use strict';
// Example express application adding the parse-server module to expose Parse
// compatible API routes.
const express       = require('express');
const bodyParser    = require('body-parser');
const configs       = require('./configs.js');
const MongoClient   = require('mongodb').MongoClient;
const Mongoose      = require('mongoose');
const ParseServer   = require('parse-server').ParseServer;

//  MARK:- Handle everything else.
var port = process.env.PORT || configs.port;
var jwtsec = process.env.JWT_SECRET || configs.secret;
var databaseUri = process.env.MONGODB_URI || configs.url;

//  MARK:- Set up routes.
var UserController = require('./routes/user/UserController');
var AuthController = require('./routes/auth/AuthController');
var MainController = require('./routes/main/index');
var APIController = require('./routes/api');

// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

//  MARK:- Set up express app.
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
// Serve static assets from the /public folder
app.use(express.static(__dirname + '/public'));

//  MARK:- Use Routes
app.use('/', MainController);
app.use('/api/json/v1', APIController);
app.use('/users', UserController);
app.use('/auth', AuthController);

//  MARK:- See if mongoDB is running & start server
const httpServer = require('http').createServer(app);
Mongoose.connect(databaseUri, (error, db) => {
    if (error) return console.log(error);    
    httpServer.listen(port, function() {
        console.log('parse-server-example running on port ' + port + '.');
    });
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);

module.exports = app;
