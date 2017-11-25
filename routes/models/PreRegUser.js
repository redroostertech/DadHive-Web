const Mongoose = require('mongoose');

//  MARK:- Create the user model here.
var PreRegUserSchema = new Mongoose.Schema({
    uname: String,
    uemail: String,
    umar_status: String,
    uchildren: Number,
    updatedAt: Date,
    createdAt: Date,
    ulinkedin: String,
    ufacebook: String,
    uinstagram: String
})
Mongoose.model('PreRegisteredUsers', PreRegUserSchema);

module.exports = Mongoose.model('PreRegisteredUsers');