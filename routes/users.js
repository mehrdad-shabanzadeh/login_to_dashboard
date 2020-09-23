const express = require('express');
const router = express.Router();
const User = require('../models/user');
const LogoutLog = require('../models/logoutLog');
const bcrypt = require('bcrypt');

// Get dashboard
router.get('/dashboard', (req, res) => {
	res.render('pages/dashboard', { title: 'Dashboard' });
});

// =============================================================
// Edit profile

// Send edit profile page
router.get('/editProfile', (req, res) => {
	res.render('pages/editProfile', { title: 'Edit Profile' });
});

// Edit profile process
router.post('/editProfile', (req, res, next) => {
	User.findByIdAndUpdate(req.session.user._id, { $set: req.body }, { new: true }, (err, user) => {
		if (err) next(err);

		req.session.user = user;
		req.flash('success_msg', 'User profile updated successfully.');
		// return res.render('pages/dashboard', { title: 'Dashboard', user });
		return res.redirect('/users/dashboard')
	});
});

// Send change password page
router.get('/changePassword', (req, res) => {
	res.render('pages/changePassword', { title: 'Change Password' });
});

// Change password process
router.post('/changePassword', (req, res, next) => {
	let { currentPassword, newPassword, newPassword2 } = req.body;
	let errors = [];
	if (!currentPassword || !newPassword || !newPassword2) {
		errors.push({msg: 'Empty fields not allowed'});
		return res.render('pages/changePassword', {title: 'Change Password', errors});
	}
	User.findById(req.session.user._id, (err, user) => {
		bcrypt
			.compare(currentPassword, user.password)
			.then((result) => {
				if (!result) {
					errors.push({msg: 'Incorrect password.'});
					return res.render('pages/changePassword', {title: 'Change Password', errors});
				} else {
					if (newPassword.length < 6 || newPassword.length > 30) {
						errors.push({msg: 'Password length must be between 6 and 30 characters.'});
					}
					if (newPassword !== newPassword2) {
						errors.push({msg: 'Passwords do not match.'});
					}

					// Check for error
					if (errors.length > 0) {
						return res.render('pages/changePassword', {title: 'Change Password', errors});
					} else {
						bcrypt
						.hash(newPassword, 10)
						.then((hash) => {
							User.findByIdAndUpdate(req.session.user._id, { $set: { password: hash } }, (err, user) => {
								if (err) {
									next(err);
								} else {
									res.session = null;
									res.clearCookie('user_sid');
									req.flash('success_msg', 'Password updated successfully. Please login again.');
									return res.redirect('/login');
								}
							});
						})
						.catch((err) => next(err));
					}
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
	res.clearCookie('user_sid');

	req.flash('success_msg', 'You are logged out');
	return res.redirect('/');
});

module.exports = router;
