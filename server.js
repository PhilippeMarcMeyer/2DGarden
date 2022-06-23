const express = require('express');
const bodyParser = require('body-parser')
const app = express()
const port = 8080;
const server = require('http').Server(app)
const io = require('socket.io')(server)
const fs = require('fs');
let users = [];
let worldModel = null;
const dayLength = 1*60*1000; // 5 minutes
let interval;

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
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
  fs.writeFile("./files/world1.json", JSON.stringify(worldModel), err => {
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
  users.forEach((u) => {
    u.socket.emit({playerId : socket.id,what:"player-connected"});
  });
  users.push({
    id: socket.id,
    socket: socket,
    position: {
      x: 0,
      y: 0
    },
    rotation: 0
  });

  socket.on('disconnect', () => {
    console.log(`disconnect ${socket.id}`);
    let idDisconnected = socket.id;
    users = users.filter((u) => {
      return u.id != idDisconnected;
    });
    users.forEach((u) => {
      u.socket.emit('info',{playerId : idDisconnected,what:"player-disconnected"});
    })
  });

  socket.on('info', (msg) => {
    if(msg.what === 'ping'){
      socket.emit('info',{what:"pong"});
    }
    else if(msg.what === 'player-moved'){
      msg.playerId = socket.id;
      users.forEach((u) => {
        if(u.id === socket.id){
          u.position = msg.position;
          u.rotation = msg.rotation;
        }else{
            u.socket.emit('info',msg);
        }
      });
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
