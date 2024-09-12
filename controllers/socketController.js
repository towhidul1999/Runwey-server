const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const ContentDetails = require('../models/ContentDetails');
const htmlFile = 'D:/Backend/RunWay-Server/views/socket.html';
const { addChatService, getChatByParticipantsService, getChatByUserAndChatService } = require("../controllers/chatController");
const LikedList = require("../models/likedList");
const Video = require("../models/Content");
// const Message = require("../models/Message");
const { ObjectId } = mongoose.Types;

const app = require('../app');
const server = createServer(app);
// const io = new Server(server);

const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

const { addChat } = require('../controllers/chatController');
const { addMessageService } = require('./messageController');
const User = require('../models/User');
const Message = require('../models/Message');

// Connect to the MongoDB database
mongoose.connect('mongodb://127.0.0.1:27017/runwey', {
  useNewUrlParser: true,
  useUnifiedTopology: true, // Set to true for the unified topology
});

app.get('/', (req, res) => {
  res.sendFile(htmlFile);
});

const socketIO = (io) => {
  io.on('connection', async (socket) => {
    console.log('a user connected');
  
    // Load previous chat messages
    const previousMessages = await ContentDetails.find().sort({ _id: -1 }).limit(10); // Adjust the limit as needed
    socket.emit('load_previous_messages', previousMessages);
  
    socket.on('message', async (msg, cb) => {
      console.log('message: ' + msg);
  
      try {
        if (msg && typeof msg === 'object' && 'like' in msg && 'videoId' in msg) {
          // Save the content details to the database
          const savedContent = await ContentDetails.create({
            like: parseInt(msg.like),
            videoId: msg.videoId,
          });
  
          // Retrieve and log the total likes for the videoId
          const totalLikes = await ContentDetails.find({ videoId: msg.videoId }).sort({ _id: -1 }).limit(1);
          // io.emit('message', totalLikes);
          cb({ totalLikes });
          console.log(totalLikes);
        } else {
          throw new Error('Invalid message format');
        }
      } catch (error) {
        console.error('Error:', error);
        io.emit('error', 'Error processing the message');
      }
    });
  
    socket.on("join-room", (data, callback) => {
      //console.log('someone wants to join--->', data);
      if (data?.roomId) {
        socket.join("room" + data.roomId);
        callback("Join room successful");
      } else {
        callback("Must provide a valid user id");
      }
    });
  
    socket.on("add-new-chat", async (data, callback) => {
      try {
        var chat;
        const existingChat = await getChatByParticipantsService(
          data.userId
        );
        if (existingChat) {
          callback({
            status: "Success",
            chatId: existingChat._id,
            message: "Chat already exists",
          });
          return;
        }
        const admin = await User.findOne({ role: "admin" });
        if (!admin) {
          callback({
            status: "Error",
            message: "Admin not found",
          });
          return;
        }
        if (admin._id.toString() === data.userId) {
          callback({
            status: "Error",
            message: "Chat can not be created with yourself",
          });
          return;
        }
        const chatInfo = {
          userId: data.userId,
          adminId: admin._id,
        }
        chat = await addChatService(chatInfo);
        callback({
          status: "Success",
          chatId: chat._id,
          message: "Chat created successfully",
        });
      } catch (error) {
        console.error("Error adding new chat:", error.message);
        //logger.error("Error adding new chat:", error.message);
        callback({ status: "Error", message: error.message });
      }
    });
  
  
    const countUnreadMessages = async (chatId, receiverId) => {
      try {
        // Convert to ObjectId using Mongoose.Types.ObjectId
        const chatObjectId = ObjectId(chatId);
        const receiverObjectId = ObjectId(receiverId);
    
        // Count documents where the chatId matches, the sender is not the receiver, and the message is not read
        const unreadMessagesCount = await Message.countDocuments({
          chat: chatObjectId,
          sender: { $ne: receiverObjectId },
          read: false
        });
    
        console.log("Unread messages count:", unreadMessagesCount);
        return unreadMessagesCount;
      } catch (error) {
        console.error("Error counting unread messages:", error.message);
        return 0;
      }
    };
  
    socket.on("add-new-message", async (data, callback) => {
      try {
        var message = await addMessageService(data);
        console.log("message", "User Connected to add new message")
        if (message) {
          const roomId = "new-message::" + data?.chat;
          console.log("sjdghhajhfkls---------------------->>>>>>>", data)
          const sentMessage = await Message.populate(message, { path: 'sender', select: 'fullName image' });
  
          // Set read to true when emitting the message
          sentMessage.read = false;
  
          console.log("reseviderid",data.receiverId)
          console.log("reseviver cout", countUnreadMessages(data.chatId,data.receiverId))
          const unreadCount = await countUnreadMessages(data.chatId, data.receiverId);
  
          // Add the userId to the readers array
          const userId = data?.userId; // Adjust this based on your data structure
   
          if (userId && !sentMessage.readers.includes(userId)) {
            sentMessage.readers.push(userId);
          }
  
          // here i want to
          
          const countId = "unread-total::"+data.receiverId;
          console.log("countId----------->", countId)
          // Save the updated message back to the database
  
          
          await message.save();
  
          io.emit(roomId, sentMessage);
  
          
          io.emit(countId, {unreadCount});
          // io.emit(countId, {unreadMessagesCount});
          // io.emit('unreadMessagesCount', {unreadMessagesCount});
  
          if (data?.receiver === "admin") {
            const page = 1
            const limit = 10
            const skip = (page - 1) * limit
            totalResults = await Message.countDocuments({ chat: data?.chat });
            totalPage = Math.ceil(totalResults / limit);
            const messageForAdmin = await Message.find({ chat: data?.chat }).populate('sender', 'fullName image').sort({ createdAt: -1 }).limit(10).skip(skip);
  
  
  
  
            io.emit("admin-message::" + data?.chat, {
              data: messageForAdmin,
              page,
              limit,
              totalResults,
              totalPage
            });
            // const chatForReceiver = await getChatByUserAndChatService(
            //   data?.chat,
            //   data?.receiver
            // );
            // console.log("chatForReceiver----------->", chatForReceiver);
            // const updatedChatRoomForReceiver = "updated-chat::" + chatForReceiver?.chat?.adminId?._id.toString();
            // io.emit(updatedChatRoomForReceiver, chatForReceiver);
          }
  
          callback({
            status: "Success",
            message: sentMessage
          });
  
          return;
        } else {
          return callback({
            status: "Error",
            message: "Something went wrong",
          });
        }
      } catch (error) {
        console.error("Error adding new message:", error.message);
        callback({ status: "Error", message: error.message });
      }
    });
  
    socket.on("leave-room", (data) => {
      if (data?.roomId) {
        socket.leave("room" + data.roomId);
      }
    });
  
    socket.on("view-status", async (data, callback) => {
      //console.log('someone wants to join--->', data);
      try {
        if (data?.videoId) {
          const video = await Video.findById(data.videoId);
          if (video) {
            video.popularity = video.popularity + 1;
            await video.save();
            callback({ status: true, message: "Video view added successfully" });
            return;
          }
          else {
            callback({ status: false, message: "Video not found" });
            return;
          }
        } else {
          callback({ status: false, message: "Must provide a video id" });
        }
      }
      catch (err) {
        callback({ status: false, message: err.message });
      }
    });
  
    socket.on("like-status", async (data, callback) => {
      console.log('someone wants to join--->', data);
      try {
        if (data?.userId && data?.videoId) {
          const likedList = await LikedList.findOne({
            userId: data.userId,
            videoId: data.videoId,
          });
          const content = await Video.findById(data.videoId);
          if (!content) {
            callback({ status: false, message: "Video not found" });
            return;
          }
          if (likedList) {
            content.likes = content.likes - 1;
            await content.save();
            await LikedList.findByIdAndDelete(likedList._id);
            callback({ status: true, message: "Like removed successfully" });
            return;
          }
          else {
            content.likes = content.likes + 1;
            await content.save();
            await LikedList.create({ userId: data.userId, videoId: data.videoId });
            callback({ status: true, message: "Video liked successfully" });
            return;
          }
        } else {
          callback({ status: false, message: "Must provide userId and videoId" });
        }
      }
      catch (err) {
        callback({ status: false, message: err.message });
      }
    });
  
  
    // const calculateTotalUnreadMessages = async (userId) => {
    //   try {
    //     // Find all messages sent to the user that are not marked as read
    //     const unreadMessagesCount = await Message.countDocuments({
    //       sender: { $ne: userId },
    //       read: false
    //     });
  
    //     console.log('Total unread messages:', unreadMessagesCount);
    
    //     return unreadMessagesCount;
        
    //   } catch (error) {
    //     console.error('Error calculating total unread messages:', error.message);
    //     return 0;
    //   }
    // };
  
    socket.on("read", async (data) => {
      console.log("data", data);
  
      // Update all messages in the specified chat to mark them as read
      try {
        await Message.updateMany(
          { chat: data.chat_id, sender: { $ne: data.user_id } },
          { $set: { read: true } }
        );
  
        // Calculate total unread messages for the user
        const totalUnreadMessages = await calculateTotalUnreadMessages(data.user_id);
  
        // Create a dynamic event name based on the user ID
        const totalGetId = "total_unread_message_count::" + data.user_id;
  
        // Emitting to the sender with the dynamic event name
        socket.emit(totalGetId, { totalUnreadMessages });
      } catch (error) {
        console.error("Error updating messages:", error);
      }
    });
  
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
}

module.exports = socketIO;