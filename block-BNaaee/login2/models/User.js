var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    name: String,
    email: { type: String, required: true},
    username: { type: String, required: true},
    photo: String
},{ timestamps: true });

module.exports = mongoose.model('User', userSchema);