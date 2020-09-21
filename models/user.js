const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User_Schema = new Schema({
	name: { type: String },
	email: { type: String, required: true },
	password: { type: String, required: true },
});

module.exports = mongoose.model('User', User_Schema);
