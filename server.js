const express = require('express');
const bodyParser = require('body-parser')
const app = express()
const port = 8080;
const server = require('http').Server(app)
const io = require('socket.io')(server, { cookie: true })
const cookieParser = require('cookie-parser')
const cookieName = "garden";
const fs = require('fs');
const { waitForDebugger } = require('inspector');
let users = [];
let worldModel = null;
let playersFileLock = false;
const dayLengthNoConnection = 2 * 3600 * 1000; // 2 heures
const dayLengthConnection = 10 * 60 * 1000; // 10 minutes

let dayLength = dayLengthNoConnection;
let intervalDays;
let serverLoaded = false;
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(express.static(__dirname));

fs.readFile("./files/world1.json", "utf8", (err, rawdata) => {
  if (err) {
    console.log("World model file reading failed:", err);
    return;
  }
  fs.readFile("./files/players.json", "utf8", (err, rawplayers) => {
    if (err) {
      console.log("Players file reading failed:", err);
      return;
    }
    worldModel = JSON.parse(rawdata);
    if (rawplayers === null || rawplayers === '') {
      usersMemory = {};
    } else {
      usersMemory = JSON.parse(rawplayers);
    }

    serverLoaded = true;

    intervalPlayersSaving = setInterval(function(){
      savePlayers();
    },3*60*1000)

    intervalDays = setInterval(function () {
      worldModel.gardenDay++;
      users.forEach((u) => {
        u.socket.emit('info', { what: 'world-day', day: worldModel.gardenDay });
      });
      // commanded by the server only
      // check the evolution in the plant models to see if the begin to make seeds and later perish
      // later add bonuses or maluses according to weather, water, soil, animals attack
      // it would mean than a little part of the evolution is set in the plant itself and not in its model
      // some plants could give protection to the ladybug on a radius egal to their size (4 leaves clovers !)
      // check if a lady bug is too old, then add 1 to the generation in the players.json aka usersMemory
      checkGenerations();
      saveWorld();
    }, dayLength);
  });


});

function saveWorld() {
  fs.writeFile("./files/world1.json", JSON.stringify(worldModel, null, 2), err => {
    if (err) {
      console.log("Error writing world file:", err);
    }
  });
}

app.get('/', function (req, res) {
  if (serverLoaded) {
    res.sendFile('index.html', { root: __dirname });
  } else {
    res.status(202).json({ "error": "Server is still loading ! Try later" });
  }
});

io.on('connection', (socket) => {
  console.log(`connected :  ${socket.id}`);
  let cookies = socket.handshake.headers.cookie;
  let identity = getIdentity(cookies);
  let found = false;
  users.forEach((u) => {
    if (u.name === identity.name) {
      found = true;
      u.color = identity.color;
      u.id = socket.id;
      u.socket = socket;
      u.position = identity.position ? identity.position : { x: 0, y: 0 };
      u.rotation = identity.rotation ? identity.rotation : 0
    }
  });

  if (!found) {
    users.push({
      name: identity.name,
      color: identity.color,
      id: socket.id,
      socket: socket,
      position: identity.position ? identity.position : { x: 0, y: 0 },
      rotation: identity.rotation ? identity.rotation : 0
    });
  }
  savePlayers();
  users
    .forEach((u) => {
      if (socket.id === u.socket.id) {
        console.log('player-identity')
        u.socket.emit('info', { playerId: socket.id, what: "player-identity", name: u.name, color: u.color, position: u.position, rotation: u.rotation ,generation : u.generation });
      } else {
        console.log('player-connected')
        u.socket.emit('info', { playerId: socket.id, what: "player-connected", name: u.name, color: u.color, position: u.position, rotation: u.rotation ,generation : u.generation  });
      }
    });

  socket.on('disconnect', () => {
    console.log(`disconnect ${socket.id}`);
    let idDisconnected = socket.id;
    users = users.filter((u) => {
      return u.id !== idDisconnected
    });
      setTimeout(function () {
        users
          .forEach((u) => {
            u.socket.emit('info', { playerId: idDisconnected, name: u.name, what: "player-disconnected" });
          })
      }, 1500)
    });

    socket.on('info', (msg) => {
      if (msg.what === 'ping') {
        socket.emit('info', { what: "pong" });
      }
      else if (msg.what === 'player-moved') {
        msg.playerId = socket.id;
        let userSelection = users.filter((x) => {
          return x.id === socket.id;
        });
        if (userSelection.length === 1) {
          userSelection[0].position = msg.position;
          userSelection[0].rotation = msg.rotation;
          msg.name = userSelection[0].name;
          msg.color = userSelection[0].color;

          users
            .forEach((u) => {
              if (u.id !== socket.id) {
                u.socket.emit('info', msg);
              }
            });
        }
      } else if (msg.what === 'player-collided') {
        users
          .forEach((u) => {
            if (u.id !== socket.id) {
              u.socket.emit('info', { position: msg.position, rotation: msg.rotation, target: msg.target, what: "target-shake" });
            }
          })
      }
    });
  })

  server.listen(port, () => {
    console.log(`2DGarden listening on port ${port}`)
  });

  function getIdentity(cookiesString) {
    let cookiesList = cookiesString ? cookiesString.split(';') : [];
    let identities = [
      { "name": "Elrond", "color": "#FF0000", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450, "generation": 1 },
      { "name": "Boromir", "color": "#DDDD00", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450, "generation": 1 },
      { "name": "Frodo", "color": "#0000AD", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450, "generation": 1 },
      { "name": "Sam", "color": "#FF4500", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450, "generation": 1 },
      { "name": "Aragorn", "color": "#00ADAD", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450, "generation": 1 },
      { "name": "Galadriel", "color": "#AD00AD", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450, "generation": 1 },
      { "name": "Gimli", "color": "#582900", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450, "generation": 1 },
      { "name": "Isildur", "color": "#FFCC00", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450, "generation": 1 },
      { "name": "Legolas", "color": "#F0E0D0", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450, "generation": 1 },
      { "name": "Tom Bombadil", "color": "#33FFCC", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450, "generation": 1 },
      { "name": "Meriadoc", "color": "#CC6600", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450, "generation": 1 },
      { "name": "Peregrin", "color": "#CC0066", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450, "generation": 1 }
    ];
    let identity;
    let hasIdentity = false;
    let cookies = {};
    console.log(cookiesList)
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
        console.log(identity.name)

        if (identity.name !== '???') {
          let findInConnected = users.filter((u) => {
            return u.name === identity.name;
          });
          if (findInConnected.length === 0) { // not already connected
            hasIdentity = true;
            if (usersMemory[identity.name]) {
              if (!identity.dotsColor) identity.dotsColor = usersMemory[identity.name].dotsColor;
              if (!identity.dotsNumber) identity.dotsNumber = usersMemory[identity.name].dotsNumber;
              if (!identity.birth) identity.birth = usersMemory[identity.name].birth;
              if (!identity.maxAge) identity.maxAge = usersMemory[identity.name].maxAge;
            } else {
              if (!identity.dotsColor) identity.dotsColor = "#000000";
              if (!identity.dotsNumber) identity.dotsNumber = 3;
              if (!identity.birth) identity.birth = worldModel.gardenDay;
              if (!identity.maxAge) identity.maxAge = 450;
            }
          }
        }
      }
    }

    if (!hasIdentity) {
      if (users.length === 0) {
        identity = identities[0];
      } else {
        let givenNames =[];
        for (const n in usersMemory) {
          givenNames.push(n);
        }
        let availableIdentities = identities.filter((x) => {
          return givenNames.indexOf(x.name) === -1;
        })
        identity = availableIdentities.length > 0 ? availableIdentities[0] :  { "name": "nobody", "color": "#cccccc", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450, "generation" :1 };
      }
    }
    if (!identity.birth) {
      identity.birth = worldModel.gardenDay;
    }
    if (!identity.generation) {
      identity.generation = 1;
    }
    return identity;
  }

  function savePlayers() {
    let usersCopy = [...users];
    let usersDict = {...usersMemory};
    usersCopy.forEach((u) => {
      usersDict[u.name] = {
        position : u.position || {x:0,y:0},
        rotation : u.rotation || 0,
        color : u.color,
        birth : u.birth || worldModel.gardenDay,
        dotsNumber : u.dotsNumber || 3,
        dotsColor : u.dotsColor || "#000000",
        maxAge : u.maxAge || 450,
        generation : u.generation || 1
      }
    });
    usersMemory = {...usersDict};
    fs.writeFile("./files/players.json", JSON.stringify(usersDict, null, 2), err => {
      if (err) {
        console.log("Error writing users file:", err);
      }
    });
  }

  function checkGenerations(){
    for (const bug in usersMemory) {
       let bugAge =  worldModel.gardenDay - bug.birth;
       if(bugAge > bug.maxAge){
        if (Math.random() <= 0.5){
          bug.maxAge += 5;
        }else{
          bug.generation++;
          bug.birth = worldModel.gardenDay;
          if (Math.random() <= 0.2){
            bug.dotsNumber += 1;
            if(bug.dotsNumber > 7){
              bug.dotsNumber = 7;
            }
          }
          if (Math.random() <= 0.5){
            bug.color = shuffleColor(bug.color,10);
          }
        }
       }
    }
  }

  function shuffleColor(hexaColor,amount){
    if(hexaColor.substring(0,1) != "#"){
      return hexaColor;
    }
    let r =  parseInt(hexaColor.substring(1,3),16);
    let g =  parseInt(hexaColor.substring(3,5),16);
    let b =  parseInt(hexaColor.substring(5,7),16);

    let whatColor = Math.random();
    let upOrDown = Math.random() <= 0.5 ? 1 : -1;
    if (whatColor <= 0.5){
      r += (amount * upOrDown);
      if(r > 255) r = 255;
      if(r < 0) r = 0;
    }else if(whatColor <= 0.8){
      b += (amount * upOrDown);
      if(b > 255) b = 255;
      if(b < 0) b = 0;
    }else{
      g += (amount * upOrDown);
      if(g > 255) g = 255;
      if(g < 0) g = 0;
    }
    let rHex =  r < 16 ? '0' + r.toString(16) : r.toString(16);
    let gHex =   g < 16 ? '0' + g.toString(16) : g.toString(16);
    let bHex =   b < 16 ? '0' + b.toString(16) : b.toString(16);
    return '#' + rHex + gHex + bHex;
  }