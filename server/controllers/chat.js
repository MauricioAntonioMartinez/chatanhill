const User = require("../model/User");
const Chat = require("../model/Chat");
const socket = require("../socket").socket;
//const io = require("../socket").io;
const { validationResult } = require("express-validator");
const errorHandling = require("../util/errors");
const moment = require("moment");

exports.getChats = async (req, res, next) => {
  const userId = req.userId;

  try {
    const user = await User.findOne({ _id: userId });
    const chats = await Chat.find({ _id: { $in: user.chats } }).populate(
      "users",
      "profilePicture username"
    );

    if (!chats) return next(errorHandling("CHAT NOT FOUND", 404));

    chats.forEach(async (chat) => {
      console.log(chat._id.toString());
      await socket().join(chat._id.toString());
    });

    res.status(200).json({
      chats,
    });
  } catch (e) {
    if (!e.statusCode) e.statusCode = 500;
    next(e);
  }
};

exports.getChat = async (req, res, next) => {
  const chatId = req.body.chatId;

  try {
    const chat = await Chat.findById(chatId).populate("users");
    if (!chat) return next(errorHandling("CHAT NOT FOUND", 404));

    res.status(200).json({
      chatId: chat._id,
      messages: chat.messages,
      users: chat.users,
    });
  } catch (e) {
    if (!e.statusCode) e.statusCode = 500;
    next(e);
  }
};

// -h Authorization Token  body:{ chatId , message}
exports.sendMessage = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) return next(errorHandling("ERROR IN VALIDATION", 422));

  const chatId = req.body.chatId;
  const userId = req.userId;
  const message = req.body.message;
  try {
    const chat = await Chat.findById(chatId);

    if (!chat) return next(errorHandling("CHAT NOT FOUND", 404));

    const chatMessage = {
      text: message,
      date: moment().format("h:mm a"),
      globalDate: Date.now(),
      author: userId,
      status: "SENT",
    };

    chat.messages.push(chatMessage);

    //await chat.save();

    socket().to(chatId).emit("MESSAGES", {
      action: "MESSAGE_RECEIVED",
      message: chatMessage,
      userId,
      chatId,
    });

    res.status(200).json({
      date: moment().format("h:mm a"),
    });
  } catch (e) {
    if (!e.statusCode) e.statusCode = 500;
    next(e);
  }
};

exports.createChat = async (req, res, next) => {
  const participants = req.body.friends; // ['mcuve','chuchito','pepe123'] // including the own user username

  try {
    const users = await User.find({ username: { $in: participants } }).select(
      "_id"
    );
    const chat = new Chat({
      users,
      messages: [],
    });
    const chatCreated = await chat.save();

    users.map(async (user) => {
      const userFetched = await User.findById(user);
      userFetched.chats.push(chatCreated._id);
      await userFetched.save();
    });

    //  io().to(chatCreated._id.toString()).emit();// Emit the chat created to all users in it
    res.status(201).json({
      message: "CHAT CREATED",
      chatCreated,
    });
  } catch (e) {
    if (!e.statusCode) e.statusCode = 500;
    next(e);
  }
};
