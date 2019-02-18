const express       = require('express');
const main          = require('../../app');
const _             = require('underscore');

var genericError = { "errorCode": 200, "errorMessage": "Something went wrong." };
var genericEmptyError = { "errorCode" : null, "errorMessage" : null };
var genericSuccess = { "result" : true, "message" : "Request was successful" };
var genericFailure = { "result" : false, "message" : "Request was unsuccessful" };
var genericTextFailure = "Server request was not successful. Please try again later.";
var getOptions = { source: 'cache' };

var kUsers = 'users';

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
            return callback(genericFailure, genericError , null);
        } else {
            var ref = reference.collection(collection)
            parameters.forEach(function(param) {
                ref.where(param.key, param.condition, param.value);
            });
            ref.get(getOptions).then(function(snapshot) {
                return callback(genericSuccess, null, snapshot);
            }).catch(function (error) {
                error.co
                return callback(genericFailure, error, null);
            });
        }
    });
}

function retrieveFor(collection, docID, callback) {
    main.firebase.firebase_firestore_db(function(reference) {
        if (!reference) { 
            return callback(genericFailure, genericError , null);
        } else {
            reference.collection(collection).doc(docID).get(getOptions).then(function(snapshot) {
                return callback(genericSuccess, null, snapshot);
            }).catch(function (error) {
                return callback(genericFailure, error, null);
            });
        }
    });
}

function updateFor(collection, docID, data, callback) {
    main.firebase.firebase_firestore_db(function(reference) {
        if (!reference) { 
            return callback(genericFailure, genericError , null);
        } else {
            reference.collection(collection).doc(docID).set(data, { merge: true }).then(function() {
                return callback(genericSuccess, null, null);
            }).catch(function (error) {
                return callback(genericFailure, error, null);
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
            auth.signInWithEmailAndPassword(req.body.emailaddress, req.body.password)
            .then(function () {
                auth.onAuthStateChanged(function (user) {
                    if (user) {
                        retrieveWith('venue-management', user.uid, 'users', function(success, error, data) {
                            // var venue;
                            // if (data) { 
                            //     venue = data;
                            //     venue.key = id;
                            // }
                            res.redirect('../../../venuemanagement/twilio-view-venues');
                        });
                    } else {
                        loadViewSignin(200, null, genericEmptyError, res);
                    }
                });
            }).catch(function (error) {
                loadViewSignin(200, null, error, res);
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

    createUser: function(req, res) {
        var userData = {
            email: req.body.email,
            name: req.body.name,
            uid: req.body.uid,
            createdAt: new Date(),
            type: req.body.type,
            preferredCurrency: 'USD',
            notifications : false,
            maxDistance : 25.0,
            ageRange: null,
            initialSetup : false,
            userProfilePicture_1_url: null,
            userProfilePicture_1_meta: null,
            userProfilePicture_2_url: null,
            userProfilePicture_2_meta: null,
            userProfilePicture_3_url: null,
            userProfilePicture_3_meta: null,
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
            bio: null,
            jobTitle: null,
            companyName: null,
            schoolName: null,
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
        addFor(kUsers, userData, function(success, error, data) {
            handleJSONResponse(200, error, success, data, res);
        });
    },

    getUserWithId: function(id, res) {
        retrieveFor(kUsers, id, function(success, error, data){
            handleJSONResponse(200, error, success, { "user": data.data() }, res);
        });
    },

}