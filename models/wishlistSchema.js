const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    
  videoId:{ type: mongoose.Schema.Types.ObjectId, ref: 'Video'},
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
},
{ timestamps: true },
);

let wishlistModel = mongoose.model('wishlist', wishlistSchema);

module.exports=wishlistModel