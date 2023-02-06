const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema({
  messages: [{
    message: String,
    senderId: String,
    date: {
      type: Date,
      default: Date.now,
    },
    _id: false,
  }],
  users: {
    ids: [String],
    usernames: [String],
  },
  date: {
    type: Date,
    default: Date.now,
  },
})

const Message = mongoose.model("Message", messageSchema)

module.exports = Message