const Mongoose = require('mongoose');

//  MARK:- Create the user model here.
var UserSchema = new Mongoose.Schema({
    uname: String,
    upwd: String,
    uemail: String,
    umar_status: String,
    uchildren: Number,
    updatedAt: Date,
    createdAt: Date,
    uphotoUrl: String,
    ulinkedin: String,
    ufacebook: String,
    uinstagram: String,
    upostscount: Number,
    ufollowcount: Number,
    ufollwerscount: Number,
    ufavoritescount: Number,
    ulastlogin: Date
})
Mongoose.model('RegisteredUsers', UserSchema);

module.exports = Mongoose.model('RegisteredUsers');