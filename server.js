var express = require('express');
var app = express();
var port = 3000;
router = express.Router();
app.use('/', router);


//Adding main.js, passing 'app' as instance of express
require('./router/main')(app);
//Defines where files are placed so server can locate/render
app.set('views',__dirname+'/views');
//sets view engine responsibility to EJS (html rendering)
app.set('view engine', 'ejs');
//tells server we are rendering with EJS
app.engine('html', require('ejs').renderFile);
app.use(express.static(__dirname+'/views'));


var jf = require('jsonfile');
var post_string ='';
var pre_string='';

var io = require('socket.io').listen(app.listen(port));

io.sockets.on('connection', function (socket) {
    socket.emit('greeting', 'welcome to socket.io');
    socket.on('setting title', function (data) {
        io.sockets.emit('new message', data);
        var title = String(data);
        title = title.replace(/\s+/g, '_');
        console.log("server received client-sent message \n" +
            "Title set: " + title + ".json");

        // sends data to all users, or socket.broadcast.emit();
    });

    // Save to client-specified file name
    socket.on('sendGraph', function (data) {
        console.log("Serialized JSON sent");
        var title = String(data.title);
        title = title.replace(/\s+/g, '_');
        pre_string = 'json/' + title +'_non-string.json';
        jf.writeFile(pre_string, data.mGraph, function (err) {
            if (err != null)
                console.log(err);
            else
                socket.emit('successful_save', 'Serialized Graph Object local save successful!');
        });
    });
    socket.on('sendGraphJson', function (data)  {
        console.log("Stringified (Final) JSON sent");
        var title = String(data.title);
        title = title.replace(/\s+/g, '_');
        post_string = 'json/' + title + '.json';
        jf.writeFile(post_string, data.mGraph, function(err) {
            if (err != null)
                console.log(err);
            else
                socket.emit('successful_save', 'Stringified Graph local save successful!');
        });
    });

    // Load from file
    socket.on('Sending file name', function (data) {
        console.log("Server looking for file: " + data);
        data = data.replace(/\s+/g, '_');
        var load_title = 'json/' + data + '.json';
        //var util = require('util');

        jf.readFile(load_title, function(err, obj) {
            //console.log(util.inspect(obj));
            if (err != null)
                console.log(err);
            else
                socket.emit('successful_load', obj);
                console.log("Successfully found file!");
        });

    });

});
console.log("Express listening on port " +
    port);
