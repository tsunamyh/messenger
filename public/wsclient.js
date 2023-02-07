const HOST = location.href.replace(/^https/, 'ws');  //'ws://localhost:8080/chat'

const ws = new WebSocket(HOST);

ws.onopen = function () {
    setTiltle('connected');
    clickSavedmessage()
    // Get the element with id="Savedmessage" in "chatTabs" and click on it
};

ws.onclose = function () {
    setTiltle('disconnected');
};

ws.onmessage = function ({ data }) {

    const reader = new FileReader();
    reader.readAsText(data);

    reader.onload = () => {
        
        let parsedBlobData = JSON.parse(reader.result)
        switch (parsedBlobData.messageStatus) {
            case "onlineUser":
                console.log("caseOnlineUser|>", parsedBlobData.messageStatus);
                let existTitle = document.getElementById(parsedBlobData.id)
                if (!existTitle) {
                    createChatTitleAndChatContent(parsedBlobData)
                }
                break;
            case "message":
                console.log("casemessage|>", parsedBlobData.messageStatus);
                createRecievedEl(parsedBlobData);
                break;
            case "DBmessage":
                console.log("DBmessage|>", parsedBlobData.messageStatus);
                if (parsedBlobData.isSender) {
                    parsedBlobData.recieverId = parsedBlobData.senderId
                    createSentEl(parsedBlobData)
                } else {
                    createRecievedEl(parsedBlobData);
                }
                break;
            default:
                break;
        }

    };

};

document.forms["message"].onsubmit = function () {

    var inputElement = document.getElementById("usermsg");

    const activeChatTitle = document.querySelector('button.active'); //or 'button.chatTitle.active'

    const recieveridMessage = { recieverId: activeChatTitle.id, message: inputElement.value };
    createSentEl(recieveridMessage);
    recieveridMessage.messageStatus = "message"
    ws.send(JSON.stringify(recieveridMessage));
    inputElement.value = "";

};

function setTiltle(title) {
    document.querySelector('h4').innerHTML = title;
};

function createSentEl({ recieverId, message }) {
    //recieveridMessage = { recieverId: activeChatTitle.id, message: inputElement.value }
    const pMessage = document.createElement('p');
    pMessage.setAttribute("class", "sentMessage");
    pMessage.innerText = message;
    printMessage(pMessage, recieverId);
};

function createRecievedEl({ senderId, message }) {
    //recieveridMessage = { recieverId: activeChatTitle.id, message: inputElement.value }
    const pMessage = document.createElement('p');
    pMessage.setAttribute("class", "recievedMessage");
    pMessage.innerText = message;
    printMessage(pMessage, senderId);
};

function printMessage(pMessage, id) {

    const chatContent = document.querySelector("div" + "[" + "id='" + id + "']")
    chatContent.appendChild(pMessage);

    scrollToBottom(chatContent);
};

function createChatTitleAndChatContent(parsedBlobData) {

    // console.log("parsedBlobData|>", parsedBlobData);
    const button = document.createElement("button");
    button.setAttribute("class", "chatTitle");
    button.setAttribute("onclick", "openChat(event,'" + parsedBlobData.id + "')");
    button.setAttribute("id", parsedBlobData.id);
    button.setAttribute("name", parsedBlobData.username);
    button.innerText = parsedBlobData.username;
    // button.onclick = openChat()
    document.querySelector("div.chatTabs").appendChild(button);

    const div = document.createElement("div");
    div.setAttribute("class", "chatContent");
    div.setAttribute("id", parsedBlobData.id);
    div.setAttribute("name", parsedBlobData.username);
    div.setAttribute("style", "display: none");

    document.querySelector("div.chatContents").appendChild(div);
    const divFormal = document.createElement("div");
    divFormal.setAttribute("class", "formal");
    // console.log("div" + "[" + "id='" + parsedBlobData.id + "']");
    const chatContent = document.querySelector("div" + "[" + "id='" + parsedBlobData.id + "']")
    // console.log("chatContent|>", chatContent);
    chatContent.appendChild(divFormal);

};

const scrollToBottom = (el) => {
    // const p = document.getElementById(id);
    el.scrollTop = el.scrollHeight;
};

function openChat(evt, id) {
    // Declare all variables
    let i, chatContent, chatTitle, chatContent1;
    // Get all elements with class="chatContent" and hide them
    chatContent = document.getElementsByClassName("chatContent");
    for (i = 0; i < chatContent.length; i++) {
        if (chatContent[i].id != id) {
            chatContent[i].style.display = "none";//Hide all tabs,
        } else {
            chatContent[i].style.display = "flex";//Show the current tab,
            console.log("chatContent[i].childElementCount == 1", chatContent[i].childElementCount == 1);
            if (chatContent[i].childElementCount == 1) {
                ws.send(JSON.stringify({ chatContentWithId: id, messageStatus: "DBmessage" })) //give database message
            };
        }
    }

    // Get all elements with class="chatTitle" and remove the class "active"
    chatTitle = document.getElementsByClassName("chatTitle");
    for (i = 0; i < chatTitle.length; i++) {
        chatTitle[i].className = chatTitle[i].className.replace(" active", "");
    }

    evt.currentTarget.className += " active";
};

function clickSavedmessage() {
    const chatTabs = document.getElementsByClassName("chatTabs");
    // console.log("chatTabs|>", chatTabs[0]);
    chatTabs[0].querySelector("button#Savedmessage").click();
}