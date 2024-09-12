const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    paymentData: { type: Object },
    userId: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
},
    { timestamps: true },

);

module.exports = mongoose.model('Payment', paymentSchema);