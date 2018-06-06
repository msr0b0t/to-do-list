const mongoose = require('mongoose');

const itemListSchema = new mongoose.Schema({
	userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	itemId: {type: mongoose.Schema.Types.ObjectId, ref: 'Item'}
});

module.exports = mongoose.model('ItemList', itemListSchema);
