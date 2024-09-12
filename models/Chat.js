const mongoose = require("mongoose");

const chatSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    readers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Chat", chatSchema);
