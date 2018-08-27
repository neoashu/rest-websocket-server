//const express = require('express')
//const enableWs = require('express-ws')

//const app = express()
//const server = require('http').Server(app)


const server_port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
const server_ip_address = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
const bodyParser = require('body-parser');
//enableWs(app)
const express = require('express'),
    app = express(),
    server = require('http').Server(app);
var socket_io = require('socket.io')(server);

//var socket_io = require('socket.io').listen(server);
//var socket_io = require('socket.io')(server);
var socket_holder = null;


function restToWebsocket (req, res) {
	console.log("got request");
	if(socket_holder == null || typeof(socket_holder) == 'undefined' ){
		 try {
				res.status(503);

				//if (req.accepts('html')) {
				//  res.render('error/503', { title:'503: Service //Unavailable', error: '503: Service Unavailable', //url:// req.url });
				//}

				//if (req.accepts('json')) {
				  res.send({ title: 'Service Unavailable'});
				//}
				
            } catch (err) {
                console.log(err);
            }
			return;
	}
	//res.setHeader('Content-Type', 'application/json');
    
//	socket_holder.emit('ws-request', {
  //          data: {
    //            key: 'value'
      //      }
        //});
	socket_holder.emit('ws-request', {
           body: req.body,
		   headers: req.headers,
		   path: req.route.path,
		   route: req.params,
		   orginalURI:req.originalUrl,
		   scheme:req.params.scheme,
		   server:req.params.server,
		   uri:req.params["0"],
		   method: req.method
		   
		   //headers: JSON.stringify(req.headers)
            
        });
		console.log("sent request");
        socket_holder.on('ws-response', function (ws_response) {

			console.log("got response"+JSON.stringify(ws_response));
            try {
				res.statusCode= ws_response.statusCode;
				if(ws_response['content-type'] != null){
					res.setHeader('content-type',ws_response['content-type']);
                }
				res.send(ws_response.body);
            } catch (err) {
                console.log(err);
            }
			socket_holder.removeAllListeners('ws-response');
        });
		//socket_holder.on('ws-response',respondViaWebsocket(res));
		//socket_holder.removeListener('ws-response',respondViaWebsocket);
      	
}
/* 
function respondViaWebsocket(res,ws_response) {
			console.log("got response");
            try {
                res.send(ws_response);
            } catch (err) {
                console.log(err);
            }
}
 */

var rawBodySaver = function (req, res, buf, encoding) {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
}


app.use(express.static(__dirname + '/node_modules'));
app.use(bodyParser.json({ verify: rawBodySaver }));
//app.use(bodyParser.urlencoded({ verify: rawBodySaver, extended: true }));
app.use(bodyParser.raw({ verify: rawBodySaver, type: function () { return true } }));

//app.use(bodyParser.raw()); // support raw
//app.use(bodyParser.json()); // support json encoded bodies
//app.use(bodyParser.urlencoded({extended: false})); // support encoded bodies
server.listen(server_port)



socket_io.on('connection', function(client) {
	socket_holder = client;	
    console.log('Client connected...');

    client.on('join', function(data) {
        console.log(data);
    });

    client.on('messages', function(data) {
           client.emit('broad', data);
           client.broadcast.emit('broad',data);
    });
	
	client.on('disconnect', function() {
      console.log('Got disconnect!');

      socket_holder = null;
   });

});
// Our handler function is passed a request and response object
//app.all('/wsapi/scheme/:scheme/server/:server/api*', restToWebsocket);
app.all('/wsapi/scheme/:scheme/server/:server/api*', restToWebsocket);
// Our handler function is passed a request and response object
//app.get('/wsapi*',restToWebsocket);

  
app.get('/', function(req, res,next) {  
    res.sendFile(__dirname + '/index.html');
});
