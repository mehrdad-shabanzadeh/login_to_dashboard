const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LoginLog_Schema = new Schema({
	user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	loginDate: { type: Date },
});

module.exports = mongoose.model('LoginLog', LoginLog_Schema);
