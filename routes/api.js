const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const usersRouter = require('./users');

const User = require('../models/user');
const LoginLog = require('../models/loginLog');

router.use('/users', checkSession, usersRouter);

router.get('/', (req, res) => {
	return res.redirect('/login');
});

//==================================================================
// USER LOGIN

// Send login page
router.get('/login', isLogin, (req, res) => {
	res.render('pages/login', {
		title: 'Login',
		user: req.session.user,
		errors: req.flash('errors'),
		message: req.flash('message'),
	});
});

// Request for login
router.post('/login', (req, res) => {
	// Check for empty fields
	if (!req.body.email || !req.body.password) {
		req.flash('errors', 'Empty fields not allowed');
		return res.redirect('/login');
		// return res.status(500).send('Empty fields not allowed');
	}
	// Find user
	User.findOne({ email: req.body.email }, (err, user) => {
		if (err) {
			return res.status(500).send('Something went wrong!');
		}
		if (!user) {
			req.flash('errors', 'Incorrect email or password.');
			return res.redirect('/login');
			// return res.status(500).send('Incorrect email or password.');
		} else {
			// Compare passwords
			bcrypt
				.compare(req.body.password, user.password)
				.then((result) => {
					if (result) {
						// Assign the user info to its session
						req.session.user = user;

						// Save login log
						new LoginLog({
							user: req.session.user._id,
							loginDate: new Date().toISOString(),
						}).save();

						// req.flash('message', 'You logged in successfully.');
						// Sending the logged in user to his dashboard page
						return res.redirect('/users/dashboard');
					} else {
						req.flash('errors', 'Incorrect email or password.');
						return res.redirect('/login');
						// return res.status(500).send('Incorrect email or password.');
					}
				})
				.catch((err) => {
					return res.status(500).send('Something went wrong!');
				});
		}
	});
});

// ==============================================================
// USER SIGN-UP

// Send signup page
router.get('/signup', isLogin, (req, res) => {
	res.render('pages/signup.ejs', {
		title: 'Signup',
		user: req.session.user,
		errors: req.flash('errors'),
		message: req.flash('message'),
	});
});

// Signup process
router.post('/signup', (req, res) => {
	// Check for empty fields
	if (!req.body.name || !req.body.email || !req.body.password || !req.body.password2) {
		req.flash('errors', 'Empty fields not allowed');
		return res.redirect('/signup');
		// return res.status(500).send('Empty fields not allowed');
	}

	// Check for restrictions
	// Name
	if (req.body.name.length < 3 || req.body.name.length > 30) {
		req.flash('errors', 'First name length must be between 3 and 30 characters.');
		return res.redirect('/signup');
		// return res.status(500).send('First name length must be between 3 and 30 characters.');
	}
	// Email
	const emailValidator = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	if (!emailValidator.test(req.body.email)) {
		req.flash('errors', 'Invalid Email.');
		return res.redirect('/signup');
		// return res.status(500).send('Invalid Email.');
	}
	// Password
	if (req.body.password.length < 8 || req.body.password.length > 30) {
		req.flash('errors', 'Password length must be between 8 and 30 characters.');
		return res.redirect('/signup');
		// return res.status(500).send('Password length must be between 8 and 30 characters.');
	}
	// Passwords Match
	if (req.body.password !== req.body.password2) {
		req.flash('errors', 'Passwords do not match.');
		return res.redirect('/signup');
		// return res.status(500).send('Passwords do not match.');
	}

	// Check if the username or mobile number is already exists or not
	User.findOne({ email: req.body.email }, (err, user) => {
		if (err) {
			return res.status(500).send('Some internal problem happened. Please try again.');
		} else if (user) {
			req.flash('errors', 'This email is already registered. Please try another one.');
			return res.redirect('/signup');
			// return res.status(500).send('This email is already registered. Please try another one.');
		} else {
			bcrypt
				.hash(req.body.password, 10)
				.then((hash) => {
					// Saving new user process
					const newUser = new User({
						name: req.body.name,
						email: req.body.email,
						password: hash,
					});

					newUser.save((err, user) => {
						if (err) {
							return res.status(500).send('Some internal problem happened. Please try again.');
						} else {
							req.flash('message', 'New user created successfully.');
							return res.redirect('/login');
						}
					});
				})
				.catch((err) => {
					return res.status(500).send('Something went wrong!');
				});
		}
	});
});

module.exports = router;

// =================================================
// Functions

// Check if a user has session or not
function checkSession(req, res, next) {
	if (!req.session.user) return res.redirect('/login');
	next();
}

// check if the user making the request is login or not
function isLogin(req, res, next) {
	if (req.session.user) return res.redirect('/users/dashboard');
	next();
}