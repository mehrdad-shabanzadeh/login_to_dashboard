const express = require('express');
const router = express.Router();
const User = require('../models/user');
const LogoutLog = require('../models/logoutLog');
const bcrypt = require('bcrypt');

// Get dashboard
router.get('/dashboard', (req, res) => {
	let taskList = ['Wash your hands with water and soap', 'Do not touch your face with your hand', 'Always wear mask whenever going out', 'Be careful its very dangerous'];
	return res.render('pages/dashboard', { title: 'Dashboard', tasks: taskList });
});

// =============================================================
// Edit profile

// Send edit profile page
router.get('/editProfile', (req, res) => {
	return res.render('pages/editProfile', { title: 'Edit Profile' });
});

// Edit profile process
router.post('/editProfile', (req, res, next) => {
	User.findByIdAndUpdate(req.session.user._id, { $set: req.body }, { new: true }, (err, user) => {
		if (err) next(err);

		req.session.user = user;
		req.flash('message', 'User profile updated successfully.');
		return res.redirect('/users/dashboard');
	});
});

// Send change password page
router.get('/changePassword', (req, res) => {
	return res.render('pages/changePassword', { title: 'Change Password' });
});

// Change password process
router.post('/changePassword', (req, res) => {
	if (!req.body.currentPassword || !req.body.newPassword || !req.body.newPassword2) {
		req.flash('errors', 'Empty fields not allowed');
		return res.redirect('/users/changePassword');
	}
	User.findById(req.session.user._id, (err, user) => {
		bcrypt
			.compare(req.body.currentPassword, user.password)
			.then((result) => {
				if (!result) {
					req.flash('errors', 'Incorrect password.');
					return res.redirect('/users/changePassword');
				} else {
					if (req.body.newPassword.length < 8 || req.body.newPassword.length > 30) {
						req.flash('errors', 'Password length must be between 8 and 30 characters.');
					}
					if (req.body.newPassword !== req.body.newPassword2) {
						req.flash('errors', 'Passwords do not match.');
					}

					// Check for error
					if (res.locals.errors) {
						return res.redirect('/users/changePassword');
					}

					bcrypt
						.hash(req.body.newPassword, 10)
						.then((hash) => {
							User.findByIdAndUpdate(req.session.user._id, { $set: { password: hash } }, (err, user) => {
								if (err) {
									next(err);
								} else {
									// Remove session
									req.session = null;
									res.clearCookie('user_sid');
									req.flash('message', 'Password updated successfully. Please login again.');
									return res.redirect('/login');
								}
							});
						})
						.catch((err) => next(err));
				}
			})
			.catch((err) => next(err));
	});
});

// =============================================================
// Logout process
router.get('/logout', (req, res) => {
	// Save logout log
	new LogoutLog({
		user: req.session.user._id,
		logoutDate: new Date().toISOString(),
	}).save();

	// Remove session
	req.session = null;
	res.clearCookie('user_sid');

	return res.redirect('/');
});

module.exports = router;
