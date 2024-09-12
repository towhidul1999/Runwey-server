const mongoose = require("mongoose")

const supportSchema = new mongoose.Schema({
    support: {
        type: String,
        required: true,
        trim: true,
    }
});

module.exports=mongoose.model("Support", supportSchema);