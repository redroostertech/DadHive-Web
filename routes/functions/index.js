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
var kMapItems = 'map-items';

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
            callback(genericFailure, genericError, null);
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
                        if (Object.keys(data).length > 0) {
                            results.push(data);
                            return completion();
                        } else {
                            return completion();
                        }
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
                        if (Object.keys(data).length > 0) {
                            results.push(data);
                            return completion();
                        } else {
                            return completion();
                        }
                    });
                    return 
                } else if (p.condition === "==") {
                    var query = ref.where(p.key,'==', p.value);
                    query.get().then(function(querySnapshot) {
                        var data = querySnapshot.docs.map(function(doc) {
                            var d = doc.data();
                            d.key = doc.id;
                            return d;
                        });
                        if (Object.keys(data).length > 0) {
                            results.push(data[0]);
                            return completion();
                        } else {
                            return completion();
                        }
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
                        if (Object.keys(data).length > 0) {
                            results.push(data);
                            return completion();
                        } else {
                            return completion();
                        }
                    });
                    return
                }
            }, function(err) {
                if (err) {
                    console.log(err);
                    callback(genericFailure, err, null);
                } else {
                    if (results.length > 0) {
                        callback(genericSuccess, null, results[0]);
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

function deleteFor(collection, docID, callback) {
    main.firebase.firebase_firestore_db(function(reference) {
        if (!reference) { 
            callback(genericFailure, genericError , null);
        } else {
            reference.collection(collection).doc(docID).delete().then(function() {
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
            callback(genericFailure, genericError , null);
        } else {
            reference.collection(collection).add(data).then(function(docRef) {
                console.log("Document written with ID: ", docRef.id);
                callback(genericSuccess, null, docRef, docRef.id);
            }).catch(function (error) {
                callback(genericFailure, error, null);
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

//  MARK:- Realtime DB
function add(node, data, callback) {
    console.log(data);
    main.firebase.firebase_realtime_db(function(db) {
        if (!db) { 
            return callback(genericFailure, genericError , null);
        } else {
            var ref = db.ref(node);
            var newRef = ref.push();
            newRef.set(data).then(function() {
                return callback(genericSuccess, null, newRef, newRef.key);
            }).catch(function (error) {
                console.log(error);
                return callback(genericFailure, error, null);
            });
        }
    });
}

function retrieve(node, endpoint, callback) {
    main.firebase.firebase_realtime_db(function(reference) {
        if (!reference) { 
            return callback(genericFailure, genericError , null);
        } else {
            reference.ref(node + '/' + endpoint + '/').once('value').then(function(snapshot) {
                if (snapshot.val() === null) {
                    return callback(genericFailure, genericError , null);
                } else {
                    var data = snapshot.val();
                    return callback(genericSuccess, null, data);
                }
            }).catch(function (error) {
                return callback(genericFailure, error, null);
            });
        }
    });
}

function retrieveWith(node, key, endpoint, callback) {
    main.firebase.firebase_realtime_db(function(reference) {
        if (!reference) { 
            return callback(genericFailure, genericError , null);
        } else {
            reference.ref(node + '/' + endpoint).child(key).once('value').then(function(snapshot) {
                if (snapshot.val() === null) {
                    return callback(genericFailure, genericError , null);
                } else {
                    var data = snapshot.val();
                    return callback(genericSuccess, null, data);
                }
            }).catch(function (error) {
                return callback(genericFailure, error, null);
            });
        }
    });
}

function retrieveAt(node, endpoint, orderedBy, value, callback) {
    main.firebase.firebase_realtime_db(function(reference) {
        if (!reference) { 
            return callback(genericFailure, genericError , null);
        } else {
            reference.ref(node + '/' + endpoint).orderByChild(orderedBy).equalTo(value).once('value').then(function(snapshot) {
                if (snapshot.val() === null) {
                    return callback(genericFailure, genericError , null);
                } else {
                    var data = snapshot.val();
                    callback(genericSuccess, null, data);
                }
            }).catch(function (error) {
                return callback(genericFailure, error, null);
            });
        }
    });
}

function update(node, endpoint, value, callback) {
    main.firebase.firebase_realtime_db(function(reference) {
        if (!reference) { 
            return callback(genericFailure, genericError , null);
        } else {
            reference.ref(node + '/' + endpoint).update({
                value
            }).then(function(snapshot) {
                return callback(genericSuccess, null, snapshot);
                // sendTextResponse(res, twiml, "You have booked section " + obj.sectionTitle + " at " + venue.venueName + " Thank you for the booking.");
                // return;
            }).catch(function (error) {
                return callback(genericFailure, error, null);
                // sendTextResponse(res, twiml, "There was an error with your booking. Please try again.");
                // return;
            }); 
        }
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
                        coordinates: [ req.body.longitude, req.body.latitude ] },
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

    createPublicFileURL: function (storageName) {
        return `http://storage.googleapis.com/${main.configs.firebaseStorageBucket}/${encodeURIComponent(storageName)}`;
    }, 

    sendResponse: function(code, error, success, data, res) {
        handleJSONResponse(code, error, success, data, res);
    },

    signup: function(req, res, callback) {
        console.log(req.body);
        main.firebase.firebase_auth(function(auth) {
            auth.signOut().then(function() {
                auth.createUserWithEmailAndPassword(req.body.email, req.body.password).then(function () {
                    if (auth.currentUser === null) {
                        var error = {
                            "code": 200,
                            "message": "Something went wrong. Please try again later."
                        }
                        console.log(error);
                        handleJSONResponse (200, error, null, null, res)
                    } else {
                        var uid = auth.currentUser.uid; 
                        auth.signOut().then(function() {
                            callback(uid, req.body);
                        }).catch(function(error) {
                            console.log(error);
                            handleJSONResponse (200, error, null, null, res);
                        });
                    }
                }).catch(function (error) {
                    console.log(error);
                    handleJSONResponse (200, error, null, null, res);
                });
            }).catch(function(error) {
                console.log(error);
                handleJSONResponse (200, error, null, null, res);
            });
        });
    },

    signin: function(req, res) {
        main.firebase.firebase_auth(function(auth) {
            auth.signInWithEmailAndPassword(req.body.emailaddress, req.body.password).then(function () {
                auth.onAuthStateChanged(function (user) {
                    if (user) {
                        // checkForUser(user.uid, function(success, error, results) {
                        //     if (results.length >= 1) {
                        //         var snapshotArray = new Array();
                        //         results.forEach(function(result) {
                        //             snapshotArray.push(generateUserModel(result[0]));
                        //         });
                        //         var data = { "user": snapshotArray[0] };
                        //         handleJSONResponse(200, error, success, data, res);
                        //     }
                        // });
                        main.mongodb.usergeo(function(collection) {
                            collection.findOne(
                                {
                                    uid: user.uid
                                }, function(err, result) {
                                    if (err) return res.status(200).json({
                                        "status": 200,
                                        "success": { "result" : false, "message" : "There was an error" },
                                        "data": null,
                                        "error": err
                                    });
                    
                                    if (!result) return res.status(200).json({
                                        "status": 200,
                                        "success": { "result" : false, "message" : "User does not exist." },
                                        "data": null,
                                        "error": err
                                    });
                                    res.status(200).json({
                                        "status": 200,
                                        "success": { "result" : true, "message" : "Request was successful" },
                                        "data": generateUserModel(result),
                                        "error": err
                                    });
                            }); 
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

    createUserMongoDB: function(req, res) {

        // MARK: - Create user
        main.mongodb.usergeo(function(collection) {
            var user_object = createEmptyUserObject(req.body.email, req.body.name, req.body.uid, req.body.type, req.body.kidsCount, req.body.maritalStatus, req.body.linkedin, req.body.facebook, req.body.instagram, req.body.ageRanges, req.body.kidsNames);
            collection.insertOne(user_object, function(err, user) {
                if (err) return res.status(200).json({
                    "status": 200,
                    "success": { "result" : false, "message" : "There was an error" },
                    "data": null,
                    "error": err
                });

                if (!user) return res.status(200).json({
                    "status": 200,
                    "success": { "result" : false, "message" : "User does not exist." },
                    "data": null,
                    "error": err
                });

                // MARK: - Create actions
                main.mongodb.actioncol(function(action_collection) {
                    var action_object = createEmptyActionObject(req.body.uid);
                    action_collection.insertOne(action_object, function(error, action) {
                        if (error) return res.status(200).json({
                            "status": 200,
                            "success": { "result" : false, "message" : "There was an error" },
                            "data": null,
                            "error": error
                        });
        
                        if (!action) return res.status(200).json({
                            "status": 200,
                            "success": { "result" : false, "message" : "User does not exist." },
                            "data": null,
                            "error": error
                        });

                        // MARK: - Update user object
                        collection.updateOne(
                            {
                                uid: req.body.uid
                            },{
                                $set: {
                                    actions: action_object.id
                                }
                            },{
                                multi: true,
                                upsert: true
                            }
                        , function(final_error, updated_user) {
                            if (final_error) return res.status(200).json({
                                "status": 200,
                                "success": { "result" : false, "message" : "There was an error" },
                                "data": null,
                                "error": final_error
                            });
            
                            if (!updated_user) return res.status(200).json({
                                "status": 200,
                                "success": { "result" : false, "message" : "User does not exist." },
                                "data": null,
                                "error": err
                            });

                            // MARK: - Merge the data.
                            var user_data_formatted = user["ops"][0]
                            var actionFinal = generateActionModel(action["ops"][0]);
                            user_data_formatted.actions_results = [actionFinal];
                            var userFinal = generateUserModel(user_data_formatted);
                            res.status(200).json({
                                "status": 200,
                                "success": { "result" : true, "message" : "Request was successful" },
                                "data": userFinal,
                                "error": err
                            });
                        }); 
                    });
                });
            });
        });
    },

    getUserMongoDB: function(req, res) {
        main.mongodb.usergeo(function(collection) {
            collection.aggregate(
                {
                    $match : {
                        uid: req.body.userId
                    }
                },
                {
                    $lookup: {
                        from: "action",
                        localField: "uid",
                        foreignField: "owner",
                        as: "actions_results"
                    }
                }
                ,{ 
                    $group: {
                      _id: null
                    }
                  }
            ).toArray(function(err, result) {
                if (err) return res.status(200).json({
                    "status": 200,
                    "success": { "result" : false, "message" : "There was an error" },
                    "data": null,
                    "error": err
                });

                if (!result) return res.status(200).json({
                    "status": 200,
                    "success": { "result" : false, "message" : "User does not exist." },
                    "data": null,
                    "error": err
                });

                res.status(200).json({
                    "status": 200,
                    "success": { "result" : true, "message" : "Request was successful" },
                    "data": generateUserModel(result[0]),
                    "error": err
                });
            }); 
        });    
    },

    getUsersMongoDB: function(req, res) {
        main.mongodb.usergeo(function(collection) {
            collection.aggregate(
                {
                    $lookup: {
                        from: "action",
                        localField: "uid",
                        foreignField: "owner",
                        as: "actions_results"
                    }
                }
                ,{ 
                    $group: {
                      _id: null
                    }
                  }
            ).toArray(function(err, result) {
                if (err) return res.status(200).json({
                    "status": 200,
                    "success": { "result" : false, "message" : "There was an error" },
                    "data": null,
                    "error": err
                });

                if (!result) return res.status(200).json({
                    "status": 200,
                    "success": { "result" : false, "message" : "User does not exist." },
                    "data": null,
                    "error": err
                });

                function getUserModel(user) {
                    return generateUserModel(user);
                }

                res.status(200).json({
                    "status": 200,
                    "success": { "result" : true, "message" : "Request was successful" },
                    "data": {
                        "count": result.length,
                        "users": result.map(getUserModel),
                    },
                    "error": err
                });
            }); 
        });    
    },

    createMatchMongoDB: function(req, res) {
        async.parallel({
            addLike: function(callback) {
                main.mongodb.actioncol(function(collection) {
                    collection.updateOne(
                        {
                            "owner": req.body.senderId
                        },{
                            $set: {
                                updatedAt: new Date(),
                            }, 
                            $addToSet: { 
                                likes: req.body.recipientId 
                            }
                        },{
                            multi: true,
                            upsert: true
                        }
                    , function(err, result) {
                        callback(err, result);
                    });
                });
            },
            checkForMatch: function(callback) {
                main.mongodb.actioncol(function(collection) {
                    collection.findOneAndUpdate({
                        owner: {
                            $eq: req.body.recipientId
                        }, 
                        likes: {
                            $in: [req.body.senderId]
                        },
                        blocked: {
                            $nin: [req.body.senderId]
                        }
                    }, {
                        $addToSet: { 
                            matches: req.body.senderId 
                        }
                    }, {
                        returnNewDocument: true
                    }, function(err, docs) {
                        if (err) return callback(err, false);
                        if (!docs || !docs.value) return callback(err, false);
                        callback(err, true);
                    });
                });
            },
        }, function(err, results) {
            if (err) return handleJSONResponse(200, err, genericFailure, results, res);
            if (results.checkForMatch) {
                main.mongodb.actioncol(function(collection) {
                    collection.findOneAndUpdate({
                        owner: {
                            $eq: req.body.senderId
                        }
                    }, {
                        $addToSet: { 
                            matches: req.body.recipientId 
                        }
                    }, {
                        returnNewDocument: true
                    }, function(err, docs) {
                        if (err) return res.status(200).json({
                            "status": 200,
                            "success": { "result" : false, "message" : "There was an error" },
                            "data": null,
                            "error": err
                        });
                        if (!docs) return res.status(200).json({
                            "status": 200,
                            "success": { "result" : false, "message" : "User does not exist." },
                            "data": null,
                            "error": err
                        });
        
                        res.status(200).json({
                            "status": 200,
                            "success": { "result" : true, "message" : "Request was successful" },
                            "data": { 
                                "match_exists": results.checkForMatch,
                                "action": docs.value
                            },
                            "error": err
                        });
                    });
                });
            } else {
                res.status(200).json({
                    "status": 200,
                    "success": { "result" : true, "message" : "Request was successful" },
                    "data": { 
                        "match_exists": results.checkForMatch,
                        "action": null 
                    },
                    "error": err
                });
            }
        });
    },

    getMatchesMongoDB: function(req, res) {
        main.mongodb.actioncol(function(collection) {
            collection.aggregate(
                {
                    $match : {
                        owner: req.body.userId
                    }
                },{
                    $unwind: "$matches"
                },{
                    $lookup: {
                        from: "user-geo",
                        localField: "matches",
                        foreignField: "uid",
                        as: "users"
                    }
                },{
                    $group: {
                        _id: null,
                        users: { $push: "$matches" }
                    }
                }
            ).toArray(function(err, result) {
                if (err) return res.status(200).json({
                    "status": 200,
                    "success": { "result" : false, "message" : "There was an error" },
                    "data": null,
                    "error": err
                });

                if (!result || !result[0]) return res.status(200).json({
                    "status": 200,
                    "success": { "result" : false, "message" : "User does not exist." },
                    "data": null,
                    "error": err
                });

                function getUserModel(object) {
                    var i = generateUserModel(object.users[0]);
                    i.actions_results = [];
                    return i;
                }

                res.status(200).json({
                    "status": 200,
                    "success": { "result" : true, "message" : "Request was successful" },
                    "data": {
                        "count": result.length,
                        "users": result.map(getUserModel),
                    },
                    "error": err
                });
            }); 
        });
    },

    getConversationsMongoDB: function(req, res) {
        main.mongodb.actioncol(function(collection) {
            collection.aggregate(
                {
                    $match : {
                        owner: req.body.userId
                    }
                },{ 
                    $unwind: "$conversations" 
                },{
                    $lookup: {
                        from: "conversations",
                        localField: "conversations",
                        foreignField: "id",
                        as: "conversations"
                    }
                },{
                    $group: {
                        _id: null,
                        conversations: { $push: "$conversations" }
                    }
                }
            ).toArray(function(err, result) {
                if (err) return res.status(200).json({
                    "status": 200,
                    "success": { "result" : false, "message" : "There was an error" },
                    "data": null,
                    "error": err
                });

                if (!result || !result[0]) return res.status(200).json({
                    "status": 200,
                    "success": { "result" : false, "message" : "No conversations exist for user." },
                    "data": null,
                    "error": err
                });

                function getConversationModel(object) {
                    return generateConversationModel(object.conversations[0]);
                }

                res.status(200).json({
                    "status": 200,
                    "success": { "result" : true, "message" : "Request was successful" },
                    "data": {
                        "count": result.length,
                        "conversations": result.map(getConversationModel),
                    },
                    "error": err
                });
            }); 
        });
    },

    getUsersInConversationMongoDB: function(req,res) {
        main.mongodb.convoscol(function(collection) {
            collection.aggregate(
                {
                    $match : {
                        id: req.body.conversationId
                    }
                }, 
                { 
                    $unwind: "$participants" 
                }, {
                    $lookup: {
                        from: "user-geo",
                        localField: "participants",
                        foreignField: "uid",
                        as: "participants"
                    }
                }, {
                    $group: {
                        _id: null,
                        participants: { $push: "$participants" }
                    }
                }
            ).toArray(function(err, result) {
                if (err) return res.status(200).json({
                    "status": 200,
                    "success": { "result" : false, "message" : "There was an error" },
                    "data": null,
                    "error": err
                });

                if (!result || !result[0]) return res.status(200).json({
                    "status": 200,
                    "success": { "result" : false, "message" : "No conversations exist for user." },
                    "data": null,
                    "error": err
                });

                function getUserModel(object) {
                    var i = generateUserModel(object.participants[0]);
                    i.actions_results = [];
                    return i;
                }

                res.status(200).json({
                    "status": 200,
                    "success": { "result" : true, "message" : "Request was successful" },
                    "data": {
                        "count": result.length,
                        "users": result.map(getUserModel),
                    },
                    "error": err
                });
            }); 
        });
    },

    createConversationMongoDB: function(req, res) {
        main.mongodb.convoscol(function(collection) {
            // MARK :- Check if a conversation already exists.
            collection.findOne({
                participants: {
                    $in: [req.body.senderId, req.body.recipientId]
                }
            }, function(err, docs) {
                if (err) return res.status(200).json({
                    "status": 200,
                    "success": { "result" : true, "message" : "There was an error" },
                    "data": null,
                    "error": err
                });
                if (!docs) {
                    // MARK :- Create empty conversation object
                    var convo_object = createConversationObject(req.body.senderId, req.body.recipientId);
                    main.mongodb.convoscol(function(collection) {
                        collection.insertOne(convo_object, function(err, convo) {
                            if (err) return res.status(200).json({
                                "status": 200,
                                "success": { "result" : false, "message" : "There was an error" },
                                "data": null,
                                "error": err
                            });
            
                            if (!convo) return res.status(200).json({
                                "status": 200,
                                "success": { "result" : false, "message" : "Conversation does not exist." },
                                "data": null,
                                "error": err
                            });

                            main.mongodb.actioncol(function(collection) {
                                collection.updateMany({
                                    $or: [ 
                                        {
                                            owner: {
                                                $eq: req.body.senderId
                                            }
                                        },
                                        {
                                            owner: {
                                                $eq: req.body.recipientId
                                            }
                                        }
                                    ]
                                }, {
                                    $addToSet: { 
                                        conversations: convo_object.id
                                    }
                                }, {
                                    returnNewDocument: true
                                }, function(err, docs) {
                                    if (err) return res.status(200).json({
                                        "status": 200,
                                        "success": { "result" : false, "message" : "There was an error" },
                                        "data": null,
                                        "error": err
                                    });
                                    if (!docs) return res.status(200).json({
                                        "status": 200,
                                        "success": { "result" : false, "message" : "User conversations not updated." },
                                        "data": null,
                                        "error": err
                                    });
                    
                                    res.status(200).json({
                                        "status": 200,
                                        "success": { "result" : true, "message" : "Request was successful" },
                                        "data": {
                                            "action": docs.modifiedCount,
                                            "conversation": convo_object
                                        },
                                        "error": err
                                    });
                                });
                            });
                        });
                    });
                } else {
                    res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "Conversation already exists." },
                        "data": null,
                        "error": err
                    });
                }
            });
        });
    },

    addParticipantMongoDB: function(req, res) {
        main.mongodb.convoscol(function(collection) {
            collection.findOneAndUpdate({
                owner: {
                    $eq: req.body.senderId
                },
                id: {
                    $eq: req.body.conversationId
                },
                participants: {
                    $nin: [req.body.participantId]
                }
            }, {
                $addToSet: { 
                    participants: req.body.participantId 
                }
            }, {
                returnNewDocument: true
            }, function(err, docs) {
                if (err) return res.status(200).json({
                    "status": 200,
                    "success": { "result" : false, "message" : "There was an error" },
                    "data": null,
                    "error": err
                });

                if (!docs || !docs.value) return res.status(200).json({
                    "status": 200,
                    "success": { "result" : false, "message" : "Participant not added." },
                    "data": null,
                    "error": err
                });

                var convo_object = docs.value;
                main.mongodb.actioncol(function(collection) {
                    collection.findOneAndUpdate({
                        owner: {
                            $eq: req.body.participantId
                        }
                    }, {
                        $addToSet: { 
                            conversations: req.body.conversationId
                        }
                    }, {
                        returnNewDocument: true
                    }, function(err, docs) {
                        if (err) return res.status(200).json({
                            "status": 200,
                            "success": { "result" : false, "message" : "There was an error" },
                            "data": null,
                            "error": err
                        });
                        if (!docs) return res.status(200).json({
                            "status": 200,
                            "success": { "result" : false, "message" : "User conversations not updated." },
                            "data": null,
                            "error": err
                        });
        
                        res.status(200).json({
                            "status": 200,
                            "success": { "result" : true, "message" : "Request was successful" },
                            "data": {
                                "action": docs.value,
                                "conversation": convo_object,
                            },
                            "error": err
                        });
                    });
                });
            })
        });
    },

    removeParticipantMongoDB: function(req, res) {
        main.mongodb.convoscol(function(collection) {
            collection.findOneAndUpdate({
                owner: {
                    $eq: req.body.senderId
                },
                id: {
                    $eq: req.body.conversationId
                },
            }, {
                $pull: { 
                    participants: req.body.participantId 
                }
            }, {
                returnNewDocument: true
            }, function(err, docs) {
                if (err) return res.status(200).json({
                    "status": 200,
                    "success": { "result" : false, "message" : "There was an error" },
                    "data": null,
                    "error": err
                });

                if (!docs || !docs.value) return res.status(200).json({
                    "status": 200,
                    "success": { "result" : false, "message" : "Participant not removed." },
                    "data": null,
                    "error": err
                });

                var convo_object = docs.value;
                main.mongodb.actioncol(function(collection) {
                    collection.findOneAndUpdate({
                        owner: {
                            $eq: req.body.participantId
                        }
                    }, {
                        $pull: { 
                            conversations: req.body.conversationId
                        }
                    }, {
                        returnNewDocument: true
                    }, function(err, docs) {
                        if (err) return res.status(200).json({
                            "status": 200,
                            "success": { "result" : false, "message" : "There was an error" },
                            "data": null,
                            "error": err
                        });
                        if (!docs) return res.status(200).json({
                            "status": 200,
                            "success": { "result" : false, "message" : "User conversations not updated." },
                            "data": null,
                            "error": err
                        });
        
                        res.status(200).json({
                            "status": 200,
                            "success": { "result" : true, "message" : "Request was successful" },
                            "data": {
                                "action": docs.value,
                                "conversation": convo_object,
                            },
                            "error": err
                        });
                    });
                });
            })
        });
    },

    getMessagesInConversation: function(id, res) {
        //  Check if I already have a conversation started
        checkForMessages(id, function(success, error, messages) {
            console.log(messages);
            var messagesArray = new Array();
            if (messages === null) {
                var data = { "messages": messagesArray};
                handleJSONResponse(200, error, success, data, res);
            } else {
                messages.forEach(function(doc) {
                    messagesArray.push(doc.data());
                });
                var data = { "messages": messagesArray};
                if (messages.size >= 1) {
                    handleJSONResponse(200, error, success, data, res);
                } else {
                    handleJSONResponse(200, error, success, data, res);
                }
            }
        });
    },

    sendMessageMongoDB: function(req, res) {
        main.mongodb.convoscol(function(collection) {
            // MARK :- Check if a conversation already exists.
            collection.findOne({
                id: {
                    $eq: req.body.conversationId
                },
                participants: {
                    $in: [req.body.senderId]
                }
            }, function(err, docs) {
                if (err) return res.status(200).json({
                    "status": 200,
                    "success": { "result" : true, "message" : "There was an error" },
                    "data": null,
                    "error": err
                });
                if (docs) {
                    // MARK: - Part of conversation open up socket to conversation for real time updates.
                    res.status(200).json({
                        "status": 200,
                        "success": { "result" : true, "message" : "Open socket" },
                        "data": null,
                        "error": err
                    });
                } else {
                    res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "No longer part of the conversation." },
                        "data": null,
                        "error": err
                    });
                }
            });
        });
    },

    getNearByUsersMongoDB: function(req, res) {
        var pageNo = parseInt(req.body.pageNo)
        var size = 100
        var perPage = parseInt(req.body.perPage)
        var query = {}
        var find = {
            userId: {
                $nin: [req.body.userId]
            }, 
            location: { 
                $near: {
                    $geometry: { 
                        type: "Point",  
                        coordinates: [ parseFloat(req.body.longitude),parseFloat(req.body.latitude) ] },
                    $maxDistance: getMeters(parseFloat(req.body.maxDistance))
                }
            }
        }
        if (pageNo < 0 || pageNo === 0) {
            return handleJSONResponse(200, invalidPageFailure, genericFailure, null, res);
        }
        query.skip = size * (pageNo - 1)
        query.limit = size

        if (typeof(req.body.lastId) !== "undefined" && req.body.lastId !== '') {
            find.userId.$nin.push(req.body.lastId);
        }

        console.log(find);
        
        main.mongodb.usergeo(function(collection) {
            collection.find(
                find,
                query
            ).toArray(function(error, docs) {
                if (docs !== null) {
                    var resultsCount = docs.length;
                    var totalPages = Math.ceil(resultsCount / size);
                    var data = {
                        "currentPage": pageNo,
                        "nextPage": totalPages > pageNo ? pageNo + 1: totalPages,
                        "totalPages": totalPages,
                        "resultsCount": 0,
                        "resultsPerPage": perPage,
                    }
                    data.users = new Array;
                    var success;

                    if (resultsCount > 0) {

                        success = genericSuccess;
                        var finalData = new Array;

                        async.each(docs, function(doc, completion) {
                            if (doc.ageRangeId <= parseFloat(req.body.ageRangeId)) {
                                var emptyImages = [doc.userProfilePicture_1_url, doc.userProfilePicture_2_url, doc.userProfilePicture_3_url, doc.userProfilePicture_4_url, doc.userProfilePicture_5_url, doc.userProfilePicture_6_url]
                                if (emptyImages.filter(x => x).length > 0) {
                                    //console.log(obj);
                                    finalData.push(generateUserModel(doc));
                                    data.resultsCount += 1;
                                    return completion();
                                } else {
                                    //console.log("Does not include images");
                                    return completion();
                                }
                            } else {
                                //console.log("Does not include age range ID");
                                finalData.push(generateUserModel(doc));
                                data.resultsCount += 1;
                                return completion();
                            }
                        }, function(err) {
                            //console.log("Final data: ", finalData);
                            if (err) {
                                console.log(err);
                                return handleJSONResponse(200, err, success, data, res);
                            } else {
                                if (finalData.length > 0 || finalData !== null) {
                                    //data.resultsCount += 1;
                                    data.users = finalData.filter(x => x);
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
                } else {
                    return handleJSONResponse(200, error, success, data, res);
                }
            });
        });
        
    },

    saveLocationMongoDB: function(req, res) {
        main.mongodb.usergeo(function(collection) {
            collection.updateOne(
                {
                    uid: req.body.userId
                },{
                    $set: {
                        location: {
                            type: "Point", 
                            coordinates: [ parseFloat(req.body.longitude), parseFloat(req.body.latitude) ]
                        },
                        addressLine1: req.body.addressLine1 || null,
                        addressLong: parseFloat(req.body.longitude),
                        addressLat: parseFloat(req.body.latitude),
                        addressLine2: req.body.addressLine2 || null,
                        addressLine3: req.body.addressLine3 || null,
                        addressLine4: req.body.addressLine4 || null,
                        addressCity: req.body.addressCity || null,
                        addressState: req.body.addressState || null,
                        addressZipCode: req.body.addressZipCode || null,
                        addressCountry: req.body.addressCountry || null,
                        addressDescription: req.body.addressDescription || null,
                    }
                },{
                    multi: true,
                    upsert: true
                }
            , function(err, result) {
                res.status(200).json({
                    "status": 200,
                    "success": { "result" : true, "message" : "Request was successful" },
                    "data": result,
                    "error": err
                });
            }); 
        });       
    },

    deleteAllMongoUserGeoElements: function(req, res) {
        main.mongodb.usergeo(function(collection) {
            collection.deleteMany(function(error, result) {
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

    deleteGeosBut: function(req, res) {
        main.mongodb.usergeo(function(collection) {
            collection.deleteMany(
                {
                    _id: {
                        $nin: [req.body.ids.map(function(id) {
                            return 'ObjectId("'+ id +'")';
                        })]
                    }
                }, function(error, result) {
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

    deleteGeo: function(req, res) {
        var id = 'ObjectId("'+req.body.id+'")';
        console.log(id);
        main.mongodb.usergeo(function(collection) {
            collection.deleteOne(
                {
                    "_id": id,
                }, function(error, result) {
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

    deleteAllMongoActionElements: function(req, res) {
        main.mongodb.actioncol(function(collection) {
            collection.deleteMany(function(error, result) {
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

    blockUserMongoDB: function(req, res) {
        async.parallel({
            blockThem: function(callback) {
                main.mongodb.actioncol(function(collection) {
                    collection.updateOne(
                        {
                            "owner": req.body.senderId
                        },{
                            $set: {
                                updatedAt: new Date(),
                            }, 
                            $addToSet: { 
                                blocked: req.body.recipientId 
                            },
                            $pull: { 
                                matches: req.body.recipientId 
                            }
                        },{
                            multi: true,
                            upsert: true
                        }
                    , function(err, result) {
                        callback(err, result);
                    });
                });
            },
            removeMyConversation: function(callback) {
                main.mongodb.convoscol(function(collection) {
                    collection.findOneAndUpdate({
                        participants: {
                            $in: [req.body.senderId, req.body.recipientId]
                        }
                    }, {
                        $pull: { 
                            participants: [req.body.senderId, req.body.recipientId]
                        }
                    }, {
                        returnNewDocument: true
                    }, function(err, docs) {
                        if (err) return callback(err, false);
                        if (!docs || !docs.value) return callback(err, false);
                        callback(err, true);
                    });
                });
            },
            blockMe: function(callback) {
                main.mongodb.actioncol(function(collection) {
                    collection.updateOne(
                        {
                            "owner": req.body.recipientId
                        },{
                            $set: {
                                updatedAt: new Date(),
                            }, 
                            $addToSet: { 
                                blocked: req.body.senderId 
                            },
                            $pull: { 
                                matches: req.body.senderId 
                            }
                        },{
                            multi: true,
                            upsert: true
                        }
                    , function(err, result) {
                        callback(err, result);
                    });
                });
            }
        }, function(err, results) {
            if (err) return res.status(200).json({
                "status": 200,
                "success": { "result" : false, "message" : "There was an error" },
                "data": null,
                "error": err
            });
            if (!results) return res.status(200).json({
                "status": 200,
                "success": { "result" : false, "message" : "User was not blocked." },
                "data": null,
                "error": err
            });

            res.status(200).json({
                "status": 200,
                "success": { "result" : true, "message" : "User was blocked" },
                "data": null,
                "error": err
            });
        });
    },

    editUserMongoDB: function(req, res) {
        if (req.body.type == "name") {
            main.mongodb.usergeo(function(collection) {
                collection.updateOne(
                    {
                        uid: req.body.userId
                    },{
                        $set: {    
                            name: req.body.value
                        }
                    },{
                        multi: true,
                    }
                , function(err, result) {
                    if (err) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "There was an error" },
                        "data": null,
                        "error": err
                    });
                    if (!result) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "User was not updated." },
                        "data": null,
                        "error": err
                    });
        
                    res.status(200).json({
                        "status": 200,
                        "success": { "result" : true, "message" : "User was updated" },
                        "data": req.body,
                        "error": err
                    });
                });
            });
        }

        if (req.body.type == "dob") {
            main.mongodb.usergeo(function(collection) {
                collection.updateOne(
                    {
                        uid: req.body.userId
                    },{
                        $set: {    
                            dob: req.body.value
                        }
                    },{
                        multi: true,
                    }
                , function(err, result) {
                    if (err) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "There was an error" },
                        "data": null,
                        "error": err
                    });
                    if (!result) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "User was not updated." },
                        "data": null,
                        "error": err
                    });
        
                    res.status(200).json({
                        "status": 200,
                        "success": { "result" : true, "message" : "User was updated" },
                        "data": req.body,
                        "error": err
                    });
                });
            });
        }

        if (req.body.type == "bio") {
            main.mongodb.usergeo(function(collection) {
                collection.updateOne(
                    {
                        uid: req.body.userId
                    },{
                        $set: {    
                            bio: req.body.value
                        }
                    },{
                        multi: true,
                    }
                , function(err, result) {
                    if (err) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "There was an error" },
                        "data": null,
                        "error": err
                    });
                    if (!result) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "User was not updated." },
                        "data": null,
                        "error": err
                    });
        
                    res.status(200).json({
                        "status": 200,
                        "success": { "result" : true, "message" : "User was updated" },
                        "data": req.body,
                        "error": err
                    });
                });
            });
        }

        if (req.body.type == "companyName") {
            main.mongodb.usergeo(function(collection) {
                collection.updateOne(
                    {
                        uid: req.body.userId
                    },{
                        $set: {    
                            companyName: req.body.value
                        }
                    },{
                        multi: true,
                    }
                , function(err, result) {
                    if (err) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "There was an error" },
                        "data": null,
                        "error": err
                    });
                    if (!result) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "User was not updated." },
                        "data": null,
                        "error": err
                    });
        
                    res.status(200).json({
                        "status": 200,
                        "success": { "result" : true, "message" : "User was updated" },
                        "data": req.body,
                        "error": err
                    });
                });
            });
        }

        if (req.body.type == "jobTitle") {
            main.mongodb.usergeo(function(collection) {
                collection.updateOne(
                    {
                        uid: req.body.userId
                    },{
                        $set: {    
                            jobTitle: req.body.value
                        }
                    },{
                        multi: true,
                    }
                , function(err, result) {
                    if (err) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "There was an error" },
                        "data": null,
                        "error": err
                    });
                    if (!result) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "User was not updated." },
                        "data": null,
                        "error": err
                    });
        
                    res.status(200).json({
                        "status": 200,
                        "success": { "result" : true, "message" : "User was updated" },
                        "data": req.body,
                        "error": err
                    });
                });
            });
        }

        if (req.body.type == "schoolName") {
            main.mongodb.usergeo(function(collection) {
                collection.updateOne(
                    {
                        uid: req.body.userId
                    },{
                        $set: {    
                            schoolName: req.body.value
                        }
                    },{
                        multi: true,
                    }
                , function(err, result) {
                    if (err) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "There was an error" },
                        "data": null,
                        "error": err
                    });
                    if (!result) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "User was not updated." },
                        "data": null,
                        "error": err
                    });
        
                    res.status(200).json({
                        "status": 200,
                        "success": { "result" : true, "message" : "User was updated" },
                        "data": req.body,
                        "error": err
                    });
                });
            });
        }

        if (req.body.type == "kidsNames") {
            main.mongodb.usergeo(function(collection) {
                collection.updateOne(
                    {
                        uid: req.body.userId
                    },{
                        $set: {    
                            kidsNames: req.body.value
                        }
                    },{
                        multi: true,
                    }
                , function(err, result) {
                    if (err) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "There was an error" },
                        "data": null,
                        "error": err
                    });
                    if (!result) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "User was not updated." },
                        "data": null,
                        "error": err
                    });
        
                    res.status(200).json({
                        "status": 200,
                        "success": { "result" : true, "message" : "User was updated" },
                        "data": req.body,
                        "error": err
                    });
                });
            });
        }

        if (req.body.type == "kidsAges") {
            main.mongodb.usergeo(function(collection) {
                collection.updateOne(
                    {
                        uid: req.body.userId
                    },{
                        $set: {    
                            kidsAges: req.body.value
                        }
                    },{
                        multi: true,
                    }
                , function(err, result) {
                    if (err) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "There was an error" },
                        "data": null,
                        "error": err
                    });
                    if (!result) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "User was not updated." },
                        "data": null,
                        "error": err
                    });
        
                    res.status(200).json({
                        "status": 200,
                        "success": { "result" : true, "message" : "User was updated" },
                        "data": req.body,
                        "error": err
                    });
                });
            });
        }

        if (req.body.type == "kidsBio") {
            main.mongodb.usergeo(function(collection) {
                collection.updateOne(
                    {
                        uid: req.body.userId
                    },{
                        $set: {    
                            kidsBio: req.body.value
                        }
                    },{
                        multi: true,
                    }
                , function(err, result) {
                    if (err) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "There was an error" },
                        "data": null,
                        "error": err
                    });
                    if (!result) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "User was not updated." },
                        "data": null,
                        "error": err
                    });
        
                    res.status(200).json({
                        "status": 200,
                        "success": { "result" : true, "message" : "User was updated" },
                        "data": req.body,
                        "error": err
                    });
                });
            });
        }

        if (req.body.type == "maxDistance") {
            main.mongodb.usergeo(function(collection) {
                collection.updateOne(
                    {
                        uid: req.body.userId
                    },{
                        $set: {    
                            maxDistance: parseFloat(req.body.value)
                        }
                    },{
                        multi: true,
                    }
                , function(err, result) {
                    if (err) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "There was an error" },
                        "data": null,
                        "error": err
                    });
                    if (!result) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "User was not updated." },
                        "data": null,
                        "error": err
                    });
        
                    res.status(200).json({
                        "status": 200,
                        "success": { "result" : true, "message" : "User was updated" },
                        "data": req.body,
                        "error": err
                    });
                });
            });
        }

        if (req.body.type == "ageRanges") {
            main.mongodb.usergeo(function(collection) {
                collection.updateOne(
                    {
                        uid: req.body.userId
                    },{
                        $set: {    
                            ageRanges: req.body.value
                        }
                    },{
                        multi: true,
                    }
                , function(err, result) {
                    if (err) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "There was an error" },
                        "data": null,
                        "error": err
                    });
                    if (!result) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "User was not updated." },
                        "data": null,
                        "error": err
                    });
        
                    res.status(200).json({
                        "status": 200,
                        "success": { "result" : true, "message" : "User was updated" },
                        "data": req.body,
                        "error": err
                    });
                });
            });
        }

        if (req.body.type == "initialSetup") {
            main.mongodb.usergeo(function(collection) {
                collection.updateOne(
                    {
                        uid: req.body.userId
                    },{
                        $set: {    
                            initialSetup: req.body.value
                        }
                    },{
                        multi: true,
                    }
                , function(err, result) {
                    if (err) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "There was an error" },
                        "data": null,
                        "error": err
                    });
                    if (!result) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "User was not updated." },
                        "data": null,
                        "error": err
                    });
        
                    res.status(200).json({
                        "status": 200,
                        "success": { "result" : true, "message" : "User was updated" },
                        "data": req.body,
                        "error": err
                    });
                });
            });
        }

        if (req.body.type == "userType") {
            main.mongodb.usergeo(function(collection) {
                collection.updateOne(
                    {
                        uid: req.body.userId
                    },{
                        $set: {    
                            type: req.body.value
                        }
                    },{
                        multi: true,
                    }
                , function(err, result) {
                    if (err) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "There was an error" },
                        "data": null,
                        "error": err
                    });
                    if (!result) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "User was not updated." },
                        "data": null,
                        "error": err
                    });
        
                    res.status(200).json({
                        "status": 200,
                        "success": { "result" : true, "message" : "User was updated" },
                        "data": req.body,
                        "error": err
                    });
                });
            });
        }

        if (req.body.type == "kidsCount") {
            main.mongodb.usergeo(function(collection) {
                collection.updateOne(
                    {
                        uid: req.body.userId
                    },{
                        $set: {    
                            kidsCount: parseFloat(req.body.value)
                        }
                    },{
                        multi: true,
                    }
                , function(err, result) {
                    if (err) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "There was an error" },
                        "data": null,
                        "error": err
                    });
                    if (!result) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "User was not updated." },
                        "data": null,
                        "error": err
                    });
        
                    res.status(200).json({
                        "status": 200,
                        "success": { "result" : true, "message" : "User was updated" },
                        "data": req.body,
                        "error": err
                    });
                });
            });
        }

        if (req.body.type == "canSwipe") {
            var date = new Date();
            date.setDate(date.getDate() + 1);
            main.mongodb.usergeo(function(collection) {
                collection.updateOne(
                    {
                        uid: req.body.userId
                    },{
                        $set: {    
                            canSwipe: req.body.value,
                            nextSwipeDate: date
                        }
                    },{
                        multi: true,
                    }
                , function(err, result) {
                    if (err) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "There was an error" },
                        "data": null,
                        "error": err
                    });
                    if (!result) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "User was not updated." },
                        "data": null,
                        "error": err
                    });

                    req.body.nextSwipeDate = date;

                    res.status(200).json({
                        "status": 200,
                        "success": { "result" : true, "message" : "User was updated" },
                        "data": req.body,
                        "error": err
                    });
                });
            });
        }

        if (req.body.type == "linkedin") {
            main.mongodb.usergeo(function(collection) {
                collection.updateOne(
                    {
                        uid: req.body.userId
                    },{
                        $set: {    
                            socialLinkedIn: req.body.value,
                        }
                    },{
                        multi: true,
                    }
                , function(err, result) {
                    if (err) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "There was an error" },
                        "data": null,
                        "error": err
                    });
                    if (!result) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "User was not updated." },
                        "data": null,
                        "error": err
                    });
        
                    res.status(200).json({
                        "status": 200,
                        "success": { "result" : true, "message" : "User was updated" },
                        "data": req.body,
                        "error": err
                    });
                });
            });
        }

        if (req.body.type == "instagram") {
            main.mongodb.usergeo(function(collection) {
                collection.updateOne(
                    {
                        uid: req.body.userId
                    },{
                        $set: {    
                            socialInstagram: req.body.value
                        }
                    },{
                        multi: true,
                    }
                , function(err, result) {
                    if (err) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "There was an error" },
                        "data": null,
                        "error": err
                    });
                    if (!result) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "User was not updated." },
                        "data": null,
                        "error": err
                    });
        
                    res.status(200).json({
                        "status": 200,
                        "success": { "result" : true, "message" : "User was updated" },
                        "data": req.body,
                        "error": err
                    });
                });
            });
        }

        if (req.body.type == "facebook") {
            main.mongodb.usergeo(function(collection) {
                collection.updateOne(
                    {
                        uid: req.body.userId
                    },{
                        $set: {    
                            socialFacebook: req.body.value
                        }
                    },{
                        multi: true,
                    }
                , function(err, result) {
                    if (err) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "There was an error" },
                        "data": null,
                        "error": err
                    });
                    if (!result) return res.status(200).json({
                        "status": 200,
                        "success": { "result" : false, "message" : "User was not updated." },
                        "data": null,
                        "error": err
                    });
        
                    res.status(200).json({
                        "status": 200,
                        "success": { "result" : true, "message" : "User was updated" },
                        "data": req.body,
                        "error": err
                    });
                });
            });
        }

        return res.status(200).json({
            "status": 200,
            "success": { "result" : false, "message" : "Property cannot be updated." },
            "data": null,
            "error": genericEmptyError
        });

    },

    uploadPictureMongoDB: function(req, res) {
        main.mongodb.usergeo(function(collection) {
            collection.updateOne(
                {
                    uid: req.body.userId
                },{
                    $set: { 
                    }
                },{
                    multi: true,
                    upsert: true
                }
            , function(err, result) {
                res.status(200).json({
                    "status": 200,
                    "success": { "result" : true, "message" : "Request was successful" },
                    "data": result,
                    "error": err
                });
            });
        });
    },

    updateConversationMongoDB: function(req, res) {
        if (!origin || origin !== "function") return res.status(200).json({
            "status": 200,
            "success": { "result" : false, "message" : "There was an error" },
            "data": null,
            "error": err
        });
        main.mongodb.convoscol(function(collection) {
            collection.updateOne(
                {
                    id: req.body.conversationId
                },{
                    $set: {    
                        lastMessage: req.body.message,
                        updatedAt: req.body.createdAt
                    }
                },{
                    multi: true,
                }
            , function(err, result) {
                if (err) return res.status(200).json({
                    "status": 200,
                    "success": { "result" : false, "message" : "There was an error" },
                    "data": null,
                    "error": err
                });
                if (!result) return res.status(200).json({
                    "status": 200,
                    "success": { "result" : false, "message" : "User was not updated." },
                    "data": null,
                    "error": err
                });
    
                res.status(200).json({
                    "status": 200,
                    "success": { "result" : true, "message" : "User was updated" },
                    "data": req.body,
                    "error": err
                });
            });
        });
    },

    retrieveForMapMongoDB: function(req, res) {

    },
    // END MONGODB FUNCTIONS
    
    getUsers: function(req, res) {
        retrieveAll(kUsers, function(success, error, data) {
            var results = new Array();
            data.forEach(function(doc) {
                results.push(generateUserModel(doc.data()));
            });
            handleJSONResponse(200, error, success, { "users": results }, res);
        });
    },

    getUserWithId: function(req, res) {
        checkForUser(id, function(success, error, result) {
            if (result !== null) {
                var userData = generateUserModel(result);
                console.log("getUserWithId result is not null ", userData);
                var data = { "user": userData };
                handleJSONResponse(200, error, success, data, res);;
            } else {
                handleJSONResponse(200, error, success, null, res);
            }
        });     
    },

    getGroupMessages: function(req, res) {
        main.firebase.firebase_firestore_db(function(reference) {
            if (!reference) { 
                callback(genericFailure, genericError, null);
            } else {
                var ref = reference.collection(kUsers);        
                var query = ref.where('uid','==', uid);
                query.get().then(function(querySnapshot) {
                    var data = querySnapshot.docs.map(function(doc) {
                        var d = doc.data();
                        d.key = doc.id;
                        return d;
                    });
                    if (Object.keys(data).length > 0) {
                        callback(genericSuccess, null, data[0]);
                    } else {
                        callback(genericFailure, genericError, null);
                    }
                }, function(err) {
                    if (err) {
                        console.log(err);
                        callback(genericFailure, err, null);
                    }
                });
            }
        });
    },

    createUser: function(req, res) {
        var object = createEmptyUserObject(req.body.email, req.body.name, req.body.uid, req.body.type, req.body.kidsCount, req.body.maritalStatus, req.body.linkedin, req.body.facebook, req.body.instagram, req.body.ageRanges, req.body.kidsNames);
        addFor(kUsers, object, function (success, error, document) {
            updateFor(kUsers, document.id, { "key": document.id }, function (success, error, data) {
                var data = { "userId": document.id }
                handleJSONResponse(200, error, success, data, res);
            })
        });
    },

    createMatch: function(req, res) {
        async.parallel({
            addMatch: function(callback) {
                main.mongodb.actioncol(function(collection) {
                    collection.updateOne(
                        {
                            "_id": req.body.senderId
                        },{
                            $set: {
                                _id: req.body.senderId,
                                createdAt: new Date(),
                                blocked: []
                            }, 
                            $addToSet: { matches: req.body.recipientId }
                        },{
                            multi: true,
                            upsert: true
                        }
                    , function(err, result) {
                        callback(err, result);
                    });
                });
                
            },
            checkForMatch: function(callback) {
                var query = {}
                var find = {
                    _id: {
                        $eq: req.body.recipientId
                    }, 
                    matches: {
                        $in: [req.body.senderId]
                    },
                    blocked: {
                        $nin: [req.body.senderId]
                    }
                }
                main.mongodb.actioncol(function(collection) {
                    collection.find(
                        find,
                        query
                    ).toArray(function(err, docs) {
                        var data = {};
                        var finalData = new Array;
                        async.each(docs, function(doc, completion) {
                            checkForUser(doc._id, function(success, error, result) {
                                if (result !== null) {
                                    result.docId = doc._id
                                    finalData.push(generateUserModel(result));
                                    return completion();
                                } else {
                                    return completion();
                                }
                            });
                        }, function(err) {
                            if (err) {
                                callback(err, null);
                            } else {
                                if (finalData.length > 0 || finalData !== null) {
                                    data.users = finalData.filter(x => x);
                                    callback(err, data);
                                } else {
                                    data.users = [];
                                    callback(err, data);
                                }
                            }
                        });
                    });
                });
            },
        }, function(err, results) {
            if (err) return handleJSONResponse(200, err, genericFailure, results, res);
            var data = results.checkForMatch;
            handleJSONResponse(200, err, genericSuccess, data, res);
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
        checkForConversation(req.body.senderId, function(success, error, conversations) {

            if (error) return handleJSONResponse(200, error, success, conversations, res);

            var conversationArray = new Array();
            if (conversations.length > 0) {
                async.each(conversations, function(result, callback) {
                    var doc = result;
                    var trueRecipientId = doc.senderId === req.body.senderId ? doc.recipientId : doc.senderId;
                    async.parallel({
                        recipient: function(callback) {
                            checkForUser(doc.recipientId, function(success, error, result) {
                                if (result !== null) {
                                    var userData = generateUserModel(result);
                                    callback(null, userData);
                                } else {
                                    callback(null, null);
                                }
                            });
                        },
                        sender: function(callback) {
                            checkForUser(doc.senderId, function(success, error, result) {
                                if (result !== null) {
                                    var userData = generateUserModel(result);
                                    callback(null, userData);
                                } else {
                                    callback(null, null);
                                }
                            });
                        },
                        lastMessage: function(callback) {
                            if (typeof doc.lastMessageId === "undefined") {
                                console.log("Last message does not exist");
                                callback(null, generateEmptyMessageModel());
                            } else {
                                retrieve("messages", doc.lastMessageId, function(success, error, data) {
                                    var message;
                                    if (data) { 
                                        message = data;
                                        message.id = doc.lastMessageId;
                                    }
                                    var object = generateMessageModel(message, message);
                                    callback(null, object);
                                });
                            }
                        },
                        trueRecipient: function(callback) {
                            checkForUser(trueRecipientId, function(success, error, result) {
                                if (result !== null) {
                                    var userData = generateUserModel(result);
                                    callback(null, userData);
                                } else {
                                    callback(null, null);
                                }
                            });
                        }
                    }, function(err, results) {
                        doc.sender = results.sender;
                        doc.recipient = results.recipient;
                        doc.trueRecipient = results.trueRecipient;
                        doc.lastMessage = results.lastMessage;
                        conversationArray.push(doc);
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
                handleJSONResponse(200, error, success, null, res);
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

    updateConversation: function(req, res) {
        updateFor(kConversations, req.body.conversationKey, { "lastMessageId" : req.body.messageId, "updatedAt" : new Date() }, function (success, error, data) {
            handleJSONResponse(200, error, success, data, res);
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

    createMapItem: function(req, res, callback) {
        addFor(kMapItems, req.body, function (success, error, document) {
            if (error) return handleJSONResponse(200, error, success, data, res);
            var data = { "itemId": document.id }
            callback(data);
        });
    },

    addToMap: function(req, res) {
        var userGeohash = geohash.encode(req.body.latitude, req.body.longitude, 10);
        main.mongodb.mapitemcol(function(collection) {
            console.log("Adding to map");
            collection.insertOne( 
                {
                    itemId: req.body.itemId,
                    userId: req.body.userId,
                    type: req.body.type,
                    startDate: req.body.startDate,
                    name: req.body.name,
                    address: req.body.address,
                    h: userGeohash,
                    location: {
                        type: "Point", 
                        coordinates: [ parseFloat(req.body.longitude), parseFloat(req.body.latitude) ]
                    }
                }, function(err) {
                    console.log(err);
                    if (err) return handleJSONResponse(200, err, genericFailure, null, res);
                    res.status(200).json({
                        "status": 200,
                        "success": { "result" : true, "message" : "Request was successful" },
                        "data": req.body,
                        "error": null
                    });
                }
            )
        });
    },

    retrieveForMap: function(req, res) {
        var pageNo = parseInt(req.body.pageNo)
        var size = 1000
        var perPage = parseInt(req.body.perPage)
        var query = {}
        var find = {
            userId: {
                $nin: [req.body.userId]
            }, 
            location: { 
                $near: {
                    $geometry: { 
                        type: "Point",  
                        coordinates: [ parseFloat(req.body.longitude),parseFloat(req.body.latitude) ] },
                    $maxDistance: getMeters(parseFloat(req.body.maxDistance))
                }
            }
        }
        if (pageNo < 0 || pageNo === 0) {
            return handleJSONResponse(200, invalidPageFailure, genericFailure, null, res);
        }
        query.skip = size * (pageNo - 1)
        query.limit = size

        console.log(find);
        
        main.mongodb.mapitemcol(function(collection) {
            collection.find(
                find,
                query
            ).toArray(function(error, docs) {
                if (docs !== null) {
                    console.log(docs);
                    var resultsCount = docs.length;
                    var totalPages = Math.ceil(resultsCount / size);
                    var data = {
                        "currentPage": pageNo,
                        "nextPage": totalPages > pageNo ? pageNo + 1: totalPages,
                        "totalPages": totalPages,
                        "resultsCount": 0,
                        "resultsPerPage": perPage,
                    }
                    data.users = new Array;
                    var success;

                    if (resultsCount > 0) {
                        success = genericSuccess;
                        var finalData = new Array;

                        async.each(docs, function(doc, completion) {
                            checkForUser(doc.userId, function(success, error, result) {
                                if (result !== null) {

                                    //console.log("Result is not null");
                                    var obj = result;
                                    obj.docId = doc._id;

                                    if (obj.ageRangeId <= parseFloat(req.body.ageRangeId)) {
                                        var emptyImages = [obj.userProfilePicture_1_url, obj.userProfilePicture_2_url, obj.userProfilePicture_3_url, obj.userProfilePicture_4_url, obj.userProfilePicture_5_url, obj.userProfilePicture_6_url]
                                        if (emptyImages.filter(x => x).length > 0) {
                                            //console.log(obj);
                                            finalData.push(generateUserModel(obj));
                                            data.resultsCount += 1;
                                            return completion();
                                        } else {
                                            //console.log("Does not include images");
                                            return completion();
                                        }
                                    } else {
                                        //console.log("Does not include age range ID");
                                        finalData.push(generateUserModel(obj));
                                        data.resultsCount += 1;
                                        return completion();
                                    }
                                } else {
                                    return completion();
                                }
                            });
                        }, function(err) {
                            //console.log("Final data: ", finalData);
                            if (err) {
                                console.log(err);
                                return handleJSONResponse(200, err, success, data, res);
                            } else {
                                if (finalData.length > 0 || finalData !== null) {
                                    //data.resultsCount += 1;
                                    data.users = finalData.filter(x => x);
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
                } else {
                    return handleJSONResponse(200, error, success, data, res);
                }
            });
        });
    },

    saveLocation: function(req, res) {
        // main.firebase.generate_geopoint(parseFloat(req.body.latitude), parseFloat(req.body.longitude), function(geopoint) {
        //     var data = geopoint;
        //     data["addressLat"] = parseFloat(req.body.latitude);
        //     data["addressLong"] = parseFloat(req.body.longitude);
        //     data["addressState"] = req.body.addressState || "";
        //     data["addressCity"] = req.body.addressCity || "";
        //     data["addressCountry"] = req.body.addressCountry || ""; 
        //     data["addressZipCode"] = req.body.addressZipCode || "";
        //     updateFor(kUsers, req.body.userId, data, function (success, error, data) {
        //         handleJSONResponse(200, error, success, data, res);
        //     });
        // });       
    },

    deleteUser: function(req, res) {
        deleteFor(kUsers, req.body.userId, function (success, error, data) {
            handleJSONResponse(200, error, success, data, res);
        });
    },

    getNearByUsers: function(req, res) {
        main.firebase.firebase_geo(function(geo) {
            main.firebase.generate_geopoint(Number(req.body.latitude), Number(req.body.longitude), function(center) {

                // Proof of concept
                const geocollection = geo.collection(kUsers);
                console.log(center);
                var queryOne = geocollection.near({ center: center, radius: 1000 });
                queryOne.orderedBy('uid');
                queryOne.limit(10);

                // Get query (as Promise)
                queryOne.get().then(function(querySnapshot) {
                    var data = querySnapshot.docs.map(function(doc) {
                        var d = doc.data();
                        d.key = doc.id;
                        return d;
                    });
                    if (Object.keys(data).length > 0) {
                        var return_data = { "user": data[0] };
                        handleJSONResponse(200, null, genericSuccess, return_data, res);
                    } else {
                        handleJSONResponse(200, genericFailure, genericError, null, res);
                    }
                }, function(err) {
                    if (err) {
                        console.log(err);
                        callback(genericFailure, err, null);
                        handleJSONResponse(200, genericFailure, err, null, res);
                    }
                });
            });
        });
    }
}

function createEmptyUserObject(email, name, uid, type, kidsCount, maritalStatus, linkedin, facebook, instagram, ageRanges, kidsNames) {
    var data = {
        id: randomstring.generate(25),
        email: email,
        name: name,
        uid: uid,
        createdAt: new Date(),
        lastLogin: new Date(),
        type: type,
        maritalStatus: maritalStatus,
        preferredCurrency: 'USD',
        notifications : false,
        maxDistance : 25.0,
        ageRangeId: ageRanges,
        ageRangeMin: 0,
        ageRangeMax: 0,
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
        kidsCount: kidsCount,
        questionOneTitle: null,
        questionOneResponse: null,
        questionTwoTitle: null,
        questionTwoResponse: null,
        questionThreeTitle: null,
        questionThreeResponse: null,
        canSwipe: true,
        nextSwipeDate: null,
        profileCreation : false,
        socialInstagram: instagram,
        socialFacebook: facebook,
        socialLinkedIn: linkedin
    }
    if (ageRanges == 0) {
        data.ageRangeMin = 2;
        data.ageRangeMax = 4;
    }

    if (ageRanges == 1) {
        data.ageRangeMin = 4;
        data.ageRangeMax = 7;
    }

    if (ageRanges == 2) {
        data.ageRangeMin = 7;
        data.ageRangeMax = 10;
    }

    if (ageRanges == 3) {
        data.ageRangeMin = 10;
        data.ageRangeMax = 13;
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
        owner: senderId,
        participants: [senderId, recipientId],
        lastMessageId: null
    }
    return data
}

function createEmptyActionObject(uid) {
    var data = {
        id: randomstring.generate(25),
        owner: uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: [],
        matches: [],
        blocked: [],
        conversations: [],
    }
    return data
}

function checkForUser (uid, callback) {
    main.firebase.firebase_firestore_db(function(reference) {
        if (!reference) { 
            callback(genericFailure, genericError, null);
        } else {
            var ref = reference.collection(kUsers);        
            var query = ref.where('uid','==', uid);
            query.get().then(function(querySnapshot) {
                var data = querySnapshot.docs.map(function(doc) {
                    var d = doc.data();
                    d.key = doc.id;
                    return d;
                });
                if (Object.keys(data).length > 0) {
                    callback(genericSuccess, null, data[0]);
                } else {
                    callback(genericFailure, genericError, null);
                }
            }, function(err) {
                if (err) {
                    console.log(err);
                    callback(genericFailure, err, null);
                }
            });
        }
    });
}

function checkForMapItem (uid, callback) {
    main.firebase.firebase_firestore_db(function(reference) {
        if (!reference) { 
            callback(genericFailure, genericError, null);
        } else {
            var ref = reference.collection(kMapItems);        
            var query = ref.where('uid','==', uid);
            query.get().then(function(querySnapshot) {
                var data = querySnapshot.docs.map(function(doc) {
                    var d = doc.data();
                    d.key = doc.id;
                    return d;
                });
                if (Object.keys(data).length > 0) {
                    callback(genericSuccess, null, data[0]);
                } else {
                    callback(genericFailure, genericError, null);
                }
            }, function(err) {
                if (err) {
                    console.log(err);
                    callback(genericFailure, err, null);
                }
            });
        }
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

function checkForConversation (senderId, callback) {
    main.firebase.firebase_firestore_db(function(reference) {
        if (!reference) { 
            callback(genericFailure, genericError, null);
        } else {
            var conversationArray = new Array();
            async.parallel({
                findRecipientConversations: function(callback) {
                    var ref = reference.collection(kConversations);        
                    var query = ref.where('recipientId','==', senderId);
                    query.get().then(function(querySnapshot) {
                        var data = querySnapshot.docs.map(function(doc) {
                            var d = doc.data();
                            d.key = doc.id;
                            return d;
                        });
                        if (Object.keys(data).length > 0) {
                            callback(null, data);
                        } else {
                            callback(null, null);
                        }
                    });
                },
                findSenderConversations: function(callback) {
                    var ref = reference.collection(kConversations);        
                    var query = ref.where('senderId','==', senderId);
                    query.get().then(function(querySnapshot) {
                        var data = querySnapshot.docs.map(function(doc) {
                            var d = doc.data();
                            d.key = doc.id;
                            return d;
                        });
                        if (Object.keys(data).length > 0) {
                            callback(null, data);
                        } else {
                            callback(null, null);
                        }
                    });
                }
            }, function(err, results) {
                var conversationArray = new Array();

                if (results.findSenderConversations) {
                    results.findSenderConversations.forEach(function(conversation) {
                        conversationArray.push(conversation);
                    });
                }

                if (results.findRecipientConversations) {
                    results.findRecipientConversations.forEach(function(conversation) {
                        conversationArray.push(conversation);
                    });
                }

                if (conversationArray.length > 0 ) {
                    console.log(conversationArray);
                    callback(genericSuccess, null, conversationArray);
                } else {
                    callback(genericSuccess, genericError, null);
                }
            });
        }
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
        docId: doc.docId,
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
                title: "Name(s) of my kid(s)",
                info: doc.kidsNames
            }, {
                type: "kidsAges",
                title: "My kid(s) age range",
                info: doc.kidsAges
            }, {
                type: "kidsBio",
                title: "About my kid(s)",
                info: doc.kidsBio
            }, {
                type: "kidsCount",
                title: "Number of kids",
                info: doc.kidsCount
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
        profileCreation : doc.profileCreation,
        lastId: doc.lastId,
        matches: doc.matches,
    }
    if (doc.actions_results && doc.actions_results.length > 0) {
        data.actions_results = generateActionModel(doc.actions_results[0])
    }
    return data
}

function generateActionModel(doc) {
    var data = {
        _id: doc._id,
        id: doc.id,
        owner: doc.owner,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        likes: doc.likes,
        matches: doc.matches,
        blocked: doc.blocked,
        conversations: doc.conversations,
    }
    return data
}

function generateConversationModel(doc) {
    var data = { 
        _id: doc._id,
        id: doc.id,
        owner: doc.senderId,
        participants: doc.participants,
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
        createdAt: doc.createdAt || new Date()
    }
    return data
}

function generateEmptyMessageModel() {
    var data = { 
        key: "",
        id: "",
        conversationId: "",
        senderId: "",
        message: "Say hello!",
        createdAt: ""
    }
    return data
}

//  MARK:- Useful functions
function getMeters(fromMiles) {
    return fromMiles * 1609.344;
}