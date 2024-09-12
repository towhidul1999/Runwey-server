const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  videoId: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
  ratings: {type: Number, required: true},
  message: {type: String, required: true},
  userId: { type: mongoose.Types.ObjectId, required: true, ref: 'User' }
},
{ timestamps: true },
);

module.exports = mongoose.model('Rating', ratingSchema);