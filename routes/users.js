const express = require('express');
const router = express.Router();
const User = require('../models/user');
const LogoutLog = require('../models/logoutLog');
const bcrypt = require('bcrypt');
const axios = require('axios');

// Get dashboard
router.get('/dashboard', (req, res) => {
	let taskList = ['Wash your hands with water and soap', 'Do not touch your face with your hand', 'Always wear mask whenever going out'];
	return res.render('pages/dashboard', {
		title: 'Dashboard',
		user: req.session.user,
		tasks: taskList,
		errors: req.flash('errors'),
		message: req.flash('message'),
	});
});

// =============================================================
// Edit profile

// Send edit profile page
router.get('/editProfile', (req, res) => {
	return res.render('pages/editProfile', {
		title: 'Edit Profile',
		user: req.session.user,
		errors: req.flash('errors'),
		message: req.flash('message'),
	});
});

// Edit profile process
router.post('/editProfile', (req, res) => {
	User.findByIdAndUpdate(req.session.user._id, { $set: req.body }, { new: true }, (err, user) => {
		if (err) return res.send(err);

		req.session.user = user;
		req.flash('message', 'User profile updated successfully.');
		return res.redirect('/users/dashboard');
	});
});

// Send change password page
router.get('/changePassword', (req, res) => {
	return res.render('pages/changePassword', {
		title: 'Change Password',
		user: req.session.user,
		errors: req.flash('errors'),
		message: req.flash('message'),
	});
});

// Change password process
router.post('/changePassword', (req, res) => {
	if (!req.body.currentPassword || !req.body.newPassword || !req.body.newPassword2) {
		req.flash('errors', 'Empty fields not allowed');
		return res.redirect('/changePassword');
		// return res.send('Empty fields not allowed.');
	}

	if (req.body.newPassword !== req.body.newPassword2) {
		req.flash('errors', 'Passwords do not match.');
		return res.redirect('/changePassword');
		// return res.send('Passwords do not match');
	}

	User.findById(req.session.user._id, (err, user) => {
		bcrypt
			.compare(req.body.currentPassword, user.password)
			.then(() => {
				bcrypt
					.hash(req.body.newPassword, 10)
					.then((hash) => {
						User.findByIdAndUpdate(req.session.user._id, { $set: { password: hash } }, (err, user) => {
							if (err) {
								return res.status(500).send('Something went wrong!');
							} else {
								// Remove session
								req.session = null;
								res.clearCookie('user_sid');
								req.flash('message', 'Password updated successfully.');
								return res.redirect('/login');
							}
						});
					})
					.catch((err) => res.send(err));
			})
			.catch((err) => res.send(err));
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
