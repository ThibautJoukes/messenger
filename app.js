var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http); // instantiate socketIO by passing the http server


// make css folder static so it wouldn't route
// serve all static files from "css" directory under "/css" path
app.use('/css', express.static('css'));
app.use('/assets', express.static('assets'));


app.get('/', function (req, res) {
    //   res.send('<h1>Hello world</h1>');
    res.sendFile(__dirname + '/login.html');
});
app.get('/chatroom', function (req, res) {
    //   res.send('<h1>Hello world</h1>');
    res.sendFile(__dirname + '/chatroom.html');
});


// Listen on the connection event for incoming sockets and log to console
io.on('connection', function (socket) {
    //user connects
    console.log('a user connected');
    // emit that new user has been connected
    io.emit('userConnected', "User joined!");

    // chat message received
    socket.on('chat message', function (msg) {
        // console.log('message: ' + msg);
        io.emit('chat message', msg);
    });

    // user disconnects chat
    socket.on('disconnect', function () {
        console.log('user disconnected');
        io.emit('disconnect', "User disconnected!");
    });
});


//listening on port 3000
app.set('port', process.env.PORT || 80);
http.listen(app.get('port'), function () {
    console.log('listening on *:'+ app.get('port'));
});