const express = require('express')
const { createServer } = require('node:http')
const { Server } = require('socket.io')
const cors = require('cors')
const mongoose = require('mongoose');
const Message = require('./models/Message')
const APP_PORT = 4000


mongoose.connect('mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.1.1', {
    useNewUrlParser: true
});


const app = express()
app.use(cors({
    origin: 'http://localhost:3000'
}))

const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000'

    }
})

io.on('connection', (socket) => {
    console.log('a user connected')
    socket.emit("join", "hi")

    socket.on('join', async (chatId) => {
        try {
            let result = await Message.findOne({ "chatId": chatId });
            if (!result) {
                await Message.insertOne({ "chatId": chatId, messages: [] });
            }
            socket.join(chatId);
        } catch (e) {
            console.error(e);
        }
    })


    socket.on("message", ({ chatId, message }) => {
        console.log('chatId : ', chatId, message)
        Message.updateOne({ "chatId": chatId }, {
            "$push": {
                "messages": message
            }
        });
        io.to(chatId).emit("message", message);
    });
})

app.get('/chat/:chatId', async (req, res) => {
    const { chatId } = req.params
    try {
        let result = await Message.findOne({ "chatId": chatId });
        res.send(result);
    } catch (e) {
        res.status(500).send({ message: e.message });
    }
})


server.listen(APP_PORT, () => {
    console.log(`App running on port ${APP_PORT}`)
})