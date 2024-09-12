const mongoose = require('mongoose');
require('dotenv').config();

const notificationSchema = new mongoose.Schema({
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  message: { type: String, required: false },
  imageLink: { type: String, default:`/images/user.png`, required: false },
  linkId: { type: String, required: false },
  role:{ type: String, enum: ['admin', 'user', 'creator', 'unknown']},
  type: { type: String, enum: ['payment', 'video','my-subscription','unknown', 'userToCreator'], default: 'unknown' },
  viewStatus: { type: Boolean, enum: [true, false], default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }
},
{ timestamps: true },
);

module.exports = mongoose.model('Notification', notificationSchema);