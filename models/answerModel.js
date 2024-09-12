const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    answer: {
        type: Array,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
},
    { timestamps: true },
);

const Answer = mongoose.model('Answer', answerSchema);

module.exports = Answer;