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
    uinstagram: String,
    uregkey: String
})
Mongoose.model('preregisteredusers', PreRegUserSchema);

module.exports = Mongoose.model('preregisteredusers');