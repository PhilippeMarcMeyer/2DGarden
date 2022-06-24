const express = require('express');
const bodyParser = require('body-parser')
const app = express()
const port = 8080;
const server = require('http').Server(app)
const io = require('socket.io')(server, {cookie: true})
//const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser')

const cookie = require("cookie") 
const cookieName = "garden";
const fs = require('fs');
const { unlink } = require('fs/promises');
let users = [];
let worldModel = null;
const dayLength = 1*60*1000; // 5 minutes
let interval;

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use(cookieParser())

app.use(express.static(__dirname));

fs.readFile("./files/world1.json", "utf8", (err, rawdata) => {
	if (err) {
	  console.log("File reading failed:", err);
	  return;
	}else{
		worldModel = JSON.parse(rawdata);
    interval = setInterval(function(){
      worldModel.gardenDay++;
     users.forEach((u) => {
        u.socket.emit('info',{what:'world-day',day:worldModel.gardenDay});
    });
     saveWorld();
    }, dayLength)
	}
});

function saveWorld(){
  fs.writeFile("./files/world1.json", JSON.stringify(worldModel,null,2), err => {
		if (err) {
			console.log("Error writing file:", err);
		}
	  });
}

app.get('/',function(req,res) {
    res.sendFile('index.html', { root: __dirname });
  });

 io.on('connection', (socket) =>{
  console.log(`connected :  ${socket.id}`);
  let cookies = socket.handshake.headers.cookie; 
  let identity = getIdentity(cookies);
  
  users.push({
    name : identity.name,
    color:identity.color,
    id: socket.id,
    socket: socket,
    position: identity.position ? identity.position : {x: 0,y: 0},
    rotation: identity.rotation ? identity.rotation : 0
  });
  
  users.forEach((u) => {
    if(socket.id === u.socket.id){
      u.socket.emit('info', { playerId: socket.id, what: "player-identity", name: u.name, color: u.color, position: u.position, rotation: u.rotation });
    }else{
      u.socket.emit('info', { playerId: socket.id, what: "player-connected", name: u.name, color: u.color, position: u.position, rotation: u.rotation });
    }
  });

  socket.on('disconnect', () => {
    console.log(`disconnect ${socket.id}`);
    let idDisconnected = socket.id;
    users = users.filter((u) => {
      return u.id != idDisconnected;
    });
    setTimeout(function(){
      users.forEach((u) => {
        u.socket.emit('info',{playerId : idDisconnected,what:"player-disconnected"});
      })

    },1000)

  });

  socket.on('info', (msg) => {
    if(msg.what === 'ping'){
      socket.emit('info',{what:"pong"});
    }
    else if(msg.what === 'player-moved'){
      msg.playerId = socket.id;
      let userSelection = users.filter((x) => {
        return x.id === socket.id;
      });
      if(userSelection.length === 1){
        userSelection[0].position = msg.position;
        userSelection[0].rotation = msg.rotation;
        msg.name = userSelection[0].name;
        msg.color = userSelection[0].color;
        users.forEach((u) => {
          if(u.id !== socket.id){
            u.socket.emit('info',msg);
          }
        });
      }

    }else if(msg.what === 'player-collided'){
      users.forEach((u) => {
        if(u.id !== socket.id){
          u.socket.emit('info',{position : msg.position,rotation:msg.rotation,target:msg.target,what:"target-shake"});
        }
      })
    }
  });
})

server.listen(port, () => {
  console.log(`2DGarden listening on port ${port}`)
});

function getIdentity(cookiesString) {
  console.log(cookiesString)
  let cookiesList = cookiesString ? cookiesString.split(';') : [];
  const identities = [{ "name": "Elrond", "color": "#FF0000" }, { "name": "Boromir", "color": "#DDDD00" }, { "name": "Frodo", "color": "#0000AD" }, { "name": "Sam", "color": "#FF4500" }, { "name": "Aragorn", "color": "#00ADAD" }, { "name": "Galadriel", "color": "#AD00AD" }, { "name": "Gimli", "color": "#582900" }, { "name": "Isildur", "color": "#FFCC00" }, { "name": "Legolas", "color": "#F0E0D0" }, { "name": "Tom", "color": "#33FFCC" }, { "name": "Meriadoc", "color": "#CC6600" }, { "name": "Preregrin", "color": "#CC0066" }]
  let identity;
  let hasIdentity = false;
  let cookies = {};
  cookiesList.forEach((x) => {
    let parts = x.split('=');
    if (parts.length === 2) {
      parts[0] = parts[0].trim();
      cookies[parts[0]] = parts[1];
    }
  });

  if (cookieName in cookies) {
    identity = JSON.parse(cookies[cookieName]);
    if (identity.name && identity.color) {
      hasIdentity = true;
    } 
  }

  if (!hasIdentity) {
    if (users.length === 0) {
      identity = identities[0];
    } else {
      let givenNames = users.map((x) => {
        return x.name;
      })
      let availableIdentities = identities.filter((x) => {
        return givenNames.indexOf(x.name) === -1;
      })
      identity = availableIdentities.length > 0 ? availableIdentities[0] : { "name": "Nobody", "color": "#AAAAAA" };
    }
  }
  return identity;
}
