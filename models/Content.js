const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxLength: [100, 'Title must be at most 100 characters long'],
  },
  videoData: {
    type: Buffer,
    // required: [true, 'Video data is required'],
  },
  contentType: {
    type: String,
    required: [true, 'Content type is required'],
  },
  size: { type: String, required: [true, 'Size is required'] },
  countryName: { type: String, required: [true, 'Country name is required'] },
  fabric: { type: String, required: [true, 'Fabric is required'] },
  material: { type: String, required: [true, 'Material is required'] },
  care: { type: String, required: [true, 'Care instructions are required'] },
  occassionCategory: { type: String, required: [true, 'Category is required'] },
  gender: { type: String, required: [true, 'Gender is required'] },
  description: { type: String, required: [true, 'Description is required'] },
  video: { type: String },
  videoPath: { type: String, required: [true, 'Path is required'] },
  popularity: { type: Number, default: 0 },
  userId: { type: mongoose.Types.ObjectId, required: [true, 'User ID is required'], ref: 'User' },
  duration: { type: Number, required: false },
  tiktok: { type: String, required: false },
  instragram: { type: String, required: false },
  thumbnail: { type: String, required: false },
  thumbnailPath: { type: String, required: false },
  likes: { type: Number, default: 0, required: false },
  ratings: { type: Number, default: 0, required: false }

}, { timestamps: true });

module.exports = mongoose.model('Video', videoSchema);
