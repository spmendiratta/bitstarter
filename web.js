var express = require('express');
var fs = require('fs');

var app = express.createServer(express.logger());

app.get('/', function(request, response) {
  var content = String(fs.readFileSync("index.html"));
  // response.send('Hello World!');
  // response.send('Hello World 2!');
   response.send( content );
});

var port = process.env.PORT || 8080;
app.listen(port, function() {
  console.log("Listening on " + port);
});
