const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    message: { type: String, required: false },
    read: {
      type: Boolean,
      default: false,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    }
    
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", messageSchema);
