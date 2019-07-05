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
const geohash                           = require('latlon-geohash');

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

// MARK: - Login functionality should be reserved for web platform
// Web platform not available. 
router.post('/login', function( req, res ) {
    console.log(req.body);
    dadhiveFunctions.signin(req, res);
});

router.post('/createUser', function(req, res) {
    dadhiveFunctions.signup(req, res, function(uid) {
        if (uid === null) { 
            var error = {
                "code": 200,
                "message": "Something went wrong. Please try again later."
            }
            console.log(error);
            dadhiveFunctions.sendResponse(200, error, null, null, res)
        } else {
            req.body.uid = uid
            dadhiveFunctions.createUserMongoDB(req, res);
        }
    });
});

router.post('/getUser', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.getUserMongoDB(req, res);
});

router.post('/createMatch', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.createMatchMongoDB(req, res);
});

router.post('/getMatches', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.getMatchesMongoDB(req, res);
});

router.post('/addParticipant', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.addParticipantMongoDB(req, res);
});

router.post('/removeParticipant', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.removeParticipantMongoDB(req, res);
});

router.post('/createConversation', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.createConversationMongoDB(req, res);
});

router.post('/findConversations', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.getConversationsMongoDB(req, res);
});

router.post('/getUsersInConversation', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.getUsersInConversationMongoDB(req, res);
});

router.post('/sendMessageCheck', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.sendMessageMongoDB(req, res);
});

router.post('/saveLocation', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.saveLocationMongoDB(req, res);
});

router.post('/editUserProfile', function(req, res) {
    dadhiveFunctions.editUserMongoDB(req, res);
});

router.post('/getNearbyUsers', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.getNearByUsersMongoDB(req, res);
});

router.post('/retrieveForMap', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.retrieveForMapMongoDB(req, res);
});

// MARK: - Reserved for Cloud Functions
router.post('/updateConversation', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.updateConversationMongoDB(req, res);
});

// MARK: - Not used
router.post('/uploadPhoto', function(req, res) {

    var form = new formidable.IncomingForm();
    var imageData = {};

    form.parse(req, function (err, fields, files) {
        if (!err) {
            console.log(fields);
            var finished = _.after(parseInt(fields.imageCount), check);
            main.firebase.firebase_storage(function(firebase) {
                for (i = 0; i < parseInt(fields.imageCount); i++) {
                    var file = files[fields.imageCount+(i+1)];
                    var fileMime = mime.getType(file.name);
                    var fileExt = mime.getExtension(file.type);
                    var uploadTo = 'images/' + fields.userId + '/' + 'profileImage'+(i+1) + '.' + fileExt;
                    firebase.upload(file.path, { 
                        destination: uploadTo,
                        public: true,
                        metadata: {
                            contentType: fileMime,
                            cacheControl: "public, max-age=300"
                        }
                    }, function(err, file) {
                        if (err) { 
                            console.log('Error uploading file: ' + err);
                            finished();
                        } else {
                            var count = i+1;
                            imageData["userProfilePicture_"+count+"_url"] = dadhiveFunctions.createPublicFileURL(uploadTo); 
                            imageData["userProfilePicture_"+count+"_meta"] = null;
                            finished();
                        }
                    });
                }
            });

            function check() {
                dadhiveFunctions.uploadPicture(imageData, res);
            }

        }
    });
});

router.post('/addToMap', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.createMapItem(req, res, function(itemId) {
        req.body.itemId = itemId
        dadhiveFunctions.addToMap(req, res);
    });
});

router.post('/getMessages', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.getMessagesInConversation(req.body.conversationId, res);
});

// MARK: - Reserved for ADMIN
router.get('/getUsers', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.getUsersMongoDB(req, res);
});

router.get('/deleteAllGeos', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.deleteAllMongoUserGeoElements(req, res);
});

router.post('/deleteGeo', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.deleteGeo(req, res);
});

router.post('/deleteGeosBut', function(req, res) {
    req.body.ids = ["5cf87bf7178341c6ca36ca92", "5cf87f3c178341c6ca37481b"];
    dadhiveFunctions.deleteGeosBut(req, res);
})

router.get('/deleteAllActions', function(req, res) {
    console.log(req.body);
    dadhiveFunctions.deleteAllMongoActionElements(req, res);
});

router.post('/deleteAction', function(req, res) {
    console.log(req.body);
});

router.post('/deleteUser', function(req, res) {
    dadhiveFunctions.deleteUser(req, res);
});

module.exports = router;