const mongoose = require('mongoose');

// Define the nested schema for key-value pairs
const KeyValueSchema = new mongoose.Schema({
    key: String,
    count: { type: Number, default: 0 },
    value: String
});

// Define the main schema
const LinkSchema = new mongoose.Schema({
    // Other fields...
    dynamicFields: [KeyValueSchema], // Array of key-value pairs
    videoId: { type: String, required: true },
});

// Create the User model
const Link = mongoose.model('Link', LinkSchema);

module.exports = Link;
