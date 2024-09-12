const mongoose = require("mongoose")

const subscribeSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        trim: true
    },
    validity: {
        type: Number,
        required: true,
        trim: true
    },
    limitation: {
        type: Number,
        required: true,
        trim: true
    },
    mainColor: {
        type: String,
        required: true,
        trim: true
    },
    opacity1: {
        type: String,
        required: false,
        trim: true
    },
    opacity2: {
        type: String,
        required: false,
        trim: true
    },
    opacity3: {
        type: String,
        required: false,
        trim: true
    },
    type: {
        type: String,
        enum: ['Regular', 'Standard', 'Premium'],
        required: false
    },
    disable: {
        type: Boolean,
        default: false,
    }
});

const Subscribe = mongoose.model("Subscribe", subscribeSchema);
module.exports = Subscribe