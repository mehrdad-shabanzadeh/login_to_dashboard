const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const usersRouter = require('./users');

const User = require('../models/user');
const LoginLog = require('../models/loginLog');

router.use('/users', checkSession, usersRouter);

router.get('/', (req, res) => {
	let tasks = ['Wash your hands with water and soap', 'Do not touch your face with your hand', 'Always wear mask whenever going out', 'Be careful its very dangerous'];
	res.render('pages/index', { title: 'Welcome', tasks });
});

//==================================================================
// USER LOGIN

// Send login page
router.get('/login', isLogin, (req, res, next) => {
	res.render('pages/login', { title: 'Login' });
});

// Request for login
router.post('/login', (req, res, next) => {

	let { email, password } = req.body;
	let errors = [];
	// Check for empty fields
	if (!email || !password) {
		errors.push({msg: 'Empty fields are not allowed'})
	}
	if (errors.length > 0) {
		return res.render('pages/login', {errors})
	} else {
		// Find user
		User.findOne({ email }, (err, user) => {
			if (err) {
				next(err);
			}
			if (!user) {
				req.flash('errors', 'Incorrect email or password.');
				return res.redirect('/login');
			} else {
				// Compare passwords
				bcrypt
					.compare(password, user.password)
					.then((result) => {
						if (result) {
							// Assign the user info to its session
							req.session.user = user;

							// Save login log
							new LoginLog({
								user: req.session.user._id,
								loginDate: new Date().toISOString(),
							}).save();

							req.flash('success_msg', 'Welcome, you logged in successfully.');
							return res.redirect('/users/dashboard');
						} else {
							req.flash('error_msg', 'Incorrect email or password.');
							return res.redirect('/login');
						}
					})
					.catch((err) => {
						next(err);
					});
			}
		});
	}
});

// ==============================================================
// USER SIGN-UP

// Send signup page
router.get('/signup', isLogin, (req, res) => {
	res.render('pages/signup', { title: 'Signup' });
});

// Signup process
router.post('/signup', (req, res, next) => {

	let { name, email, password, password2 } = req.body;
	let errors = [];

	// Check for empty fields
	if (!name || !email || !password || !password2) {
		errors.push({msg: 'Empty fields are not allowed'});
		return res.render('pages/signup', { title: 'Signup', errors, name, email })
	}

	// Check for restrictions
	// Name
	if (name.length < 3 || name.length > 30) {
		errors.push({msg: 'Name must be between 3 and 30 characters.'});
	}
	// Email
	const emailValidator = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	if (!emailValidator.test(email)) {
		errors.push({msg: 'Invalid Email.'});
	}
	// Password
	if (password.length < 6 || password.length > 30) {
		errors.push({msg: 'Password must be between 6 and 30 characters.'});
	}
	// Passwords Match
	if (password !== password2) {
		errors.push({msg: 'Passwords do not match.'});
	}
	// Check for any errors
	if (errors.length > 0) {
		return res.render('pages/signup', { errors, name, email });
	} else {
	// Check if the username or mobile number is already exists or not
		User.findOne({ email }, (err, user) => {
			if (err) {
				next(err);
			} else if (user) {
				errors.push({ msg: 'Email already exists' });
				return res.render('pages/signup', { errors, name, email });
			} else {
				bcrypt
					.hash(password, 10)
					.then((hash) => {
						// Saving new user process
						const newUser = new User({
							name,
							email,
							password: hash,
						});

						newUser.save((err, user) => {
							if (err) {
								next(err);
							} else {
								req.flash('success_msg', 'Your account is created and can log in');
								return res.redirect('/login');
							}
						});
					})
					.catch((err) => {
						next(err);
					});
			}
		});
	}
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
