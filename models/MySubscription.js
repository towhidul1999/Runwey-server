const mongoose = require("mongoose");

const mySubSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscribe",
      required: false
    },
    expiryDate: {
      type: Date,
      required: false
    },
    subscriptionType: {
      type: String,
      enum: ["Regular", "Standard", "Premium"], default: "Regular",
      required: false
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MySubscription", mySubSchema);
