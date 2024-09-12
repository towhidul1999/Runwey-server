const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportTo: mongoose.Schema.Types.ObjectId,
  reporter: mongoose.Schema.Types.ObjectId,
  reportMessage: { type: String, enum: ['Something else', 'Fake', 'Disrespectful & hateful'] },
  reportType: { type: String },
},
{ timestamps: true },
);

module.exports = mongoose.model('Report', reportSchema);