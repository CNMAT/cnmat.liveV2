const path = require('path');
const Max = require('max-api');
const WebSocket = require('ws');

const remoteConfig = {
  protocol: 'wss',
  host: 'cnmat.io',
  wsPort: '',
};
const localConfig = {
  protocol: 'ws',
  host: 'localhost',
  wsPort: '8081',
};

// const { protocol, host, wsPort } = localConfig;
const { protocol, host, wsPort } = remoteConfig;

const wsUrl = `${protocol}://${host}:${wsPort}?channels=aframe`;

console.log('Attempting to establish ws connection');

let ws;
let restartInterval = 5000;

const connect = () => {
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    Max.post(`ws connection established with ${wsUrl}`);
  };

  ws.onmessage = (event) => {
    Max.post(`received: ${event.data}`);
    const data = JSON.parse(event.data);
    Max.outlet(data);
  };

  ws.onclose = () => {
    Max.post('ws connected closed');

    if (restartInterval != 0) setTimeout(connect, restartInterval);
    else process.exit(1);
  };

  ws.onerror = (err) => {
    Max.post(`ws error: ${err.message}`);
  };
};


connect();


const sendMessage = (type, data, options = {}) => {
  const message = { type, ...data, ...options };
  const jsonMsg = JSON.stringify(message);

  Max.post(`sending: ${jsonMsg}`);
  ws.send(jsonMsg);
};

const handlers = {
  message: (type, ...data) => {
    Max.post(`Received message of type: ${type} with data: ${data}`);
    sendMessage(type, data);
  },
  sendToOne: (targetId, msg) => {
    console.log('sent beepClient', targetId, msg);
    sendMessage('sendToClient',{ type: 'sendToOne', data: msg }, { targetId : targetId });
  },

  joinChannel: (...channel) => {
    sendMessage('joinChannel', { channel });
  },
  leaveChannel: (...channel) => {
    sendMessage('leaveChannel', { channel });
  },
};

// Add the handlers to Max API
Max.addHandlers(handlers);