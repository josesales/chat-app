const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketio(server);

//Create a path to the public director by taking __dirname(current location) and joining with public
const publicDirectoryPath = path.join(__dirname, '../public');

//Include the public directory so express we can render the index.html and etc in the browser
app.use(express.static(publicDirectoryPath));

//build in event that runs when a client gets a new connection
io.on('connection', (socket) => {

    socket.on('join', (userProps, callback) => {
        const { user, error } = addUser({ id: socket.id, ...userProps });

        if (error) {
            return callback(error);
        }

        //Bind the user to a particular room
        socket.join(user.room);

        //socket.emit: emit the event to the single referred connected client
        socket.emit('message', generateMessage('Welcome!', 'Admin'));

        ///socket.broadcast.emit: emit the event to all the clients who are connected except for this particular socket/client
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} just joined!`, 'Admin'));

        //emit users in the room event
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });

        callback();
    });

    socket.on('sendMessage', (message, callback) => {

        const filter = new Filter();
        if (filter.isProfane(message)) {
            return callback(generateMessage('Profanity is not allowed!'));
        }

        const user = getUser(socket.id);

        //io.emit: emit the event to all the sockets/clients who are connected
        io.to(user.room).emit('message', generateMessage(message, user.username));

        callback();
    });

    //build in event that runs when a particular socket/client gets a new connected
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            // we don't need to use socket.broadcast once the socket/client who already got disconnected wont receive the message anyway
            io.to(user.room).emit('message', generateMessage(`${user.username} just left!`, 'Admin'));

            //emit users in the room event
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }
    });

    socket.on('sendLocation', ({ latitude, longitude }, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('locationMessage',
            generateLocationMessage(`https://google.com/maps?q=${latitude},${longitude}`, user.username));

        callback();
    });
});

server.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});