const WebSocket = require('ws');
const url = require('url');
const express = require('express')
const app = express()
const { v4: uuidv4 } = require('uuid')
const port = 3000

const cloudServerWebSocket = new WebSocket.Server({ port: 8080 });
const localServerWebSocket = new WebSocket.Server({ port: 9090 });

const clients = new Map();

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
    fs.readFile(__dirname + '/public/index.html', 'utf8', function(err, text){
        res.send(text);
    });
});

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})

cloudServerWebSocket.on('connection', function (socket, req) {
  const clientId = uuidv4();
  console.log(`New client connected: ${clientId}`);

  //socket.send('yo')

  clients.set(clientId, socket);
  notifyLocalServerAdd(clientId);

    socket.on('message', function (message) {
    console.log(`Received message from client ${clientId}: ${message}`);
  });

  socket.on('close', function (code, reason) {
    console.log(`Client ${clientId} disconnected`);
    clients.delete(clientId);
    notifyLocalServerRemove(clientId);
  });
});

localServerWebSocket.on('connection', function (socket) {
  console.log('Local Max Server connected');

  socket.on('message', function (message) {
    console.log(`Received message from local client: ${message}`);
    sendToClients(message);
  });

  socket.on('close', function (code, reason) {
    console.log('Local Max Server disconnected');
  });
});

function notifyLocalServerAdd(clientId) {
  localServerWebSocket.clients.forEach(function (clientSocket) {
    clientSocket.send(`${clientId} add`);
  });
}

function notifyLocalServerRemove(clientId) {
  localServerWebSocket.clients.forEach(function (clientSocket) {
    clientSocket.send(`${clientId} remove`);
  });
}

function sendToClients(message) {
  cloudServerWebSocket.clients.forEach(function (clientSocket) {
    clientSocket.send(`Received message from local client: ${message}`);
  });
}