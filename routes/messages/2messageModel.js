const Message = require("./1messageSchma")

async function saveMessage(data) {
  console.log("saveMessagedata|>", data);//{recieverId: 'Savedmessage',recieverUsername:"J..",message: 'sal...',senderId: '63...',senderUsername:"H.."}

  const messageQuery = await Message.findOne({
    "users.ids": {
      $all: [data["senderId"], data["recieverId"]]
    }
  })

  // console.log("messageQuery|>", messageQuery);

  if (messageQuery === null) {
    // console.log("messageQuery === null|>",messageQuery === null);
    const firstMessageQuery = new Message({
      messages: [{
        message: data["message"],
        senderId: data["senderId"]
      }],
      users: {
        ids: [data["senderId"], data["recieverId"]],
        usernames: [data["senderUsername"], data["recieverUsername"]],
      },
    })

    await firstMessageQuery.save();
    // console.log("firstMessageQuery|>", firstMessageQuery);
  } else {
    // messageQuery.messages.push({ message: data["message"] });
    // await messageQuery.save();
    //OR
    await Message.updateOne({
      "users.ids": {
        $all: [data["senderId"], data["recieverId"]]
      }
    }, {
      $push: {
        messages: {
          message: data["message"],
          senderId: data["senderId"]
        },
      }
    })

  }

}

async function getAllMessages(data) {

  return await Message.findOne({
    "users.ids": {
      $all: [data["senderId"], data["recieverId"]]
    }
  }, { messages:1 ,_id:0})
}

module.exports = {
  saveMessage,
  getAllMessages,
}