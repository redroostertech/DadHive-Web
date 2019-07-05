'use strict';

const MongoClient       = require('mongodb').MongoClient;
const assert            = require('assert');
const configs           = require('./configs');

//  MARK:- Setup MongoDB App
var moClient;
var db;

function setupMongoClient(callback) {
    MongoClient.connect(configs.mongoUrl, { useNewUrlParser: true }, function(err, client) {
        if (!err) {
            moClient = client
            callback(true)
        } else {
            console.log(err);
            callback(false);
        }
    })
}

module.exports.setup = function setup() {
    console.log('Setting up MongoDB');
    setupMongoClient(function(success) {
        if (success) {
            console.log("Successfully set up mongo client");
        } else {
            console.log("Unsuccessfully set up mongo client");
        }
    });
};

module.exports.mongodb_client = function returnMongoDBMainObject(callback) {
    callback(moClient);
}

module.exports.usergeo = function returnMongoUserGeoDB(callback) {
    var db = moClient.db(configs.mongoid);
    var collection = db.collection('user-geo');
    callback(collection);
}

module.exports.actioncol = function returnMongoUserGeoDB(callback) {
    var db = moClient.db(configs.mongoid);
    var collection = db.collection('action');
    callback(collection);
}

module.exports.mapitemcol = function returnMongoMapItemGeoDB(callback) {
    var db = moClient.db(configs.mongoid);
    var collection = db.collection('map-items');
    callback(collection);
}

module.exports.convoscol = function returnMongoUserGeoDB(callback) {
    var db = moClient.db(configs.mongoid);
    var collection = db.collection('conversations');
    callback(collection);
}