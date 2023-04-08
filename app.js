const { WebSocketServer } = require("ws");
const WebSocket = require("ws");
require("dotenv").config();
const { server, sessionParser } = require("./server");
const mongoConnect = require("./services/mongo");
const { findUserById, getAllUsers } = require("./routes/users/2userModel");
const { saveMessage, getAllMessages } = require("./routes/messages/2messageModel");

const MONGO_URI = process.env.MONGO_URI

const wss = new WebSocketServer({ noServer: true, path: '/chat', clientTracking: false });

const clients = new Set()

server.on("upgrade", function (req, socket, head) {
  // var pathname = require('url').parse(req.url).pathname;
  sessionParser(req, {}, async function () {

    if (!req.session?.passport) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    const id = req.session.passport.user
    let wsUsername={}
    if (id!="12000") {

      try {
        wsUsername = await findUserById(id);
        console.log("wsUser|>", wsUsername);
      } catch (error) {
        console.log("error findUserById in uograde listener");
        socket.destroy(error);
        return
      }
    }else{
      wsUsername.username = "admin"
    }

    wss.handleUpgrade(req, socket, head, async function (ws) {
      //Attach user to ws
      Object.assign(ws, {
        user: {
          username: wsUsername.username || "admin",
          // username: "admin",
          id
        }
      })

      try {
        let DbUsers = await getAllUsers();
        // console.log("DbUsers|>", DbUsers);
        DbUsers.forEach(function (DbUser) {
          if (DbUser._id != id) {
            let newDbUser = {
              id: DbUser._id,
              username: DbUser.username,
              messageStatus: "signedInUser",
            }
            ws.send(JSON.stringify(newDbUser), { binary: true });
          }
        })
      } catch (error) {
        console.log("can not find user in mongodb",error.message);
      }

      const wsUser = {
        ...ws.user,
        messageStatus: "signedInUser",
      }
      clients.forEach(function iamonline(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          //Sends online users: {username: ?, id: ?, messageStatus: "onlineUser"}
          client.send(JSON.stringify(wsUser), { binary: true })
        }
      })

      clients.add(ws);
      wss.emit('connection', ws, req, ws.user.username);
    });
  });
});

wss.on("connection", function connection(ws, req, username) {
  console.log(clients.size);
  ws.on("message", async function message(message) {
    // message Example = {"recieverId":"client.user.id"or"Savedmessage","message":"salam khoobi?"}
    const parsedRecievedMessage = JSON.parse(message.toString())
    console.log("parsedRecievedMessage|>", parsedRecievedMessage);
    switch (parsedRecievedMessage.messageStatus) {
      case "message":
        if (parsedRecievedMessage.recieverId != "Savedmessage") {
          //Create object to save in database
          let clientUsername = await findUserById(parsedRecievedMessage.recieverId)
          // console.log("clientUsername", clientUsername, parsedRecievedMessage.recieverId);
          Object.assign(parsedRecievedMessage, {
            senderId: ws.user.id,
            senderUsername: ws.user.username,
            recieverUsername: (clientUsername.username),//client.user.username,
          })
          await saveMessage(parsedRecievedMessage)
          //Create object for send to client
          let senderMessage = {
            senderId: ws.user.id,
            // senderUsername: ws.user.username,
            message: parsedRecievedMessage.message,
            messageStatus: "message"
          }
          clients.forEach(async function (client) {
            // console.log("client.username|>",client.user.username);
            //Find reciever with Id
            if (parsedRecievedMessage.recieverId == client.user.id && client.readyState === WebSocket.OPEN && ws != client) {

              //Send to the client
              client.send(JSON.stringify(senderMessage), { binary: true });
              return
            };
          });
        } else {
          //if recieverId == Savedmessage means that the message should only be stored in the database
          Object.assign(parsedRecievedMessage, {
            senderId: ws.user.id,
            senderUsername: ws.user.username,
            recieverId: "Savedmessage",
            recieverUsername: ws.user.username,
          })
          await saveMessage(parsedRecievedMessage)
        }
        break;
      case "DBmessage":
        let senderRecieverId = {
          senderId: ws.user.id,
          recieverId: parsedRecievedMessage.chatContentWithId,
        }
        try {
          let allMessages = await getAllMessages(senderRecieverId)
          // console.log("allMessages|>", allMessages);
          allMessages.messages.forEach(function (msg) {

            let DBmessage = {
              //The message should be printed in the "class: chatContent" with this ID
              senderId: parsedRecievedMessage.chatContentWithId,
              message: msg.message,
              //False recieved message
              //True sent message
              isSender: msg.senderId == ws.user.id,//true or false
              messageStatus: "DBmessage"
            }
            ws.send(JSON.stringify(DBmessage), { binary: true })

          })
        } catch (error) {
        }
        break;

      default:
        break;
    }
  })

  ws.on("close", function close() {
    clients.delete(ws)
  })

})

async function start() {
  const port = process.env.PORT || 8080
  server.listen(port, () => {
    console.log(`server is listening on port ${port}`);
  });
}

start();

module.exports = {
  clients
}
