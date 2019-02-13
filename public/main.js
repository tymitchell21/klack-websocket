const userList = document.getElementById("users");
const messagesDiv = document.getElementById("messageslist");
const textarea = document.getElementById("newmessage");
const ding = new Audio("typewriter_ding.m4a");

const socket = io.connect('http://localhost:3000')

// this will be the list of all messages displayed on the client
let messages = [{ timestamp: 0 }];

let name = window.prompt("Enter your name");
// if they didn't type anything at the prompt, make up a random name
if (name.length === 0) name = "Anon-" + Math.floor(Math.random() * 1000);

// add the sender and text of one new message to the bottom of the message list
function appendMessage(msg) {
  messages.push(msg);
  messagesDiv.innerHTML += `<div class="message"><strong>${
    msg.sender
  }</strong><br>${msg.message}</div>`;
}

function listUsers(users) {
  let userStrings = users.map(
    user =>
      user.active
        ? `<span class="active"><span class="cyan">&#9679;</span> ${
            user.name
          }</span>`
        : `<span class="inactive">&#9675; ${user.name}</span>`
  );
  userList.innerHTML = userStrings.join("<br>");
}

// true if the messages div is already scrolled down to the latest message
function scrolledToBottom() {
  return messagesDiv.scrollTop + 600 >= messagesDiv.scrollHeight;
}

// force the messages div to scroll to the latest message
function scrollMessages() {
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function fetchMessages() {
  socket.emit('messages', name)
  setTimeout(fetchMessages, 5000)
}

document.getElementById("newmessage").addEventListener("keypress", event => {
  // if the key pressed was enter (and not shift enter), post the message.
  if (event.keyCode === 13 && !event.shiftKey) {
    textarea.disabled = true;

    socket.emit('message', { 
      sender: name,
      message: textarea.value 
    })
  }
})

socket.on('message', (msg) => {
  appendMessage(msg)
  scrollMessages()

  textarea.value = ""
  textarea.disabled = false
  textarea.focus()
})

socket.on('messages', (data) => {
  const shouldScroll = scrolledToBottom()
  var shouldDing = false

  listUsers(data.users)

  for (let i = 0; i < data.messages.length; i++) {
    let msg = data.messages[i];
    if (msg.timestamp > messages[messages.length - 1].timestamp) {
      appendMessage(msg);
      shouldDing = true;
    }
  }
  if (shouldScroll && shouldDing) scrollMessages()
  if (shouldDing) ding.play()
})

// call on startup to populate the messages and start the polling loop
fetchMessages()
