const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter category name'],
        unique: true,
        maxLength: [50, 'Category name cannot exceed 50 characters'],
        minLength: [3, 'Category name should minimum 3 characters']
    },
    slug: {
        type: String,
        required: [true, 'Please enter category slug name'],
        lowercase: true,
        unique: true,
    },
    categoryImage: {
        type: String,
        required: [true, "Category image must be required"],
        trim: true,
    },
    categoryVideo: {
        type: String,
        required: false,
        type: String,
    }

},
    { timestamps: true },
);

module.exports = mongoose.model('Category', categorySchema);