require('dotenv').config();
global.config = require('./config');

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const logger = require('morgan');
const mongoose = require('mongoose');
const expressLayouts = require('express-ejs-layouts');
const flash = require('connect-flash');

const apiRouter = require('./routes/api');

const app = express();

// ====================================================
// Connect mongodb
mongoose
	.connect(config.mongodb, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log('Mongodb is connected...'))
	.catch((err) => console.log(err));

// =====================================================
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('view engine', 'ejs');

// =====================================================
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(cookieParser());

app.use(
	session({
		key: 'user_sid',
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
	})
);

// =====================================================
// If no session provided clear cookie
app.use((req, res, next) => {
	if (req.cookies.user_sid && !req.session.user) {
		res.clearCookie('user_sid');
	}
	next();
});

// =====================================================
// routes
app.use('/', apiRouter);

// =====================================================
// catch 404 and forward to error handler
app.use((req, res, next) => {
	next(createError(404));
});

// =====================================================
// error handler
app.use((err, req, res, next) => {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('pages/error');
});

module.exports = app;
