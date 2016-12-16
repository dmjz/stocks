var path = process.cwd();
var request = require('request');

function httpRequest (url, res) {
    request({ url: url, method: 'GET'}, function (error, response, body) {
        if (error) { console.log(error); }
        res.send(body);
    });
}

module.exports = function (app) {
    
    app.route('/') 
        .get(function (req, res) {
            res.sendFile(path + '/public/index.html');
        });
    
    app.route('/lookup')
        .get(function (req, res) {
            httpRequest('http://dev.markitondemand.com/Api/v2/Lookup/json?input=' + req.query.input, res);
        });
    
    app.route('/chart')
        .get(function (req, res) {
            httpRequest('http://dev.markitondemand.com/Api/v2/InteractiveChart/json?parameters=' + req.query.parameters, res);
        });
    
};