var http = require('http');
var fs = require('fs');

var server = http.createServer(function(request, response) {

    if (request.method === "GET") {
        fs.readFile('./public/' + request.url, function(err, data) {
            if (!err) {
                var dotoffset = request.url.lastIndexOf('.');
                var mimetype = dotoffset == -1 ? 'text/plain' : {
                    '.html': 'text/html',
                    '.png': 'image/png',
                    '.css': 'text/css',
                    '.json': 'application/json',
                    '.js': 'text/javascript'
                }[request.url.substr(dotoffset)];
                response.setHeader('Content-type', mimetype);
                response.end(data);
                console.log(request.url, mimetype);
            } else {
                console.log('file not found: ' + request.url);
                response.writeHead(404, "Not Found");
                response.end();
            }
        });
    } else if (request.method === "POST") {
        var body = [];
        request.on('data', function(chunk) {
            body.push(chunk);
        }).on('end', function() {
            body = Buffer.concat(body).toString();
            fs.writeFile('./public/tree.json', body, function(err) {
                if (err) console.log(err);
                console.log('It\'s saved!');
            });
            response.status = "200";
        });
        response.end();
    }
});

var port = 8000;
server.listen(port, function() {
    console.log("Listening on port 8000");
});
