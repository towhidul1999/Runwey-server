const mongoose = require("mongoose")

const bannerSchema = new mongoose.Schema({
 
    bannerImage: {
        type: String,
        required:[true, "banner image must be required"],
        trim: true,
       
    },
    bannerName:{
        type: String,
        required:[true, "banner name must be required"],
        trim: true,
    }

},
{ timestamps: true }
);

const BannerModel = mongoose.model("banner", bannerSchema);
module.exports=BannerModel