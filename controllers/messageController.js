const httpStatus = require("http-status");
const response = require("../helpers/response");
const Message = require("../models/Message");
const { getChatByUserAndChatService } = require("./chatController");

const addMessageService = async (messageBody) => {
  try {
    console.log("messageBody", messageBody)
    return await Message.create(messageBody);
  }
  catch (err) {
    return err;
  }
};

const getMessagesService = async (chatId, options) => {

  try {
    const { limit = 10, page = 1 } = options; // Set default limit and page values

    const count = await Message.countDocuments({
      chat: chatId,
    });

    const totalPages = Math.ceil(count / limit); // Calculate total pages
    const skip = (page - 1) * limit; // Calculate skip value

    var messages = {
      "_id": "",
      "chat": "",
      "message": "",
      "sender": {
        "_id": "",
        "fullName": "",
        "image": {
          "publicFileUrl": "",
          "path": ""
        }
      },
      "createdAt": "",
      "updatedAt": "",
      "__v": 0
    }

    messages = await Message.find({
      chat: chatId,
    })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('sender', 'fullName image');

    const result = {
      data: messages,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      totalResults: count
    };
    return result;
  } catch (err) {
    throw new Error(httpStatus.BAD_REQUEST, err.message);
  }
};


const addMessage = async (req, res) => {
  try {
    const { chat, message, sender } = req.body;
    const newMessage = {
      chat,
      message,
      sender,
    }
    const messageSent = await addMessageService(newMessage);
    if (messageSent) {
      const roomId = "new-message::" + req.body.chat;
      // console.log(message, roomId, "message", req.body.chat);
      io.emit(roomId, messageSent);
      const chatForReceiver = await getChatByUserAndChatService(
        req.body.receiver,
        req.body.chat,
        req.body.user
      );
      const chatForSender = await getChatByUserAndChatService(
        req.body.sender,
        req.body.chat
      );

      //console.log("chats", chats.length);
      const updatedChatRoomForSender = "updated-chat::" + req.body.sender;
      const updatedChatRoomForReceiver = "updated-chat::" + req.body.receiver;
      io.emit(updatedChatRoomForSender, chatForSender);
      io.emit(updatedChatRoomForReceiver, chatForReceiver);

      return res
        .status(httpStatus.CREATED)
        .json(
          response({
            message: "message added successfully",
            status: "OK",
            statusCode: httpStatus.CREATED,
            data: messageSent,
          })
        );
    } else {
      throw new Error(httpStatus.BAD_REQUEST, "Something went wrong");
    }
  }
  catch (err) {
    console.log("err", err);
    return res.status(httpStatus.BAD_REQUEST).json(response({ message: err.message, status: "Error", statusCode: httpStatus.BAD_REQUEST, data: {} }));
  }
}

const getMessages = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const options = {
    page,
    limit,
  };
  const result = await getMessagesService(req.params.chatId, options);
  return res
    .status(httpStatus.OK)
    .json(
      response({
        message: "Messages",
        status: "OK",
        statusCode: httpStatus.OK,
        data: result,
      })
    );
}

module.exports = {
  addMessage,
  getMessages,
  addMessageService
};
