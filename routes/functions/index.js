const express       = require('express');
const main          = require('../../app');
const _             = require('underscore');
const randomstring  = require('randomstring');
const async         = require("async");
const geohash       = require('latlon-geohash');


var genericError = { "errorCode": 200, "errorMessage": "Something went wrong." };
var genericEmptyError = { "errorCode" : null, "errorMessage" : null };
var genericSuccess = { "result" : true, "message" : "Request was successful" };
var genericFailure = { "result" : false, "message" : "Request was unsuccessful" };
var invalidPageFailure = { "errorCode": 200, "errorMessage" : "Invalid page number, should start with 1" };
var getOptions = { source: 'cache' };

var kUsers = 'users';
var kMessages = 'messages';
var kConversations = 'conversations';
var kMatches = 'matches';

function validateTwilioResponse (message, res) {
    console.log(message);
    if (message.sid === null) {
        handleError(200, "There was an error sending text.", res);
    } else {
        res.status(200).json({
            "status": 200,
            "success": {
                "result": true,
                "message": "You successfully sent a text via twilio."
            },
            "data": null,
            "error": {
                "code": null,
                "message": null
            }
        });
    }
}

function handleJSONResponse (code, error, success, data, res) {
    res.status(code).json({
        "status": code,
        "success": success,
        "data": data,
        "error": error
    });
}

//  MARK:- Firebase

function retrieveAll(collection, callback) {
    main.firebase.firebase_firestore_db(function(reference) {
        if (!reference) { 
            return callback(genericFailure, genericError , null);
        } else {
            reference.collection(collection).get(getOptions).then(function(snapshot) {
                return callback(genericSuccess, null, snapshot);
            }).catch(function (error) {
                return callback(genericFailure, error, null);
            });
        }
    });
}

function retrieveWithParameters(collection, parameters, callback) {
    main.firebase.firebase_firestore_db(function(reference) {
        if (!reference) { 
        qcallback(genericFailure, genericError, null);
        } else {
            var ref = reference.collection(collection);
            var results = new Array;
            async.each(parameters, function(p, completion) {
                if (p.condition === "<") {
                    var query = ref.where(p.key,"<",p.value);
                    query.get().then(querySnapshot => {
                        var data = querySnapshot.docs.map(function(doc) {
                            var d = doc.data();
                            d.key = doc.id;
                            return d
                        });
                        results.push(data);
                        return completion();
                    });
                    return
                } else if (p.condition === "<=") {
                    var query = ref.where(p.key,"<=",p.value);
                    query.get().then(querySnapshot => {
                        var data = querySnapshot.docs.map(function(doc) {
                            var d = doc.data();
                            d.key = doc.id;
                            return d
                        });
                        results.push(data);
                        return completion();
                    });
                    return 
                } else if (p.condition === "==") {
                    var query = ref.where(p.key,"==",p.value);
                    query.get().then(querySnapshot => {
                        var data = querySnapshot.docs.map(function(doc) {
                            var d = doc.data();
                            d.key = doc.id;
                            return d
                        });
                        results.push(data);
                        return completion();
                    });
                    return
                } else if (p.condition === ">") {
                    var query = ref.where(p.key,">",p.value);
                    query.get().then(querySnapshot => {
                        var data = querySnapshot.docs.map(function(doc) {
                            var d = doc.data();
                            d.key = doc.id;
                            return d
                        });
                        results.push(data);
                        return completion();
                    });
                    return 
                } else {
                    var query = ref.where(p.key,">=",p.value);
                    query.get().then(querySnapshot => {
                        var data = querySnapshot.docs.map(function(doc) {
                            var d = doc.data();
                            d.key = doc.id;
                            return d
                        });
                        results.push(data);
                        return completion();
                    });
                    return
                }
            }, function(err) {
                if (err) {
                    console.log(err);
                    callback(genericFailure, err, null);
                } else {
                    if (results.length > 0) {
                        callback(genericSuccess, null, results);
                    } else {
                        callback(genericFailure, genericError, null);
                    }
                }
            });
        }
    });
}

function retrieveFor(collection, docID, callback) {
    main.firebase.firebase_firestore_db(function(reference) {
        if (!reference) { 
            callback(genericFailure, genericError , null);
        } else {
            reference.collection(collection).doc(docID).get(getOptions).then(function(snapshot) {
                callback(genericSuccess, null, snapshot);
            }).catch(function (error) {
                callback(genericFailure, error, null);
            });
        }
    });
}

function updateFor(collection, docID, data, callback) {
    main.firebase.firebase_firestore_db(function(reference) {
        if (!reference) { 
            callback(genericFailure, genericError , null);
        } else {
            reference.collection(collection).doc(docID).set(data, { merge: true }).then(function() {
                callback(genericSuccess, null, null);
            }).catch(function (error) {
                callback(genericFailure, error, null);
            });
        }
    });
}

function addFor(collection, data, callback) {
    main.firebase.firebase_firestore_db(function(reference) {
        if (!reference) { 
            return callback(genericFailure, genericError , null);
        } else {
            reference.collection(collection).add(data).then(function(docRef) {
                console.log("Document written with ID: ", docRef.id);
                return callback(genericSuccess, null, docRef);
            }).catch(function (error) {
                return callback(genericFailure, error, null);
            });
        }
    });
}

function loadViewSignin(code, success, error, res) {
    loadView("main/admin-signin", code, success, null, error, res);
}

function loadViewSignUp(code, success, venue, error, res) {
    loadView("main/twilio-signup", code, success, venue, error, res);
}

function loadView(name, code, success, data, error, res) {
    res.status(code).render(name, {
        "status": code,
        "success": success,
        "data": data,
        "error": error
    });
}

//  MARK:- MongoDB
function addMongoDB(data, callback) {
    main.mongodb.usergeo(function(collection) {
        collection.find({
            userId: {
                $ne: req.body.userId
            },
            location: { 
                $near: {
                    $geometry: { 
                        type: "Point",  
                        coordinates: [ req.body.latitude, req.body.longitude ] },
                    $maxDistance: getMeters(req.body.maxDistance)
                }
            }
        }).limit(1).toArray(function(err, docs) {
            res.status(200).json({
                "status": 200,
                "success": { "result" : true, "message" : "Request was successful" },
                "data": {
                    "count": docs.length,
                    "results": docs,
                },
                "error": err
            });
        });
    });
    main.firebase.firebase_firestore_db(function(reference) {
        if (!reference) { 
            return callback(genericFailure, genericError , null);
        } else {
            reference.collection(collection).add(data).then(function(docRef) {
                console.log("Document written with ID: ", docRef.id);
                return callback(genericSuccess, null, docRef);
            }).catch(function (error) {
                return callback(genericFailure, error, null);
            });
        }
    });
}

module.exports = {

    signup: function(data, res) {
        main.firebase.firebase_auth(function(auth) {
            auth.createUserWithEmailAndPassword(data.emailaddress, data.confirmpassword).then(function () {
                auth.onAuthStateChanged(function (user) {
                    if (user) {
                        main.firebase.firebase_firestore_db(function(reference) {
                            if (!reference) { 
                                handleError(200, "No reference available", res);
                            } else {
                                reference.ref('venue-management/phonenumbers/').orderByChild("number").equalTo('+' + data.phone).once('value').then(function(snapshot) {
                                    if (snapshot.val() !== null) {
                                        return handleError(200, "Phone number already exists. Please use another email/phone combo.", res);
                                    }
                                    var userRef = reference.ref('venue-management/users');
                                    var newUserRef = userRef.push();
                                    newUserRef.set(data).then(function(ref) {
                                        var phoneRef = reference.ref('venue-management/phonenumbers');
                                        var newPhoneRef = phoneRef.push();
                                        newPhoneRef.set({ 'number': data.phone }).then(function(ref) {
                                            main.twilioClient.messages.create({
                                                body: "Thank you for joining venue management.",
                                                to: data.phone,
                                                from: '+19292035343'
                                            })
                                            .then((message) => validateTwilioResponse(message, res))
                                            .catch(error => handleError(200, error, res));
                                        }).catch(function (error) {
                                            var errorCode = error.code;
                                            var errorMessage = error.message;
                                            handleError(errorCode, errorMessage, res);
                                        });
                                    }).catch(function (error) {
                                        var errorCode = error.code;
                                        var errorMessage = error.message;
                                        handleError(errorCode, errorMessage, res);
                                    });
                                });
                            }
                        });
                    } else {
                        handleError(errorCode, "Something went wrong. Please try again.", res);
                    }
                });
            }).catch(function (error) {
                var errorCode = error.code;
                var errorMessage = error.message;
                handleError(errorCode, errorMessage, res);
            })
        });
    },

    signin: function(req, res) {
        main.firebase.firebase_auth(function(auth) {
            auth.signInWithEmailAndPassword(req.body.emailaddress, req.body.password).then(function () {
                auth.onAuthStateChanged(function (user) {
                    if (user) {
                        checkForUser(user.uid, function(success, error, results) {
                            if (results.length >= 1) {
                                var snapshotArray = new Array();
                                results.forEach(function(result) {
                                    snapshotArray.push(generateUserModel(result[0]));
                                });
                                var data = { "user": snapshotArray[0] };
                                handleJSONResponse(200, error, success, data, res);
                            }
                        });
                    } else {
                        handleJSONResponse(200, genericEmptyError, genericFailure, null, res);
                    }
                });
            }).catch(function (error) {
                console.log(error);
                handleJSONResponse(200, error, genericFailure, null, res);
            });
        });
    },

    createPublicFileURL: function (storageName) {
        return `http://storage.googleapis.com/${main.configs.firebaseStorageBucket}/${encodeURIComponent(storageName)}`;
    }, 

    //  Generic page transitions
    loadVenueUpload: function(res) {
        loadView("main/twilio-upload", 200, genericSuccess, null, genericEmptyError, res);
    },

    loadSignupView: function(req, res) {
        retrieve('venue-management', 'venues', function(success, error, data) {
            var venues = data;
            loadViewSignUp(200, success, venues, error, res);
        });
    },

    //  Visible API functions
    getUsers: function(req, res) {
        retrieveAll(kUsers, function(success, error, data) {
            var results = new Array();
            data.forEach(function(doc) {
                results.push(doc.data());
            });
            handleJSONResponse(200, error, success, { "users": results }, res);
        });
    },

    getUserWithId: function(id, res) {
        checkForUser(id, function(success, error, results) {
            if (results.length >= 1) {
                var snapshotArray = new Array();
                results.forEach(function(result) {
                    snapshotArray.push(generateUserModel(result[0]));
                });
                var data = { "user": snapshotArray[0] };
                handleJSONResponse(200, error, success, data, res);
            }
        });
    },

    getUsersMongoDB: function(req, res) {
        var pageNo = parseInt(req.body.pageNo)
        var size = 100
        var query = {}
        if (pageNo < 0 || pageNo === 0) {
            return handleJSONResponse(200, invalidPageFailure, genericFailure, null, res);
        }
        query.skip = size * (pageNo - 1)
        query.limit = size
        main.mongodb.usergeo(function(collection) {
            collection.find(
                {
                    userId: {
                        $ne: req.body.userId
                    }, 
                    location: { 
                        $near: {
                            $geometry: { 
                                type: "Point",  
                                coordinates: [ parseInt(req.body.latitude), parseInt(req.body.longitude) ] },
                            $maxDistance: getMeters(parseInt(req.body.maxDistance))
                        }
                    }
                },
                query
            ).toArray(function(error, docs) {
                console.log(docs);
                var count = docs.length;
                var data = {
                    "current": pageNo,
                    "next": pageNo + 1,
                    "pages": Math.ceil(count / size)
                }
                data.users = new Array;
                var success;

                if (count > 0) {

                    success = genericSuccess;
                    var results = new Array;

                    async.each(docs, function(doc, completion) {
                        checkForUser(doc.userId, function(success, error, documents) {
                            if (documents.length >= 1) {
                                var snapshotArray = new Array();
                                documents.forEach(function(document) {
                                    snapshotArray.push(generateUserModel(document[0]));
                                });
                                results.push(snapshotArray[0]);
                                return completion();
                            } else {
                                return completion();
                            }
                        });

                    }, function(err) {

                        if (err) {
                            console.log(err);
                            return handleJSONResponse(200, err, success, data, res);
                        } else {
                            if (results.length > 0) {
                                data.users = results;
                                return handleJSONResponse(200, null, success, data, res);
                            } else {
                                return handleJSONResponse(200, genericError, genericFailure, data, res);
                            }
                        }

                    });
                } else {
                    success = genericFailure;
                    return handleJSONResponse(200, error, success, data, res);
                }
                
            });
        });
        
    },

    createUser: function(req, res) {
        var object = createEmptyUserObject(req.body.email,req.body.name, req.body.uid,req.body.type);
        addFor(kUsers, object, function (success, error, document) {
            var data = { "userId": document.id }
            handleJSONResponse(200, error, success, data, res);
        });
    },

    createUserMongoDB: function(req, res) {
        var object = createEmptyUserObject(req.body.email,req.body.name, req.body.uid,req.body.type);
        main.mongodb.usergeo(function(collection) {
            collection.updateOne(
                {
                    "userId": req.body.userId
                },{
                    $set: {
                        _id: req.body.userId,
                        userId : req.body.userId,
                        h: userGeohash,
                        location: {
                            type: "Point", 
                            coordinates: [ parseFloat(req.body.latitude), parseFloat(req.body.longitude) ]
                        }
                    }
                },{
                    multi: true,
                    upsert: true
                }
            , function(err, result) {
                console.log("Inserted 3 documents into the collection");
                console.log(result);
                console.log(err);
                res.status(200).json({
                    "status": 200,
                    "success": { "result" : true, "message" : "Request was successful" },
                    "data": result,
                    "error": err
                });
            });
        });
    },

    createMatch: function(req, res) {
        //  Check if I've already liked this person to prevent duplicates.
        checkForMatch(req.body.senderId, req.body.recipientId, function(success, error, snapshots) {
            if (snapshots.size >= 1) {
                //  Duplicate exists.
                //  Check if person already matched me.
                var snapshotArray = new Array();
                snapshots.forEach(function(doc) {
                    snapshotArray.push(doc.data());
                });
                checkForMatch(req.body.recipientId, req.body.senderId, function(success, error, matches) {
                    console.log(success);
                    if (matches.size >= 1) {
                        console.log("Match exists");
                        //  Check if I already have a conversation started
                        checkForConversation(req.body.recipientId, req.body.senderId, function(success, error, conversations) {
                            console.log(success);
                            var conversationArray = new Array();
                            conversations.forEach(function(doc) {
                                conversationArray.push(doc.data());
                            });
                            if (conversations.size >= 1) {
                                console.log("Conversation already exists.");
                                var data = { "conversation": conversationArray[0], "match": snapshotArray[0]};
                                handleJSONResponse(200, error, success, data, res);
                            } else {
                                var object = createConversationObject(req.body.senderId, req.body.recipientId);
                                addFor(kConversations, object, function (success, error, document) {
                                    var data = { "conversationId": document.id }
                                    handleJSONResponse(200, error, success, data, res);
                                });
                            }
                        });
                    } else {
                        console.log("No match exists");
                        var data = { "match": results[0] };
                        handleJSONResponse(200, error, success, data, res);
                    }
                });
            } else {
                //  Duplicate does not exist. Create match.
                var object = createMatchObject(req.body.senderId, req.body.recipientId);
                addFor(kMatches, object, function (success, error, document) {
                    var data = { "matchId": document.id }
                    handleJSONResponse(200, error, success, data, res);
                });
            }
        });
    },

    findMatch: function(req, res) {
        checkForMatch(req.body.recipientId, req.body.senderId, function(success, error, results) {
            var data = { "match": results[0] };
            handleJSONResponse(200, error, success, data, res);
        });
    },

    createConversation: function(req, res) {
        var object = createConversationObject(req.body.senderId, req.body.recipientId);
        addFor(kConversations, object, function (success, error, data) {
            handleJSONResponse(200, error, success, data, res);
        });
    },

    findConversations: function(req, res) {
        //  Check if I already have a conversation started
        checkForConversation(req.body.senderId, req.body.senderId, function(success, error, conversations) {
            var conversationArray = new Array();
            if (conversations.size >= 1) {
                console.log(conversations.size);
                async.each(conversations.docs, function(doc, callback) {
                    var convo = generateConversationModel(doc, doc.data());
                    //  Get Recipient & Sender User Object
                    async.parallel({
                        recipient: function(callback) {
                            retrieveFor(kUsers, convo.recipientId, function(success, error, document) {
                                var object = generateUserModel(document, document.data());
                                callback(null, object);
                            });
                        },
                        sender: function(callback) {
                            retrieveFor(kUsers, convo.senderId, function(success, error, document) {
                                var object = generateUserModel(document, document.data());
                                callback(null, object);
                            });
                        },
                        lastMessage: function(callback) {
                            if (typeof convo.lastMessageId === 'undefined') {
                                console.log("Last message does not exist");
                                callback(null, null);
                            } else {
                                retrieveFor(kMessages, convo.lastMessageId, function(success, error, document) {
                                    var object = generateMessageModel(document, document.data());
                                    callback(null, object);
                                });
                            }
                        }
                    }, function(err, results) {
                        convo.sender = results.sender;
                        convo.recipient = results.recipient;
                        if (typeof convo.lastMessageId !== 'undefined') {
                            if (results.lastMessage.senderId === convo.senderId) {
                                results.lastMessage.sender = results.sender;
                            }
                            if (results.lastMessage.senderId === convo.recipientId) {
                                results.lastMessage.sender = results.recipient;
                            }
                            convo.lastMessage = results.lastMessage
                        }
                        conversationArray.push(convo);
                        callback();
                    });
                }, function(err) {
                    if (err) {
                        handleJSONResponse(200, genericError, genericFailure, null, res);
                    } else {
                        var data = { "conversations": conversationArray };
                        handleJSONResponse(200, error, success, data, res);
                    }
                });
            } else {
                handleJSONResponse(200, error, success, data, res);
            }
        });
    },

    findConversation: function(id, res) {
        //  Check if I already have a conversation started
        retrieveFor(kConversations, id, function(success, error, document) {
            var convo = generateConversationModel(document, document.data());
            //  Get Recipient & Sender User Object
            async.parallel({
                recipient: function(callback) {
                    retrieveFor(kUsers, convo.recipientId, function(success, error, document) {
                        var object = generateUserModel(document, document.data());
                        callback(null, object);
                    });
                },
                sender: function(callback) {
                    retrieveFor(kUsers, convo.senderId, function(success, error, document) {
                        var object = generateUserModel(document, document.data());
                        callback(null, object);
                    });
                },
                lastMessage: function(callback) {
                    console.log(convo);
                    if (typeof convo.lastMessageId === 'undefined') {
                        console.log("Last message does not exist");
                        callback(null, null);
                    } else {
                        retrieveFor(kMessages, convo.lastMessageId, function(success, error, document) {
                            var object = generateMessageModel(document, document.data());
                            callback(null, object);
                        });
                    }
                }
            }, function(err, results) {
                convo.sender = results.sender;
                convo.recipient = results.recipient;
                if (typeof convo.lastMessageId !== 'undefined') {
                    if (results.lastMessage.senderId === convo.senderId) {
                        results.lastMessage.sender = results.sender;
                    }
                    if (results.lastMessage.senderId === convo.recipientId) {
                        results.lastMessage.sender = results.recipient;
                    }
                    convo.lastMessage = results.lastMessage
                }
                var data = { "conversation": convo };
                handleJSONResponse(200, error, success, data, res);
            });
        });
    },

    getMessagesInConversation: function(id, res) {
        //  Check if I already have a conversation started
        checkForMessages(id, function(success, error, messages) {
            console.log(success);
            var messagesArray = new Array();
            messages.forEach(function(doc) {
                messagesArray.push(doc.data());
            });
            var data = { "messages": messagesArray};
            if (messages.size >= 1) {
                handleJSONResponse(200, error, success, data, res);
            } else {
                handleJSONResponse(200, error, success, data, res);
            }
        });
    },

    sendMessage: function(req, res) {
        var object = createMessageObject(req.body.conversationId, req.body.message, req.body.senderId);
        addFor(kMessages, object, function (success, error, data) {
            updateFor(kConversations, req.body.conversationKey, { "lastMessageId" : data.id, "updatedAt" : new Date() }, function (success, error, data) {
                handleJSONResponse(200, error, success, data, res);
            });
        });
    },

    uploadPicture: function(req, res) {
        updateFor(kUsers, req.userId, { 
            "userProfilePicture_1_url": req.userProfilePicture_1_url,
            "userProfilePicture_1_meta": req.userProfilePicture_1_meta,
            "userProfilePicture_2_url": req.userProfilePicture_2_url,
            "userProfilePicture_2_meta": req.userProfilePicture_2_meta,
            "userProfilePicture_3_url": req.userProfilePicture_3_url,
            "userProfilePicture_3_meta": req.userProfilePicture_3_meta,
        }, function (success, error, data) {
            handleJSONResponse(200, error, success, data, res);
        });
    },
    
    saveLocationMongoDB: function(req, res) {
        var userGeohash = geohash.encode(req.body.latitude, req.body.longitude, 10);
        main.mongodb.usergeo(function(collection) {
            collection.updateOne(
                {
                    "userId": req.body.userId
                },{
                    $set: {
                        _id: req.body.userId,
                        userId : req.body.userId,
                        h: userGeohash,
                        location: {
                            type: "Point", 
                            coordinates: [ parseFloat(req.body.latitude), parseFloat(req.body.longitude) ]
                        }
                    }
                },{
                    multi: true,
                    upsert: true
                }
            , function(error, result) {
                var data = {
                    "count": 0,
                    "results": result,
                }
                var success;
                if (!error) {
                    success = genericSuccess;
                } else {
                    success = genericFailure;
                }
                handleJSONResponse(200, error, success, data, res);
            });
        });
    },
}

function createEmptyUserObject(email, name, uid, type) {
    var data = {
        id: randomstring.generate(25),
        email: email,
        name: name,
        uid: uid,
        createdAt: new Date(),
        type: type,
        currentPage: 1,
        preferredCurrency: 'USD',
        notifications : false,
        maxDistance : 25.0,
        ageRangeId: null,
        ageRangeMin: null,
        ageRangeMax: null,
        initialSetup : false,
        userProfilePicture_1_url: null,
        userProfilePicture_1_meta: null,
        userProfilePicture_2_url: null,
        userProfilePicture_2_meta: null,
        userProfilePicture_3_url: null,
        userProfilePicture_3_meta: null,
        userProfilePicture_4_url: null,
        userProfilePicture_4_meta: null,
        userProfilePicture_5_url: null,
        userProfilePicture_5_meta: null,
        userProfilePicture_6_url: null,
        userProfilePicture_6_meta: null,
        dob: null,
        addressLine1 : null,
        addressLine2 : null,
        addressLine3 : null,
        addressLine4 : null,
        addressCity : null,
        addressState : null,
        addressZipCode : null,
        addressLong : null,
        addressLat : null,
        addressCountry: null,
        addressDescription: null,
        bio: null,
        jobTitle: null,
        companyName: null,
        schoolName: null,
        kidsCount: 0,
        kidsNames: null,
        kidsAges: null,
        kidsBio: null,
        questionOneTitle: null,
        questionOneResponse: null,
        questionTwoTitle: null,
        questionTwoResponse: null,
        questionThreeTitle: null,
        questionThreeResponse: null,
        canSwipe: true,
        nextSwipeDate: null,
        profileCreation : false
    }
    return data
}

function createMessageObject(conversationId, message, senderId) {
    var data = {
        id: randomstring.generate(25),
        conversationId: conversationId,
        message: message,
        createdAt: new Date(),
        senderId: senderId,
        attachment: null
    }
    return data
}

function createConversationObject(senderId, recipientId) {
    var data = {
        id: randomstring.generate(25),
        createdAt: new Date(),
        updatedAt: new Date(),
        senderId: senderId,
        recipientId: recipientId,
        lastMessageId: null
    }
    return data
}

function createMatchObject(senderId, recipientId) {
    var data = {
        id: randomstring.generate(25),
        createdAt: new Date(),
        updatedAt: new Date(),
        senderId: senderId,
        recipientId: recipientId,
    }
    return data
}

function checkForUser (uid, callback) {
    var parameters = [
        {
            key: "uid",
            condition: "==", 
            value: uid
        }
    ]
    retrieveWithParameters(kUsers, parameters, function(success, error, snapshots) {
        callback(success, error, snapshots);
    });
}

function checkForMatch (recipientId, senderId, callback) {
    var parameters = [
        {
            key: "recipientId",
            condition: "==", 
            value: senderId
        },{
            key: "senderId",
            condition: "==", 
            value: recipientId
        }
    ]
    retrieveWithParameters(kMatches, parameters, function(success, error, snapshots) {
        callback(success, error, snapshots);
    });
}

function checkForConversation (recipientId, senderId, callback) {
    var parameters = [
        {
            key: "recipientId",
            condition: "==", 
            value: senderId
        },{
            key: "senderId",
            condition: "==", 
            value: recipientId
        },{
            key: "recipientId",
            condition: "==", 
            value: recipientId
        },{
            key: "senderId",
            condition: "==", 
            value: senderId
        }
    ]
    retrieveWithParameters(kConversations, parameters, function(success, error, snapshots) {
        callback(success, error, snapshots);
    });
}

function checkForMessages (conversationId, callback) {
    var parameters = [
        {
            key: "conversationId",
            condition: "==", 
            value: conversationId
        }
    ]
    retrieveWithParameters(kMessages, parameters, function(success, error, results) {
        callback(success, error, results);
    });
}

//  MARK:- Model Generators
function generateUserModel(doc) {
    var data = { 
        key: doc.key,
        uid: doc.uid,
        name: {
            name: doc.name
        },
        createdAt: doc.createdAt,
        email: doc.email,
        type: doc.type,
        dob: doc.dob,
        currentPage: doc.currentPage,
        settings: {
            preferredCurrency: doc.preferredCurrency,
            notifications : doc.notifications,
            location: {
                addressLat: doc.addressLat,
                addressLong: doc.addressLong,
                addressCity: doc.addressCity,
                addressState: doc.addressState,
                addressDescription: doc.addressDescription,
                addressCountry: doc.addressCountry,
                addressLine1 : doc.addressLine1,
                addressLine2 : doc.addressLine2,
                addressLine3 : doc.addressLine3,
                addressLine4 : doc.addressLine4,
            },
            maxDistance: doc.maxDistance,
            ageRange: {
                ageRangeId: doc.ageRangeId,
                ageRangeMin: doc.ageRangeMin,
                ageRangeMax: doc.ageRangeMax
            },
            initialSetup: doc.initialSetup,
        },
        mediaArray: [
            {
                url: doc.userProfilePicture_1_url,
                meta: doc.userProfilePicture_1_meta,
                order: 1
            }, {
                url: doc.userProfilePicture_2_url,
                meta: doc.userProfilePicture_2_meta,
                order: 2
            }, {
                url: doc.userProfilePicture_3_url,
                meta: doc.userProfilePicture_3_meta,
                order: 3
            }, {
                url: doc.userProfilePicture_4_url,
                meta: doc.userProfilePicture_4_meta,
                order: 4
            }, {
                url: doc.userProfilePicture_5_url,
                meta: doc.userProfilePicture_5_url,
                order: 5
            }, {
                url: doc.userProfilePicture_6_url,
                meta: doc.userProfilePicture_6_meta,
                order: 6
            }
        ],
        userInformationSection1: [
            {
                type: "location",
                title: "Location",
                info: doc.addressCity + ", " + doc.addressState,
                image: "location"
            }, {
                type: "bio",
                title: "About Me",
                info: doc.bio,
                image: "bio"
            }, {
                type: "companyName",
                title: "Work",
                info: doc.companyName,
                image: "company"
            }, {
                type: "jobTitle",
                title: "Job Title",
                info: doc.jobTitle,
                image: "job"
            }, {
                type: "schoolName",
                title: "School / University",
                info: doc.schoolName,
                image: "school"
            }
        ],
        userInformationSection2: [
            {
                type: "kidsNames",
                title: "Kid's Names",
                info: doc.kidsNames,
                image: "kids"
            }, {
                type: "kidsAges",
                title: "Kids Ages",
                info: doc.kidsAges,
                image: "kids"
            }, {
                type: "kidsBio",
                title: "About My Kids",
                info: doc.kidsBio,
                image: "kids"
            }, {
                type: "kidsCount",
                title: "My Kids",
                info: doc.kidsCount,
                image: "kids"
            }
        ],
        userInformationSection3: [
            {
                type: "questionOne",
                title: doc.questionOneTitle,
                info: doc.questionOneResponse,
                image: "question"
            }, {
                type: "questionTwo",
                title: doc.questionTwoTitle,
                info: doc.questionTwoResponse,
                image: "question"
            }, {
                type: "questionThree",
                title: doc.questionThreeTitle,
                info: doc.questionThreeResponse,
                image: "question"
            }
        ],
        userPreferencesSection: [
            {
                type: "ageRange",
                title: "Age Range",
                info: {
                    ageRangeId: doc.ageRangeId,
                    ageRangeMin: doc.ageRangeMin,
                    ageRangeMax: doc.ageRangeMax
                }
            }, {
                type: "maxDistance",
                title: "Maximum Distance",
                info: doc.maxDistance
            }
        ],
        canSwipe: doc.canSwipe,
        nextSwipeDate: doc.nextSwipeDate,
        profileCreation : doc.profileCreation
    }
    return data
}

function generateConversationModel(document, doc) {
    var data = { 
        key: document.id,
        id: doc.id,
        senderId: doc.senderId,
        recipientId: doc.recipientId,
        createdAt: doc.createdAt,
        lastMessageId: doc.lastMessageId,
        updatedAt: doc.updatedAt
    }
    return data
}

function generateMessageModel(document, doc) {
    var data = { 
        key: document.id,
        id: doc.id,
        conversationId: doc.conversationId,
        senderId: doc.senderId,
        message: doc.message,
        createdAt: doc.createdAt
    }
    return data
}

//  MARK:- Useful functions
function getMeters(fromMiles) {
    return fromMiles * 1609.344
}


/*var success;
if (docs.length > 0) {
    success = genericSuccess;
    var results = new Array;
    async.each(docs, function(doc, completion) {
        checkForUser(doc.userId, function(success, error, documents) {
            if (documents.length >= 1) {
                var snapshotArray = new Array();
                documents.forEach(function(document) {
                    snapshotArray.push(generateUserModel(document[0]));
                });
                if (snapshotArray[0].mediaArray[0].url !== null) {
                    results.push(snapshotArray[0]);
                }
                return completion();
            } else {
                return completion();
            }
        });
    }, function(err) {
        if (err) {
            console.log(err);
            return handleJSONResponse(200, err, success, data, res);
        } else {
            var count = results.length
            var data = {
                "count": count,
                "current": pageNo,
                "pages": Math.ceil(count / size)
            }
            data.users = results;
            if (results.length > 0) {
                return handleJSONResponse(200, null, success, data, res);
            } else {
                return handleJSONResponse(200, genericError, genericFailure, data, res);
            }
        }
    });
} else {
    success = genericFailure;
    return handleJSONResponse(200, error, success, data, res);
}*/

// userId: {
//     $ne: req.body.userId
// }