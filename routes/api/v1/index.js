const express                           = require('express');
const router                            = express.Router();
const main                              = require('../../../app');
const bodyParser                        = require('body-parser');
const path                              = require('path');
const session                           = require('client-sessions');
const ok                                = require('async');
const randomstring                      = require('randomstring');
const formidable                        = require('formidable');
const _                                 = require('underscore');
const mime                              = require('mime');
const configs                           = require('../../../configs');

//  Add projects below
const dadhiveFunctions                  = require('../../functions/index');

const oneDay                            = configs.oneDay;

router.use(express.static(configs.basePublic, {
    maxage: oneDay * 21
}));
router.use(bodyParser.urlencoded({extended:true}));
router.use(bodyParser.json());
router.use(session({
    cookieName: process.env.COOKIENAME || configs.cookiename,
    secret: process.env.COOKIESEC || configs.cookiesecret,
    duration: 60 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
}));

router.get('/test', function(req, res) {
    res.json({
        "text" : "Test GET request."
    })
});

router.get('/getUsers', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.getUsers(req, res);
});

router.post('/getUser', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.getUserWithId(req.body.userId, res);
});

router.post('/createUser', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.createUser(req, res);
});

router.post('/createMatch', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.createMatch(req, res);
});

router.post('/findMatch', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.findMatch(req, res);
});

router.post('/findConversations', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.findConversations(req, res);
});

router.post('/findConversation', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.findConversation(req.body.conversationId, res);
});

router.post('/getMessages', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.getMessagesInConversation(req.body.conversationId, res);
});

router.post('/sendMessage', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.sendMessage(req, res);
});

module.exports = router;