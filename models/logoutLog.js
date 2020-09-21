const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LogoutLog_Schema = new Schema({
	user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	logoutDate: { type: Date },
});

module.exports = mongoose.model('LogoutLog', LogoutLog_Schema);
