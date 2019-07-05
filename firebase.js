'use strict';

var firebase            = require('firebase');
var admin               = require('firebase-admin');
var configs             = require('./configs');
var serviceAccount      = require(configs.firstoragefilename);  //  MARK:- Uncomment and provide url to service account .json file.
const {Storage}         = require('@google-cloud/storage');
const { GeoCollectionReference, GeoFirestore, GeoQuery, GeoQuerySnapshot } = require('geofirestore');

require("firebase/auth");
require("firebase/database");
require("firebase/messaging");
require("firebase/functions");
require("firebase/storage");
require("firebase/firestore");

//  MARK:- Setup Firebase App
var firebaseObj;
var firebaseAdmin;
var firbaseStorage;
var firebaseFirestoreDB; 
var firebaseRealtimeDB;
var firebaseGeo; 

var settings = { timestampsInSnapshots: true };
var firebase_configuration = {
    apiKey: process.env.FIRAPIKEY || configs.firapikey,
    authDomain: process.env.FIRDOM || configs.firauthdomain,
    databaseURL: process.env.FIRDBURL || configs.firdburl,
    projectId: process.env.FIRPROJ || configs.firprojectid,
    storageBucket: process.env.FIRSTOR || configs.firstoragebucket,
    messagingSenderId: process.env.FIRMES || configs.firmessagingsenderid,
};

function setupFirebaseApp(callback) {
    if (!firebase.apps.length) {
        firebaseObj = firebase.initializeApp(firebase_configuration);
    } else {
        firebaseObj = firebase.app();
    }
    callback();
}

function setupAdminFirebaseApp(callback) {
    firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: configs.firebaseDatabaseUrl,
        storageBucket: configs.firebaseStorageBucket
    });
    callback();
}

function setupRealtimeDB(callback) {
    firebaseRealtimeDB = firebase.database();
    callback();
}

function setupFirestoreDB(callback) {
    firebaseFirestoreDB = admin.firestore()
    firebaseFirestoreDB.settings(settings);
    callback();
}

function setupFirebaseStorage(callback) {
    firbaseStorage = new Storage({
        projectId: configs.firebaseProjectId,
        keyFilename: configs.firstoragefilename
    });
    callback();
}

function setupGeoFireClass(callback) {
    const firestore = firebase.firestore();
    firebaseGeo = new GeoFirestore(firestore);

    // Proof of concept
    // const geocollection = firebaseGeo.collection('users');
    // var query = geocollection.near({ center: new firebase.firestore.GeoPoint(33.89954421085915, -84.45787855035809), radius: 1000 });
    // query.where('createdAt', '>', 'oNztYoxoNsj44NQYeh5D');
    // query.limit(10);
    // Get query (as Promise)
    // query.get().then(function(value) {
    //     console.log(value.docs.length);
    // });

    callback();
}

function generateGeopoint(lat, long, callback) {
    const point = new admin.firestore.GeoPoint(lat, long);
    callback({
        g: geohash.encode(lat, long, 10),
        l: point
    })
}

module.exports.setup = function firebaseSetup() {
    console.log('Setting up Firebase');
    setupFirebaseApp(function() {
        console.log('Completed setting up base firebase app');
    });
    setupAdminFirebaseApp(function() {
        console.log('Completed setting up base firebase admin app');
    });
    setupRealtimeDB(function() {
        console.log('Completed setting up base realtime db');
    });
    setupFirestoreDB(function() {
        console.log('Completed setting up base firebase firestore db');
    });
    setupFirebaseStorage(function() {
        console.log('Completed setting up base firebase storage app');
    });
    setupGeoFireClass(function() {
        console.log('Completed setting up base geoFire object');
    });
};
module.exports.firebase_main = function returnFirebaseMainObject(callback) {
    callback(firebaseObj);
}
module.exports.firebase_admin = firebaseAdmin;
module.exports.firebase_firestore_db = function setupFirestore(callback) {
    callback(firebaseFirestoreDB);
}
module.exports.firebase_realtime_db = function setupRealtimeDB(callback) {
    callback(firebaseRealtimeDB);
}
module.exports.firebase_auth = function setupAuth(callback) {
    callback(firebaseObj.auth());
}
module.exports.firebase_storage = function setupStorage(callback) {
    callback(firbaseStorage.bucket(configs.firstoragebucket));
}
module.exports.firebase_geo = function setupGeoFire(callback) {
    callback(firebaseGeo);
}
module.exports.generate_geopoint = function generate_Geopoint(lat, long, callback) {
    generateGeopoint(lat, long, function(point) {
        callback(point);
    })
}
// module.exports.firebase_storage_bucket = firPrimaryStorageBucket;