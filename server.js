const express = require('express');
const bodyParser = require('body-parser')
const app = express()
const port = 8080;
const server = require('http').Server(app)
const io = require('socket.io')(server, { cookie: true })
//const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser')

const cookie = require("cookie")
const cookieName = "garden";
const fs = require('fs');
let users = [];
let userMemory = [];
let worldModel = null;
const dayLength = 5 * 60 * 1000; // 5 minutes
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
      userMemory = [];
    } else {
      userMemory = JSON.parse(rawplayers);
    }

    serverLoaded = true;

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

function savePlayers() {
  let usersCopy = [...users];
  usersCopy.forEach((u) => {
    delete u.socket;
    delete u.id;
    // "name": "Elrond", "color": "#FF0000", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450 
    if(!u.dotsColor) u.dotsColor = "#000000";
    if(!u.dotsNumber) u.dotsNumber = 3;
    if(!u.birth) u.birth = worldModel.gardenDay;
    if(!u.maxAge) u.maxAge = 450;
  });
  fs.writeFile("./files/players.json", JSON.stringify(users, null, 2), err => {
    if (err) {
      console.log("Error writing users file:", err);
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

  users
    .forEach((u) => {
      if (socket.id === u.socket.id) {
        console.log('player-identity')
        u.socket.emit('info', { playerId: socket.id, what: "player-identity", name: u.name, color: u.color, position: u.position, rotation: u.rotation });
      } else {
        console.log('player-connected')
        u.socket.emit('info', { playerId: socket.id, what: "player-connected", name: u.name, color: u.color, position: u.position, rotation: u.rotation });
      }
    });

 // savePlayers();

  socket.on('disconnect', () => {
    console.log(`disconnect ${socket.id}`);
    let idDisconnected = socket.id;
    let name = "?";
    users = users.filter((u) => {
      return u.id !== idDisconnected
    });
      setTimeout(function () {
        users
          .forEach((u) => {
            u.socket.emit('info', { playerId: idDisconnected, name: u.name, what: "player-disconnected" });
          })
      }, 1000)
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
      { "name": "Elrond", "color": "#FF0000", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450 },
      { "name": "Boromir", "color": "#DDDD00", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450 },
      { "name": "Frodo", "color": "#0000AD", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450 },
      { "name": "Sam", "color": "#FF4500", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450 },
      { "name": "Aragorn", "color": "#00ADAD", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450 },
      { "name": "Galadriel", "color": "#AD00AD", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450 },
      { "name": "Gimli", "color": "#582900", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450 },
      { "name": "Isildur", "color": "#FFCC00", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450 },
      { "name": "Legolas", "color": "#F0E0D0", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450 },
      { "name": "Tom Bombadil", "color": "#33FFCC", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450 },
      { "name": "Meriadoc", "color": "#CC6600", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450 },
      { "name": "Preregrin", "color": "#CC0066", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450 }
    ];
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
        if(identity.name !== '???'){
          hasIdentity = true;
          if(!identity.dotsColor) identity.dotsColor = "#000000";
          if(!identity.dotsNumber) identity.dotsNumber = 3;
          if(!identity.birth) identity.birth = worldModel.gardenDay;
          if(!identity.maxAge) identity.maxAge = 450;
        }
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
        identity = availableIdentities.length > 0 ? availableIdentities[0] :  { "name": "nobody", "color": "#cccccc", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450 };
      }
    }
    if (!identity.birth) {
      identity.birth = worldModel.gardenDay;
    }

    return identity;
  }
