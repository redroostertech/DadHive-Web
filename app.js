'use strict';
// Example express application adding the parse-server module to expose Parse
// compatible API routes.
const express       = require('express');
const bodyParser    = require('body-parser');
const configs       = require('./configs.js');
const MongoClient   = require('mongodb').MongoClient;
const Mongoose      = require('mongoose');
const firebase      = require('firebase');
const session       = require('client-sessions');

//  MARK:- Handle everything else.
var port = process.env.PORT || configs.port;
var jwtsec = process.env.JWT_SECRET || configs.secret;
var databaseUri = process.env.MONGODB_URI || configs.url;

//  MARK:- Set up routes.
var AuthController = require('./routes/auth/AuthController');
var MainController = require('./routes/main/index');
var APIController = require('./routes/api');
var HomeController = require('./routes/main/home');

//  MARK:- Set up express app.
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
// Serve static assets from the /public folder
app.use(express.static(__dirname + '/public'));
app.use(session({
  cookieName: process.env.COOKIENAME || configs.cookiename,
  secret: process.env.COOKIESEC || configs.cookiesecret,
  duration: 60 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));

//  MARK:- Setup Firebase App
var config = {
    apiKey: process.env.FIRAPIKEY || configs.firapikey,
    authDomain: process.env.FIRDOM || configs.firauthdomain,
    databaseURL: process.env.FIRDBURL || configs.firdburl,
    projectId: process.env.FIRPROJ || configs.firprojectid,
    storageBucket: process.env.FIRSTOR || configs.firstoragebucket,
    messagingSenderId: process.env.FIRMES || configs.firmessagingsenderid,
};
firebase.initializeApp(config);

//  MARK:- Use Routes
app.use('/', MainController);
app.use('/api/json/v1', APIController); // r
app.use('/auth', AuthController);
app.use('/home', HomeController);

app.all('/assets/*', function(req, res) {
  res.sendStatus(404);
});
app.all('/data/*', function(req, res) {
  res.sendStatus(404);
});

//  MARK:- See if mongoDB is running & start server
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer);

io.on('connection', function(socket){
    console.log('a user is connected');
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
});

Mongoose.connect(databaseUri, (error, db) => {
    if (error) return console.log(error);  
    httpServer.listen(port, function() {
        console.log('DadHive running on port ' + port + '.');
    });
});


// This will enable the Live Query real-time server
//ParseServer.createLiveQueryServer(httpServer);