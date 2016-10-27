var express = require('express');

var app = express();

app.route('/')
    .get(function (req, res) {
        res.sendFile('index.html')
    });
    
app.listen(process.env.PORT, process.env.IP, function () {
	console.log('Node.js listening on port ' + process.env.PORT);
});