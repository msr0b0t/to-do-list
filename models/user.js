const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
	email: {type: String, unique: true, required: true, trim: true},
	username: {type: String, unique: true, required: true, trim: true},
	password: {type: String, required: true}
});

UserSchema.pre('save', function (next) {
	const user = this;
	bcrypt.hash(user.password, 10, (err, hash) => {
		if (err) {
			return next(err);
		}
		user.password = hash;
		next();
	});
});

const User = mongoose.model('User', UserSchema);

UserSchema.statics.authenticate = function (email, password, callback) {
	User.findOne({email}).exec((err, user) => {
		if (err) {
			return callback(err);
		}
		if (!user) {
			const err = new Error('User not found.');
			err.status = 401;
			return callback(err);
		}
		bcrypt.compare(password, user.password, (err, result) => {
			if (result === true) {
				return callback(null, user);
			}
			return callback();
		});
	});
};

module.exports = User;
