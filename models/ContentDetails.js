const mongoose = require('mongoose');

const ContentDetailsSchema = new mongoose.Schema({
  like: {
    type: Number,
    default: 0, // Default value for likes
  },
  videoId: {
    type: String
  },
});

const ContentDetails = mongoose.model('ContentDetails', ContentDetailsSchema);

module.exports = ContentDetails;
