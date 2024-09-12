const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    loginActivity: { type: String, required: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    device: { type: String, required: false },
    browser: { type: String, required: false },
    ip: { type: String, required: false } 
},
{ timestamps: true },
);

module.exports = mongoose.model('Activities', activitySchema);