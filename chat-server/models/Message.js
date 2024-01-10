const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    userInGroup: String,
    messages: Array,
    chatId: String
}, { timestamps: true });

const MessageModel = mongoose.model('Message', MessageSchema);
const Message = MessageModel
module.exports = Message.collection;