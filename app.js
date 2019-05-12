var express = require('express');
var multer = require('multer')
var fs = require('fs');
var request = require('request');
var bodyParser = require('body-parser');
var upload = multer({
    dest: 'uploads/',
    fileFilter: function (req, file, cb) {
        if (file.mimetype !== 'image/png' && file.mimetype !== 'image/PNG' && file.mimetype !== 'image/jpg' && file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/gif') {
            req.fileValidationError = 'goes wrong on the mimetype';
            return cb(null, false, new Error('goes wrong on the mimetype'));
        }
        cb(null, true);
    }
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

// ROUTE when image is being uploaded.
app.post('/upload', upload.single('file'), function (req, res, next) {

    // check file of existence
    console.log(req);

    const file = req.file;
    if (!file || req.fileValidationError) {
        const error = new Error('Please upload an image file.');
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

    socket.on('userConnected', function (userName) {
        io.emit('userConnected', userName);
    });

    // when new users joins, every existing user send their profile to everyone
    socket.on('userBroadcast', function (userName) {
        io.emit('userBroadcast', userName);
    });

    // chat message received
    socket.on('chat message', function (msg) {
        // console.log('message: ' + msg);
        io.emit('chat message', msg);
    });

    // user disconnects chat (not used)
    socket.on('disconnect', function () {
        console.log('user disconnected');
        // not needed, window event already emits user profile to 'disconnect' channel in html
        // io.emit('disconnect', "");        
    });

    socket.on('user_leave', function (user) {
        console.log('user disconnected');
        io.emit('user_leave', user);        
    });

});


//listening on port 3000
app.set('port', process.env.PORT || 80);
http.listen(app.get('port'), function () {
    console.log('listening on *:' + app.get('port'));
});