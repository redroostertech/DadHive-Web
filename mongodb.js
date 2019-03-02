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
            // var db = moClient.db('dadhive-main-20193f0912h309');
            // var collection = db.collection('user-geo');
            // collection.insertMany([
            //     {a : 1}, {a : 2}, {a : 3}
            // ], function(err, result) {
            //     assert.equal(err, null);
            //     assert.equal(3, result.result.n);
            //     assert.equal(3, result.ops.length);
            //     console.log("Inserted 3 documents into the collection");
            //     console.log(result);
            // });
        } else {
            console.log("Unsuccessfully set up mongo client");
        }
    });
};

module.exports.mongodb_client = function returnMongoDBMainObject(callback) {
    callback(moClient);
}

module.exports.usergeo = function returnMongoUserGeoDB(callback) {
    var db = moClient.db('dadhive-main-20193f0912h309');
    var collection = db.collection('user-geo');
    callback(collection);
}
