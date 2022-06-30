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
const { isContext } = require('vm');
let users = [];
let worldModel = null;
let worldOnHold = false;
const dayLengthNoConnection = 2 * 3600 * 1000; // 2 heures
const dayLengthConnection = 3 * 60 * 1000; // 10 minutes

let dayLength = dayLengthConnection;
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
      worldOnHold = true;
      worldModel.gardenDay++;
      /*
      users.forEach((u) => {
        u.socket.emit('info', { what: 'world-day', day: worldModel.gardenDay });
      });
      */
      // commanded by the server only
      // check the evolution in the plant models to see if the begin to make seeds and later perish
      // later add bonuses or maluses according to weather, water, soil, animals attack
      // it would mean than a little part of the evolution is set in the plant itself and not in its model
      // some plants could give protection to the ladybug on a radius egal to their size (4 leaves clovers !)
      // check if a lady bug is too old, then add 1 to the generation in the players.json aka usersMemory
      checkGenerations();
      checkPlants();
      saveWorld();
      worldOnHold = false;
      io.emit('info', { what: 'world-day', day: worldModel.gardenDay }); // call also to reload ?
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
  let idconnected = socket.id;
  console.log(`connected :  ${idconnected}`);
  let cookies = socket.handshake.headers.cookie;
  let identity = getIdentity(cookies);
  let found = false;
  users.forEach((u) => {
    if (u.name === identity.name) {
      found = true;
      u.color = identity.color;
      u.id = idconnected;
      u.socket = socket;
      u.position = identity.position ? identity.position : { x: 0, y: 0 };
      u.rotation = identity.rotation ? identity.rotation : 0;
      u.generation = identity.generation ?? 1;
      u.dotsColor = identity.dotsColor ?? '#000000';
      u.dotsNumber = identity.dotsNumber ?? 3;
    }
  });

  if (!found) {
    users.push({
      name: identity.name,
      color: identity.color,
      id: idconnected,
      socket: socket,
      position: identity.position ? identity.position : { x: 0, y: 0 },
      rotation: identity.rotation ? identity.rotation : 0,
      generation : identity.generation ?? 1,
      dotsColor : identity.dotsColor ?? '#000000',
      dotsNumber : identity.dotsNumber ?? 3
    });
  }

  let newPlayer = users.filter((u) => {
    return idconnected === u.id ;
  });

  let otherPlayers = users.filter((u) => {
    return idconnected !== u.id ;
  });

  if(newPlayer.length === 1){
    p = newPlayer[0];
    // tell client's new player about it's player identity and show it
    console.log('player-identity')
    let data = { playerId: idconnected, what: "player-identity", name: p.name, color: p.color, position: p.position, rotation: p.rotation ,generation : p.generation ,dotsColor : p.dotsColor,dotsNumber : p.dotsNumber};
    p.socket.emit('info',data);
    if(otherPlayers.length > 0){
      data.what = "player-connected";
      // Tell other players, there's a new kid in town !
      otherPlayers.forEach((u) => {
        u.socket.emit('info',data);
      });
      // Tell the new player, other players are already in the game
      otherPlayers.forEach((u) => {
        data = { playerId: u.id, what: "player-connected", name: u.name, color: u.color, position: u.position, rotation: u.rotation ,generation : u.generation ,dotsColor : u.dotsColor,dotsNumber : u.dotsNumber};
        newPlayer[0].socket.emit('info',data);
      });
    }
  }

  savePlayers();

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
        // got a cookie
        console.log(identity.name)
        if (identity.name !== '???') {
          let findInConnected = users.filter((u) => {
            return u.name === identity.name;
          });
          if (findInConnected.length === 0) { // not already connected
            if (usersMemory[identity.name]) {
              hasIdentity = true;
              if(identity.forceByCookie){
                identity.color = identity.color ?? usersMemory[identity.name].color;
                identity.dotsColor = identity.dotsColor ?? usersMemory[identity.name].dotsColor;
                identity.dotsNumber = identity.dotsNumber ?? usersMemory[identity.name].dotsNumber;
                identity.birth = identity.birth ?? usersMemory[identity.name].birth;
                identity.maxAge = identity.maxAge ?? usersMemory[identity.name].maxAge;
                identity.generation = identity.generation ?? usersMemory[identity.name].generation;
              }else{
                // take the informations from the server
                identity.color = usersMemory[identity.name].color;
                identity.dotsColor = usersMemory[identity.name].dotsColor;
                identity.dotsNumber = usersMemory[identity.name].dotsNumber;
                identity.birth = usersMemory[identity.name].birth;
                identity.maxAge = usersMemory[identity.name].maxAge;
                identity.generation = usersMemory[identity.name].generation;
              }
            } 
          }else{
            console.log("bug : " + identity.name + "is already connected !")
          }
        }
      }
    }

    if (!hasIdentity) {
        let givenNames =[];
        users.forEach((x)=> {
          givenNames.push(x.name);
        });
       
        let availableIdentities = identities.filter((x) => {
          return givenNames.indexOf(x.name) === -1;
        })
        identity = availableIdentities.length > 0 ? availableIdentities[0] :  { "name": "nobody", "color": "#cccccc", "dotsColor": "#000000", "dotsNumber": 3, "birth": null, "maxAge": 450, "generation" :1 };
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

  function checkPlants(){
    // removing dead plants :-(

    console.log("Check plants");
    console.log("plants before : " + worldModel.data.plants.length);
/*
    worldModel.data.plants =  worldModel.data.plants.filter((x)=>{
      return x.stage < 3;
    });
    */
/*
    worldModel.data.models.forEach((x)=>{
      x.evolution.seedsDay = Math.floor((0.6 * x.evolution.maxAge)+0.5);
  });
  */
/*
    worldModel.data.plants.forEach((x)=>{
        if(!x.stage) x.stage = 1;

    });
    */
   // console.log("plants after removing stage 3 : " + worldModel.data.plants.length);

    //
    let newPlants = [];
     worldModel.data.plants.forEach((x)=>{
      let model;
       if(x.model){
        model = worldModel.data.models.filter((y) => {
            return y.name === x.model;
        })[0];
       }else{
        console.log("not implemented yet");
       }
       let age = worldModel.gardenDay - x.birth + 1;
       console.log(x.name + " age : " +   age );

       if(x.stage === 0){ // seed
        age += model.evolution.seedCountDown;
        if(age >= 1){
          x.stage++; // flower
          x.birth = worldModel.gardenDay -1;
        }
       }else if(x.stage >= 1){// flower
          if(age >= model.evolution.seedsDay){
            if (Math.random() <= 0.1){
              console.log("seeds ?")
              seedsNr = Math.floor(((model.evolution.seeds.max - model.evolution.seeds.min) * Math.random()) + 0.5) + model.evolution.seeds.min;
              console.log("seedsNr " + seedsNr)
              let n = 0
              while (n < seedsNr) {
                n++;
                if (Math.random() <= model.evolution.seedSuccesRate){
                  // todo : cacl true distance and angle !!!
                  let seedAngle = (Math.random() * Math.PI * 2);
                  let seedDistance =  model.evolution.seedDistance.min + Math.floor(((model.evolution.seedDistance.max - model.evolution.seedDistance.min) * Math.random()) + 0.5);
                  let seedPosInfos = getSeedPositionToOrigine(x.distance,x.angleToOrigine,seedAngle,seedDistance)
                  newPlants.push({
                    birth: worldModel.gardenDay,
                    distance: seedPosInfos.distance,
                    angleToOrigine: seedPosInfos.angleToOrigine,
                    color: x.color,
                    shape: x.shape,
                    size: {... x.size},
                    name : x.name.split("-")[0] + "-" + worldModel.gardenDay + "*" + (n + 1),
                    innerRotation : (Math.random() * 3.14159 * 2),
                    model:x.model,
                    stage: 0
                  });
                }
              }
            }
          }else if(age >= model.evolution.maxAge * 5){
            x.stage++; // giving back to garden :-(
          } 
       }else if(x.stage === 2){// dying
        if (Math.random() > 0.5){
          x.stage++; // to remove on next day
        }
     }
    });
    if(newPlants.length > 0){
      worldModel.data.plants = [... worldModel.data.plants,...newPlants];
    }
    worldModel.data.plants =  worldModel.data.plants.filter((x)=>{
      return x.stage < 4;
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

  function getSeedPositionToOrigine(parentDistance,parentAngleToOrigine,seedAngle,seedDistance){

    let cos = Math.cos(parentAngleToOrigine);
		let sin = -Math.sin(parentAngleToOrigine);

    let parentPosition = {
      x : Math.floor(cos * parentDistance),
      y :  Math.floor(sin * parentDistance)
    }

    cos = Math.cos(seedAngle);
		sin = -Math.sin(seedAngle);
	
	let SeedPosition = {
      x : Math.floor(cos * seedDistance) + parentPosition.x,
      y : Math.floor(sin * seedDistance) + parentPosition.y
  }

  let divider = Math.max(SeedPosition.x,SeedPosition.y);
  if(divider === 0){
    divider = 1;
  }
  let x = SeedPosition.x / divider;
  let y = SeedPosition.y / divider;
    return {
      distance : getDistance({x:0,y:0},SeedPosition),
      angleToOrigine : Math.atan2(y, x)
    }
  }

  function getDistance(ptA,ptB){
    let w = Math.abs(ptA.x - ptB.x);
    let h = Math.abs(ptA.y - ptB.y);
    return Math.sqrt(Math.pow(w + h,2));
  }
  