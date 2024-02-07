const express = require('express')
const { createServer } = require('node:http')
const { Server } = require('socket.io')
const cors = require('cors')
const mongoose = require('mongoose');
const Message = require('./models/Message')
const APP_PORT = 4000
const session = require('express-session');
const cookieParser = require('cookie-parser');



mongoose.connect('mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.1.1', {
    useNewUrlParser: true
});


const app = express()
app.use(cookieParser());
const corsOptions = {
    origin: ['http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
};
app.use(cors(corsOptions));


function authChecker(req, res, next) {
    console.log('req.session check =>  : ', req.session.user)
    if (req.session.user) {
        next();
    } else {
        next();
    }
}

app.use(
    session({
        name: "SESS_NAME",
        secret: "SESS_SECRET",
        resave: false,
        saveUninitialized: false,
        cookie: {
            sameSite: false,
            secure: process.env.NODE_ENV === "production",
            maxAge: 100000,
            httpOnly: true,
            domain: "localhost"
        },
    })
);
app.use(authChecker);



const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: '*'

    }
})

io.on('connection', (socket) => {
    console.log('a user connected')

    socket.on('join', async (chatId) => {
        try {
            let result = await Message.findOne({ "chatId": chatId });
            if (!result) {
                await Message.insertOne({ "chatId": chatId, messages: [] });
            }
            socket.join(chatId);
            socket.emit("join", "hi")
        } catch (e) {
            console.error(e);
        }
    })


    socket.on("message", ({ chatId, message, userName }) => {
        console.log('chatId : ', chatId, message, userName)
        Message.updateOne({ "chatId": chatId }, {
            "$push": {
                "messages": { message: message, userName: userName }
            }
        });
        io.to(chatId).emit("message", { message: message, userName: userName });
    });

    socket.on("joinRoom", async ({ chatId, userName }) => {
        console.log('joinRoom ==> ', chatId, userName)
        try {
            let result = await Message.findOne({ "chatId": chatId });
            if (result) {
                Message.updateOne({ "chatId": chatId }, {
                    "$push": {
                        "userInGroup": userName
                    }
                });
                socket.join(chatId);
                io.to(chatId).emit("joinRoom", userName);
            }
        } catch (e) {
            console.error(e);
        }
    })
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


app.post('/testSecurity', (req, res) => {
    console.log('req => : ', req.headers)
    console.log('cookieName => ', req.cookies)
    res.status(200).send({ test: 'Min' })
})


app.post('/api/login', function (req, res, next) {
    const sessionUser = {
        id: "TestId",
        username: "TestUser",
        email: "testEmal",
    };
    req.session.user = sessionUser;
    req.session.save();
    res.cookie('cookieName', '1Tesssdsds2s', { expires: new Date(Date.now() + 900000), secure: false })
    res.status(200).send(sessionUser.id)
});

app.post('/api/logout', function (req, res, next) {
    req.session.destroy();
    req.session = null
    res.clearCookie('cookieName');
    res.clearCookie('SESS_NAME');
    res.status(200).send('logout')
});


server.listen(APP_PORT, () => {
    console.log(`App running on port ${APP_PORT}`)
})