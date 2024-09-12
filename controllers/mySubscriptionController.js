const response = require("../helpers/response");
const MySubscription = require("../models/MySubscription");

const getMySubscription = async (req, res) => {
  try {
    const mySubscription = await MySubscription.findOne({ userId: req.body.userId }).populate("subscriptionId");
    return res.status(200).json(
      response({
        status: "Okay",
        statusCode: 200,
        type: "my-subscription",
        data: mySubscription
      }));
  }
  catch (error) {
    console.error("Error in getMySubscription:", error);
    return res.status(500).json(
      response({ status: "Error", statusCode: 500, type: "my-subscription", message: error.message }));
  }
}


module.exports = {
  getMySubscription
};
