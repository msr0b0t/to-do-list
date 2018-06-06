const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

const Item = require('./models/item');
const User = require('./models/user');
const ItemList = require('./models/item-list');
mongoose.Promise = require('bluebird');

const err = error => console.error(error);
mongoose.connect('mongodb://admin:123123a@ds247670.mlab.com:47670/to-do-list-db');
const app = express();

app.set('view engine', 'pug');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
	secret: 'Napo+Mary',
	resave: true,
	saveUninitialized: false,
	store: new MongoStore({mongooseConnection: mongoose.connection})
}));
app.get('/favicon.ico', (req, res) => res.status(204));

function requiresLogin(req, res, next) {
	if (req.session && req.session.userId) {
		return next();
	}
	const err = new Error('You must be logged in to view this page.');
	err.status = 401;
	return next(err);
}

app.get('/', (req, res) => res.render('home'));
app.post('/', (req, res) => res.render('/signin'));

app.get('/signup', (req, res) => res.render('signup'));
app.post('/signup', (req, res) => {
	const q = {
		$or: [
			{username: req.body.username},
			{email: req.body.email}
		]
	};
	User.findOne(q).lean().exec().then(user => {
		if (user !== null) {
			return res.send('Please give another username');
		}
		User.create(req.body).then(user => {
			req.session.userId = user._id;
			res.redirect('/' + user.username);
		});
	}).catch(err);
});

app.get('/signin', (req, res) => res.render('signin'));
app.post('/signin', (req, res) => {
	User.authenticate(req.body.email, req.body.password, (err, user) => {
		if (err) {
			err(err);
		}
		req.session.userId = user._id;
		res.redirect('/' + user.username);
	});
});

app.get('/logout', (req, res, next) => {
	if (req.session) {
		req.session.destroy(err => {
			if (err) {
				return next(err);
			}
			return res.redirect('/');
		});
	}
});

app.get('/:user', requiresLogin, (req, res) => {
	User.findOne({username: req.params.user}).then(user => {
		if (user !== null) {
			ItemList.find({userId: user._id}).populate('itemId').then(items => {
				const serializedItems = [];
				for (const i of items) {
					serializedItems.push(i.itemId.name);
				}
				res.render('index', {title: `${req.params.user}'s List`, message: `${req.params.user}'s List`, user: req.params.user, itemslist: serializedItems});
			}).catch(err);
		}
	});
});

app.post('/:user', requiresLogin, (req, res) => {
	Item.findOne({name: req.body.item}).then(item => {
		if (item === null) {
			Item.create({name: req.body.item}).then(item => {
				User.findOne({username: req.params.user}).then(user => {
					if (user !== null) {
						ItemList.create({itemId: item._id, userId: user._id}).then(() => {
							return res.redirect(`/${req.params.user}`);
						});
					}
				});
			});
		} else {
			User.findOne({username: req.params.user}).then(user => {
				if (user !== null) {
					ItemList.create({itemId: item._id, userId: user._id}).then(() => {
						return res.redirect(`/${req.params.user}`);
					});
				}
			});
		}
		res.redirect(`/${req.params.user}`);
	}).catch(err);
});

app.post('/:user/delete', requiresLogin, (req, res) => {
	User.findOne({username: req.params.user}).then(user => {
		if (user !== null) {
			Item.findOne({name: req.body.delItem}).then(item => {
				if (item !== null) {
					ItemList.findOneAndDelete({userId: user._id, itemId: item._id}).then(() => {
						return res.redirect(`/${req.params.user}`);
					});
				}
			});
		}
		res.redirect(`/${req.params.user}`);
	}).catch(err);
});

const server = app.listen(process.env.PORT, () => {
	const {port} = server.address();

	console.log('Example app listening at http://localhost:%s', port);
});
