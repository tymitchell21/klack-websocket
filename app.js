const express = require("express")
const querystring = require("querystring")
const mongoose = require("mongoose")
const port = process.env.PORT || 3000
const app = express()
const server = app.listen(port, () => {
  console.log('Server is running')
})
const socket = require("socket.io")
const io = socket(server);

app.use(express.static("./public"))
app.use(express.json())

mongoose.connect('mongodb://tymitchellw:wallflower21@ds221115.mlab.com:21115/klack', { useNewUrlParser: true })

const db = mongoose.connection

// List of all messages
let messages = []

// Track last active times for each sender
let users = {}

db.on("error", console.error.bind(console.error, "connection error:"))

db.once("open", () => {
  messageData.find()
        .then(function(messageDocs) {
          messages = Object.keys(messageDocs).map(x => {
            users[messageDocs[x].sender] = messageDocs[x].timestamp
            return {
              sender: messageDocs[x].sender,
              message: messageDocs[x].message,
              timestamp: messageDocs[x].timestamp
            }
          })
        })
})

io.on('connection', (socket) => {
  console.log('made socket connection', socket.id)

  socket.on('message', (msg) => {

    const timestamp = Date.now()
    msg.timestamp = timestamp

    const newMessage = new messageData(msg)
    newMessage.save()

    messages.push(msg);

    // update the posting user's last access timestamp (so we know they are active)
    users[msg.sender] = timestamp;

    // Send back the successful response.
    io.sockets.emit('message', msg)
  })

  socket.on('heartbeat', (name) => {
    const now = Date.now();

    const requireActiveSince = now - 15 * 1000;

    usersSimple = Object.keys(users).map(x => ({
      name: x,
      active: users[x] > requireActiveSince
    }));

    usersSimple.sort(userSortFn)
    usersSimple.filter(a => a.name !== name)

    users[name] = now

    io.sockets.emit('messages',{ messages: messages.slice(-40), users: usersSimple })
  })
})

const Schema = mongoose.Schema

const messageSchema = new Schema({
    sender: {type: String, require: true},
    message: String,
    timestamp: Number
})

const userSchema = new Schema({
    user: String,
    timestamp: Number
})

const messageData = mongoose.model('messageData', messageSchema)
const userData = mongoose.model('userData', userSchema)

// generic comparison function for case-insensitive alphabetic sorting on the name field
function userSortFn(a, b) {
  var nameA = a.name.toUpperCase(); // ignore upper and lowercase
  var nameB = b.name.toUpperCase(); // ignore upper and lowercase
  if (nameA < nameB) {
    return -1
  }
  if (nameA > nameB) {
    return 1
  }

  // names must be equal
  return 0
}


