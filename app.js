const express = require("express")
const querystring = require("querystring")
const mongoose = require("mongoose")
const port = process.env.PORT || 3000
const app = express()

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
  

  app.listen(port, () => {
    console.log('Server is running')
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

app.use(express.static("./public"))
app.use(express.json())

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

app.get("/", (request, response) => {
  response.send('hello')
})

app.get("/messages", (request, response) => {
  // get the current time
  const now = Date.now();

  // consider users active if they have connected (GET or POST) in last 15 seconds
  const requireActiveSince = now - 15 * 1000;

  // create a new list of users with a flag indicating whether they have been active recently
  usersSimple = Object.keys(users).map(x => ({
    name: x,
    active: users[x] > requireActiveSince
  }));

  // sort the list of users alphabetically by name
  usersSimple.sort(userSortFn);
  usersSimple.filter(a => a.name !== request.query.for);

  // update the requesting user's last access time
  users[request.query.for] = now;

  // send the latest 40 messages and the full user list, annotated with active flags
  response.send({ messages: messages.slice(-40), users: usersSimple });
})

app.post("/messages", (request, response) => {
  const timestamp = Date.now()
  request.body.timestamp = timestamp

  const newMessage = new messageData(request.body)
  newMessage.save()

  messages.push(request.body);

  // update the posting user's last access timestamp (so we know they are active)
  users[request.body.sender] = timestamp;

  // Send back the successful response.
  response.status(201)
  response.send(request.body)
})


