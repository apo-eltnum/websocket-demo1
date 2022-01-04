const webSocketsServerPort = 8000;
const webSocketServer = require('websocket').server;
const http = require('http');

//crear http y websocket
const server = http.createServer();
server.listen(webSocketsServerPort);
const wsServer = new webSocketServer({
  httpServer: server
});

// Generar id para las conexiones
const getUniqueID = () => {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return s4() + s4() + '-' + s4();
};

//conexiones
const conexionUser = {};
// usuarios
const users = {};
// contenido
let editorContent = null;
// historial de actividades - log
let logs = [];



const sendMessage = (json) => {
  //mandar la lissta de conexiones al cliente
  Object.keys(conexionUser).map((client) => {
    conexionUser[client].sendUTF(json);
  });
}

const typesDef = {
  USER_EVENT: "userevent",
  CONTENT_CHANGE: "contentchange"
}

wsServer.on('request', function(request) {
  var userID = getUniqueID();
  console.log((new Date()) + ' Coexión recibida desde ' + request.origin + '.');

  const connection = request.accept(null, request.origin);
  conexionUser[userID] = connection;
  console.log('connected: ' + userID + ' in ' + Object.getOwnPropertyNames(conexionUser));
  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      const dataFromClient = JSON.parse(message.utf8Data);
      const json = { type: dataFromClient.type };
      if (dataFromClient.type === typesDef.USER_EVENT) {
        users[userID] = dataFromClient;
        logs.push(`${dataFromClient.username} se ha unido`);
        json.data = { users, logs };
      } else if (dataFromClient.type === typesDef.CONTENT_CHANGE) {
        editorContent = dataFromClient.content;
        json.data = { editorContent, logs };
      }
      sendMessage(JSON.stringify(json));
    }
  });
  //usuario desconectado
  connection.on('close', function(connection) {
    console.log((new Date()) + " Peer " + userID + " desconectado.");
    const json = { type: typesDef.USER_EVENT };
    logs.push(`${users[userID].username} ha salido`);
    json.data = { users, logs };
    delete conexionUser[userID];
    delete users[userID];
    sendMessage(JSON.stringify(json));
  });
});
