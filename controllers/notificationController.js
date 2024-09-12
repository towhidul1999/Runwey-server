const httpStatus = require("http-status");
const response = require("../helpers/response");
const Notification = require("../models/Notification");
const User = require("../models/User");

const getNotifications = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit; // Calculate skip value

    const user = await User.findById(req.body.userId);

    let filter = {};
    if (user.role === "admin") {
      filter = { role: "admin" };
    } else {
      filter = { role: "user", receiverId: req.body.userId };
    }

    const notifications = await Notification.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalResults = await Notification.countDocuments(filter);
    const totalPages = Math.ceil(totalResults / limit);

    await Notification.updateMany(
      { role: "admin", viewStatus: false },
      { viewStatus: true }
    );

    return res.status(200).json(
      response({
        status: "Okay",
        statusCode: 200,
        type: "notification",
        data: {
          notifications,
          pagination: {
            page,
            limit,
            totalPages,
            totalResults,
          }
        }
      }));
  } catch (error) {
    console.error("Error in getNotifications:", error);
    return res.status(500).json(
      response({ status: "Error", statusCode: 500, tyoe: "notification", message: error.message }));
  }
};

const viewStatusCount = async (req, res) => {
  try {
    const notViewed = await Notification.countDocuments({
      role: "admin",
      viewStatus: false,
    });
    return res.status(200).json(
      response({
        status: "Okay",
        statusCode: 200,
        type: "notification",
        data: {
          notViewed,
        }
      }));
  }
  catch (error) {
    console.error("Error in viewStatusCount:", error);
    return res.status(500).json(
      response({ status: "Error", statusCode: 500, tyoe: "notification", message: error.message }));
  }
}


module.exports = {
  getNotifications,
  viewStatusCount
};
