const httpStatus = require("http-status");
const response = require("../helpers/response");
const Chat = require("../models/Chat");
const Message = require("../models/Message");

const getChatByUserAndChatService = async (chatId, role) => {
  try {
    console.log("userId--------->", chatId, role);
    if (role === "admin") {
      populateUser = "userId";
    } else {
      populateUser = "adminId";
    }
    const chat = await Chat.find({adminId}).populate({
      path: `${populateUser}`,
      select: "fullName image role"
    });

    // const chats = await Chat.paginate(
    //   { ...filter }, // Use $in to check if userId is in the array
    //   options
    // );
    console.log("chats", chat);
    var data = {
      chat: {
        populateUser: {
          name: "",
          photo: [
            {
              publicFileUrl: "",
              path: "",
            },
          ],
          role: "",
        },
        status: "",
        id: "",
      },
      message: {
        message: "",
        _id: "",
        chat: "",
        sender: "",
        createdAt: "",
        updatedAt: "",
        __v: 0,
      },
    };
    if (chat) {
      const message = await Message.findOne({ chat: chatId }).sort({
        createdAt: -1,
      });
      // console.log("message", message);
      if (message) {
        data.chat = chat;
        data.message = message;
      }
    }
    return data;
  } catch (err) {
    throw new Error(httpStatus.BAD_REQUEST, err.message);
  }
};

const getChatService = async (filter, options, role) => {
  try {
    const { limit = 10, page = 1 } = options;
    const count = await Chat.countDocuments({
      ...filter, // Add any additional ...s here
    });

    var populateUser = "";

    if (role === "admin") {
      populateUser = "userId";
    } else {
      populateUser = "adminId";
    }
    const totalPages = Math.ceil(count / limit); // Calculate total pages
    const skip = (page - 1) * limit; // Calculate skip value
    const chats = await Chat.find({
      ...filter,
    })
      .populate({
        path: `${populateUser}`,
        select: "fullName image role",
      })
      .skip(skip)
      .limit(limit)
      .sort({ updatedAt: -1 });

    // const chats = await Chat.paginate(
    //   { ...filter }, // Use $in to check if userId is in the array
    //   options
    // );
    console.log("chats", chats);
    var data = [];
    if (chats.length > 0) {
      console.log("chats", chats.length);
      for (const chatItem of chats) {
        const chatId = chatItem._id;
        console.log("chatId", chatId);
        const message = await Message.findOne({ chat: chatId }).sort({
          createdAt: -1,
        });

        // console.log("message", message);
        if (message) {
          data.push({ chat: chatItem, message: message });
        } else {
          data.push({
            chat: chatItem,
            message: {
              message: "",
              _id: "",
              chat: "",
              sender: "",
              createdAt: "",
              updatedAt: "",
              __v: 0,
            },
          });
        }
      }

      // Sort data array by message.createdAt within each data entry
      data.sort((a, b) => {
        const dateA = (a.message && a.message.createdAt) || 0;
        const dateB = (b.message && b.message.createdAt) || 0;
        return dateB - dateA; // Sorting in descending order, change to dateA - dateB for ascending order
      });

      return {
        data,
        totalPages,
        currentPage: page,
        totalChats: count,
      };
    } else {
      return {
        data,
        totalPages,
        currentPage: page,
        totalChats: count,
      };
    }
  } catch (err) {
    console.log("err", err);
    throw err;
  }
};

const addChatService = async (chatBody) => {
  try {
    return await Chat.create(chatBody);
  } catch (err) {
    throw new ApiError(httpStatus.BAD_REQUEST, err.message);
  }
};

const getChatByParticipantsService = async (participants) => {
  const chat = await Chat.findOne({
    $or: [
      { userId: { $eq: participants } }, // Check if userId matches any participant
      { adminId: { $eq: participants } }, // Check if adminId matches any participant
    ],
  });
  return chat;
};

const getChat = async (req, res) => {
  console.log("req.body", req.body.userId);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const options = {
    page,
    limit,
  };
  const filter = {
    $or: [
      { userId: { $eq: req.body.userId } }, // Check if userId matches any participant
      { adminId: { $eq: req.body.userId } }, // Check if adminId matches any participant
    ]
  };
  const chatResult = await getChatService(filter, options, req.body.userRole);
  res.status(httpStatus.OK).json(response({ message: "Chats", status: "OK", statusCode: httpStatus.OK, data: chatResult }));
};

const addChat = async (req, res) => {
  const chat = await addChatService(req.body);
  res.status(httpStatus.CREATED).json(response({ message: "Chat", status: "OK", statusCode: httpStatus.CREATED, data: chat }));
};

module.exports = {
  getChat,
  getChatByUserAndChatService,
  addChat,
  addChatService,
  getChatService,
  getChatByParticipantsService,
};
