var express = require('express');
var multer = require('multer')
var fs = require('fs');
var request = require('request');
var bodyParser = require('body-parser');
var upload = multer({
    dest: 'uploads/'
})
var app = express();

app.use(bodyParser.json());

var http = require('http').Server(app);
var io = require('socket.io')(http); // instantiate socketIO by passing the http server


// make css folder static so it wouldn't route
// serve all static files from "css" directory under "/css" path
app.use('/css', express.static('css'));
app.use('/assets', express.static('assets'));


app.get('/', function (req, res) {
    //   res.send('<h1>Hello world</h1>');
    res.sendFile(__dirname + '/index.html');
});
app.get('/chatroom', function (req, res) {
    //   res.send('<h1>Hello world</h1>');
    res.sendFile(__dirname + '/chatroom.html');
}); 


app.post('/upload', upload.single('file'), function (req, res, next) {

    // check file of existence
    console.log(req);
    
    const file = req.file;
    if (!file) {
        const error = new Error('Please upload a file');
        error.httpStatusCode = 400;
        return next(error);
    }

    //parse file to encoded in base64
    var img = fs.readFileSync(req.file.path);
    var encode_image = img.toString('base64');


    // send to imgur api

    var options = {
        method: 'POST',
        url: 'https://api.imgur.com/3/upload',
        headers: {
            Authorization: 'Client-ID 9e018e5ae88ba45',
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        formData: {
            image: encode_image
        }
    };

    request(options, function (error, response, body) {
        if (response.statusCode == 200) {
            const output = JSON.parse(response.body);
            console.log(output.data.link);
            res.send(output.data.link);
        } else {
            console.log(body);
        }
    });

})


// Listen on the connection event for incoming sockets and log to console
io.on('connection', function (socket) {
    //user connects
    console.log('a user connected');

    socket.on('userConnected', function(userName){
        io.emit('userConnected', userName);
    });

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
    console.log('listening on *:' + app.get('port'));
});