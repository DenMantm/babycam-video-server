// Use the websocket-relay to serve a raw MPEG-TS over WebSockets. You can use
// ffmpeg to feed the relay. ffmpeg -> websocket-relay -> browser
// Example:
// node websocket-relay yoursecret 8081 8082
// ffmpeg -i <some input> -f mpegts http://localhost:8081/yoursecret

var fs = require('fs'),
	http = require('http'),
	WebSocket = require('ws');

if (process.argv.length < 3) {
	console.log(
		'Usage: \n' +
		'node websocket-relay.js <secret> [<stream-port> <websocket-port>]'
	);
	process.exit();
}

var STREAM_SECRET = process.argv[2],
	STREAM_PORT = process.argv[3] || 8081,
	WEBSOCKET_PORT = process.argv[4] || 8082,
	RECORD_STREAM = false;

// Websocket Server
var socketServer = new WebSocket.Server({port: WEBSOCKET_PORT, perMessageDeflate: false});
socketServer.connectionCount = 0;
socketServer.on('connection', function(socket) {
	socketServer.connectionCount++;
	console.log(
		'New WebSocket Connection: ', 
		socket.upgradeReq.socket.remoteAddress,
		socket.upgradeReq.headers['user-agent'],
		'('+socketServer.connectionCount+' total)'
	);
	socket.on('close', function(code, message){
		socketServer.connectionCount--;
		console.log(
			'Disconnected WebSocket ('+socketServer.connectionCount+' total)'
		);
	});
});
socketServer.broadcast = function(data) {
	socketServer.clients.forEach(function each(client) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(data);
		}
	});
};

// HTTP Server to accept incomming MPEG-TS Stream from ffmpeg
var streamServer = http.createServer( function(request, response) {
	var params = request.url.substr(1).split('/');

	if (params[0] !== STREAM_SECRET) {
		console.log(
			'Failed Stream Connection: '+ request.socket.remoteAddress + ':' +
			request.socket.remotePort + ' - wrong secret.'
		);
		response.end();
	}

	response.connection.setTimeout(0);
	console.log(
		'Stream Connected: ' + 
		request.socket.remoteAddress + ':' +
		request.socket.remotePort
	);
	request.on('data', function(data){
		socketServer.broadcast(data);
		if (request.socket.recording) {
			request.socket.recording.write(data);
		}
	});
	request.on('end',function(){
		console.log('close');
		if (request.socket.recording) {
			request.socket.recording.close();
		}
	});

	// Record the stream to a local file?
	if (RECORD_STREAM) {
		var path = 'recordings/' + Date.now() + '.ts';
		request.socket.recording = fs.createWriteStream(path);
	}
}).listen(STREAM_PORT);

console.log('Listening for incomming MPEG-TS Stream on http://127.0.0.1:'+STREAM_PORT+'/<secret>');
console.log('Awaiting WebSocket connections on ws://127.0.0.1:'+WEBSOCKET_PORT+'/');



const spawn = require('child_process').spawn;
//const child = spawn('./video.sh', ['']);
var child1_process;
var child2_process;

//fireing up instances
child1();
child2();

//adding this in case if someone externally killes node process
var cleanExit = function() { process.exit() };
process.on('SIGINT', cleanExit); // catch ctrl-c
process.on('SIGTERM', cleanExit); // catch kill

process.on('exit', function () {
    child1_process.kill();
    child2_process.kill();
    console.log('Node is killed');
});



function child1(){
    console.log('Run child1');
    child1_process = spawn('./video.sh', ['']);
    
    child1_process.stdout.on('data',
        function (data) {
            //console.log('output: ' + data);
        });
    child1_process.stderr.on('data', function (data) {
        //throw errors
        //console.log('stderr: ' + data);
    });

    child1_process.on('close', function (code) {
        
        //setting delay in case if time should be allowed for previose process ti finish
        setTimeout(function(){
                child1()
            }, 5000); 
        console.log('child process exited with code ' + code);
    });
}


function child2(){

    console.log('Run child2');
    child2_process = spawn('./audio.sh', ['']);
    
    child2_process.stdout.on('data',
        function (data) {
            //console.log('output: ' + data);
        });
    child2_process.stderr.on('data', function (data) {
        //throw errors
        //console.log('stderr: ' + data);
    });

    child2_process.on('close', function (code) {
        
        //setting delay in case if time should be allowed for previose process ti finish
        setTimeout(function(){
                child2()
            }, 5000); 
        console.log('child process exited with code ' + code);
    });
    
}







