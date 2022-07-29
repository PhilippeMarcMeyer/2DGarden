const express = require('express');
const bodyParser = require('body-parser')
const app = express()
const port = 8080;
const server = require('http').Server(app)
const io = require('socket.io')(server, { cookie: true })
const cookieParser = require('cookie-parser')
const cookieName = "garden";
const fs = require('fs');

let users = [];
let worldModel = null;
let worldOnHold = false;
let worldLoading = false;
let maxPlantDistance = 1600; 
let autoGardens = [];
let limitingCirles = [];

//const dayLengthNoConnection = 2 * 3600 * 1000; // 2 heures
const dayLengthConnection = 6 * 60 * 1000; // m minutes
const autoGardensTiming = 5000;
let dayLength = dayLengthConnection;
let intervalDays;
let serverLoaded = false;
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(express.json())
app.use(express.static(__dirname));

worldLoading = true;
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
    worldLoading = false;
    if (rawplayers === null || rawplayers === '') {
      usersMemory = {};
    } else {
      usersMemory = JSON.parse(rawplayers);
    }

    limitingCirles = worldModel.data.floor.shapes.filter((x) => {
      return x.type && x.type === "auto-limit";
    });

    limitingCirles.forEach((circle) => {
      if(!circle.position) {
        circle.position = getPosition(circle.distance ,circle.angleToOrigine);
      }
     });

    serverLoaded = true;
    console.log( `World model loaded at ${new Date().toISOString()}`);

   // tidyGarden();

    //autoGardens = manageGardens(worldModel.data.floor.shapes);

    intervalPlayersSaving = setInterval(function(){
      savePlayers();
    },3*60*1000)

    maxPlantDistance = worldModel.radius * 0.7;

    intervalAutoGardens = setInterval(() => {
      if(worldOnHold) return;
        autoGardensManage();
    },autoGardensTiming);

    intervalDays = setInterval(function () {
      worldOnHold = true;
      worldModel.gardenDay++;

      // commanded by the server only
      // check the evolution in the plant models to see if the begin to make seeds and later perish
      // later add bonuses or maluses according to weather, water, soil, animals attack
      // it would mean than a little part of the evolution is set in the plant itself and not in its model
      // some plants could give protection to the ladybug on a radius egal to their size (4 petals clovers !)
      // check if a lady bug is too old, then add 1 to the generation in the players.json aka usersMemory
      checkLakeAndRocks();
      checkGenerations();
      checkPlants();
      saveWorld();
      worldOnHold = false;
      io.emit('info', { what: 'world-day', day: worldModel.gardenDay }); // call also to reload ?
    }, dayLength);
  });
});

function saveWorld() {
  worldLoading = true;
  fs.writeFile("./files/world1.json", JSON.stringify(worldModel, null, 2), err => {
    if (err) {
      console.log("Error writing world file:", err);
    }else{
      worldLoading = false;
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

app.get('/plants', function (req, res) {
  if (serverLoaded) {
    res.status(200).json(worldModel.data.plants);
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
    socket.emit('info',data);
   // p.socket.emit('info', { playerId: idconnected, data: autoGardens, what: "auto-gardens"});
    if(otherPlayers.length > 0){
      data.what = "player-connected";
      // Tell other players, there's a new kid in town !
      otherPlayers.forEach((u) => {
        u.socket.emit('info',data);
      });
      // Tell the new player, other players are already in the game
      otherPlayers.forEach((u) => {
        data = { playerId: u.id, what: "player-connected", name: u.name, color: u.color, position: u.position, rotation: u.rotation ,generation : u.generation ,dotsColor : u.dotsColor,dotsNumber : u.dotsNumber};
        socket.emit('info',data);
        console.log();
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
      }else if(msg.what === 'plant-moved'){
        console.log(msg);
        worldModel.data.plants.forEach((p) => {
          if(p.name === msg.target){
            p.position = msg.position;
            let plantPosInfos = getAngleAndDistance(p.position);
            p.distance = plantPosInfos.distance;
            p.angleToOrigine = plantPosInfos.angleToOrigine;
 
          if(worldOnHold || worldLoading){

            } else {
              worldLoading = true;
              fs.writeFile("./files/world1.json", JSON.stringify(worldModel, null, 2), err => {
                if (err) {
                  console.log("Error writing world file:", err);
                }else{
                  worldLoading = false;
                  users
                  .forEach((u) => {
                    u.socket.emit('info', { what: "plant-moved" });
                  })
                }
              });
            }
          }
        });
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

  function destroy(){
    worldModel.data.plants =  worldModel.data.plants.filter((x)=>{
      let test = Math.random();
      return test < 0.3;
    });
    saveWorld();
  }

  function tidyGarden(){
    console.log('tidy garden');
    worldModel.data.rocks.forEach((rock) => {
      let radius = Math.floor(rock.size);
      console.log(radius);
      worldModel.data.plants = worldModel.data.plants.filter((p) => {
        return getDistance(rock.position, p.position) > radius;
      });
    });

    let findLake = worldModel.data.floor.shapes.filter((x) => {
      return x.name && x.name === "south-lake";
    });
    if (findLake.length === 1) {
      let lakePosition = findLake[0].position;
      let lakeRadius = Math.floor(findLake[0].size[0]);
      console.log(`Lake radius ${lakeRadius}`);
      console.log(worldModel.data.plants.length);

      worldModel.data.plants = worldModel.data.plants.filter((p) => {
        let dist = getDistance(lakePosition, p.position);
        console.log(dist);
        return dist > lakeRadius;
      });
      console.log(worldModel.data.plants.length);

    }
    saveWorld();
  }

  function saveSpecies(){
    worldModel.data.models.forEach((m) => {
      let nr = worldModel.data.plants.filter((p)=>{
        return p.model === m.name;
      }).length;
      if(nr === 0){
        worldModel.data.plants.push( {
          "birth": worldModel.gardenDay,
          "distance": 15 + Math.floor(Math.random() * 40) + Math.floor(Math.random() * 80),
          "angleToOrigine": 0.6472761753028762,
          "color": `${LightenDarkenColor(m.petals.leafModel.color,20)}`,
          "shape": "circle",
          "size": {
            "min": parseInt(Math.floor(m.petals.leafModel.size.min/5)),
            "max": Math.min(parseInt(Math.floor(m.petals.leafModel.size.max/5)),9),
            "growthPerDay": 1
          },
          "name": `${m.name}-${worldModel.gardenDay}*1`,
          "innerRotation": Math.random() * Math.PI * 2,
          "model": `${m.name}`,
          "stage": 0
        })
      }
    });
  }

  function getSeedsChance(modelName){
      let nr = worldModel.data.plants.filter((x)=>{
        return x.model === modelName;
      }).length;

      return Math.max(1 - (nr*0.3),0.1);
  }

  function getModelExpansion(modelName) {
    return worldModel.data.plants.filter((x) => {
      return x.model === modelName;
    }).length;
  }

  function checkPlants(){
    if(worldLoading) return;
    // removing dead plants :-(
    console.log( `Beginning Checking plants at ${new Date().toISOString()}`);

    console.log("plants before : " + worldModel.data.plants.length);

   // First limits ; the number of plants is limited inside every cirlcle

    limitingCirles.forEach((circle) => {
      circle.currentNr = 0;
     });

    worldModel.data.plants.forEach((p) => {
      for(let i = 0; i < limitingCirles.length;i++){
        p.parentCircle = null;
        if(getDistance(limitingCirles[i].position,p.position < limitingCirles[i].size[0])){
          p.parentCircle = limitingCirles[i].name;
          limitingCirles[i].currentNr ++;
          break;
        }
      }
    });

    worldModel.data.plants.forEach((p) => {
      if(p.parentCircle === null && p.distance >= maxPlantDistance){
        p.distance = Math.floor(Math.random() * maxPlantDistance);
        p.position = getPosition(p.distance ,p.angleToOrigine);
      }
    });

    let maxPlants = 25; // Plants outside circles

    limitingCirles.forEach((circle) => {
        maxPlants += circle.maxPlants;
        if(circle.currentNr > circle.maxPlants){
          worldModel.data.plants =  worldModel.data.plants.filter((p)=>{
            let test = Math.random();
            return (test < 0.9 && p.parentCircle === circle.name) || x.parentCircle !== circle.name;
          });
        }
     });

     console.log(`plants after circles check : ${worldModel.data.plants.length} / ${maxPlants} `);

    // seconde limit : population as a whole
     let currentPopulation = worldModel.data.plants.length;
     let isPopulationLow =  currentPopulation <= 40;
     let isPopulationHigh = currentPopulation > maxPlants;
    // too many : get rid of the seeds but on species with high population
    if(isPopulationHigh){
      let plantsSpeciesStatus = worldModel.data.models.map((x)=>{
        return {model:x.name,population:0};
      });
      plantsSpeciesStatus.forEach((x) => {
        x.population = getModelExpansion(x.model);
      });
      plantsSpeciesStatus.sort((a,b)=>{
          return b.population - a.population;
      });
      worldModel.data.plants =  worldModel.data.plants.filter((x)=>{
        let test = Math.random();
        return (test < 0.7 && x.model === plantsSpeciesStatus[0].model) || x.model !== plantsSpeciesStatus[0].model;
      });
      let plants2stop = worldModel.data.plants.length - maxPlants
      if(plants2stop > 0){
        worldModel.data.plants =  worldModel.data.plants.filter((x)=>{
          let test = Math.random();
          return (test < 0.8 && x.model === plantsSpeciesStatus[1].model) || x.model !== plantsSpeciesStatus[1].model;
        });
      }
      plants2stop = worldModel.data.plants.length - maxPlants
      if(plants2stop > 0){
        worldModel.data.plants =  worldModel.data.plants.filter((x)=>{
          let test = Math.random();
          return (test < 0.9 && x.model === plantsSpeciesStatus[2].model) || x.model !== plantsSpeciesStatus[2].model;
        });
      }
    }

    console.log(`plants after general population check : ${worldModel.data.plants.length} / ${maxPlants} `);

    let newPlants = [];
     worldModel.data.plants.forEach((x)=>{
      if(!x.position){
        x.position = getPosition(x.distance,x.angleToOrigine);
      }
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
            if (Math.random() <= getSeedsChance(x.model)){
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
                  let newPt = getPosition(seedDistance,seedAngle);
                  newPt.x += x.position.x;
                  newPt.y += x.position.y;
                  let seedPosInfos = getAngleAndDistance(newPt);
                  /*
                  if(seedPosInfos.distance > maxPlantDistance){
                    seedPosInfos.distance = Math.floor(Math.random() * maxPlantDistance);
                    newPt = getPosition(seedPosInfos.distance ,seedPosInfos.angleToOrigine);
                  }
                  */
                  newPlants.push({
                    birth: worldModel.gardenDay,
                    distance: seedPosInfos.distance,
                    angleToOrigine: seedPosInfos.angleToOrigine,
                    position : newPt,
                    color: x.color,
                    shape: x.shape,
                    size: {... x.size},
                    name : x.name.split("-")[0] + "-" + worldModel.gardenDay + "*" + (n + 1),
                    innerRotation : (Math.random() * Math.PI * 2),
                    model:x.model,
                    stage: 0
                  });
                }
              }
            }
          }
          if(age >= model.evolution.maxAge ){
            x.stage++; // giving back to garden :-(
          } 
       }
       if(x.stage >= 2 && !isPopulationLow){// dying
        if (Math.random() > 0.5){
          x.stage++; // to remove on next day
        }
     }
    });
    
    let beforeNr = worldModel.data.plants.length;
    if(!isPopulationLow){
      worldModel.data.plants =  worldModel.data.plants.filter((x)=>{
        return x.stage < 4;
      });
    }

    let afterNr = worldModel.data.plants.length;

    console.log(`Removing ${beforeNr - afterNr} old plants from the garden...`);

    if(newPlants.length > 0){
      let seedsBefore = newPlants.length;
      let findLake = worldModel.data.floor.shapes.filter((x)=>{
          return x.name && x.name === "south-lake";
      });
      if(findLake.length === 1){
        let lakePosition = findLake[0].position;
        let lakeRadius = Math.floor(findLake[0].size[0]);
        newPlants = newPlants.filter((seed) => {
            return getDistance(lakePosition,seed.position) > lakeRadius;
        });
        let seedsAfter = newPlants.length;
        console.log(`${seedsBefore - seedsAfter} seed(s) have fallen into the lake...`);
      }
    }

    if (newPlants.length > 0) {
      let seedsBefore = newPlants.length;
      worldModel.data.rocks.forEach((rock) => {
        let radius = Math.floor(rock.size) ;
        newPlants = newPlants.filter((seed) => {
          return getDistance(rock.position, seed.position) > radius;
        });
      });

      let seedsAfter = newPlants.length;
      console.log(`${seedsBefore - seedsAfter} seed(s) have fallen onto a rock...`);
    }

    console.log(`Adding ${newPlants.length} seeds to the garden...`);

    if(newPlants.length > 0){
      worldModel.data.plants = [... worldModel.data.plants,...newPlants];
    }
    
    let criticalDistance = 60;
    let criticalAge = 15;

    let youngPlants = worldModel.data.plants.filter((x)=>{
      return x.stage === 1 && (worldModel.gardenDay - x.birth <= criticalAge);
    });

    console.log(`Checking ${youngPlants.length} new growing plants vicinity for vital space...`);

    if (youngPlants.length > 0) {
      let notGrowingNr = 0;
    
      worldModel.data.plants = worldModel.data.plants.filter((x) => {
        return x.stage !== 1 || (worldModel.gardenDay - x.birth > criticalAge);
      });
      youngPlants.forEach((youth) => {
        let oldPlantsInVicinity = worldModel.data.plants.filter((oldOne) => {
          return (Math.abs(youth.position.x - oldOne.position.x) <= criticalDistance) || (Math.abs(youth.position.y - oldOne.position.y) <= criticalDistance)
        });
        if (oldPlantsInVicinity.length > 0) {
          oldPlantsInVicinity = oldPlantsInVicinity.filter((oldOne) => {
            return (getDistance(youth.position, oldOne.position) <= criticalDistance);
          });
        }
        if (oldPlantsInVicinity.length > 0){
          youth.stage = 4;
          notGrowingNr++;
        }
      });
      // get survivors
      youngPlants =  youngPlants.filter((x)=>{
        return x.stage === 1;
      });
      console.log(`Removing ${notGrowingNr} young plants from the garden...`);

      if (youngPlants.length > 0) {
        worldModel.data.plants = [...worldModel.data.plants,...youngPlants];
      }
    }
    worldModel.data.plants =  worldModel.data.plants.filter((x)=>{
      return x.distance < 0.9 * worldModel.radius;
    });

    let beforeSaveSpecies = worldModel.data.plants.length;

    console.log(`plants after : ${beforeSaveSpecies}`);
   saveSpecies();
    let afterSaveSpecies = worldModel.data.plants.length;
    let savedSpecies = afterSaveSpecies - beforeSaveSpecies;
    if(savedSpecies > 0){
      console.log(`Saved species : ${savedSpecies}`);
    }
    console.log( `Stop Checking plants at ${new Date().toISOString()}`);
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

  function getDistance(ptA, ptB) {
    return Math.sqrt(Math.pow(ptB.x - ptA.x, 2) + Math.pow(ptB.y - ptA.y, 2));
  }

  function getAngleAndDistance(pt) {
    return {
      distance: getDistance(pt, {
        x: 0,
        y: 0
      }),
      angleToOrigine: Math.atan2(pt.y, pt.x)
    }
  }

  function getPosition(distance, angleToOrigine) {
    let cos = Math.cos(angleToOrigine);
    let sin = -Math.sin(angleToOrigine);
    return {
      x: Math.floor(cos * distance),
      y: Math.floor(sin * distance)
    }
  }

  function checkLakeAndRocks(){
    worldModel.data.floor.shapes.forEach((x)=>{
      if(!x.position){
        x.position = getPosition(x.distance,x.angleToOrigine);
      }
    });

    worldModel.data.rocks.forEach((x)=>{
      if(!x.position){
        x.position = getPosition(x.distance,x.angleToOrigine);
      }
    });
  }

  //Chris Coyier 
function LightenDarkenColor(col, amt) {
  
  var usePound = false;

  if (col[0] == "#") {
      col = col.slice(1);
      usePound = true;
  }

  var num = parseInt(col,16);

  var r = (num >> 16) + amt;

  if (r > 255) r = 255;
  else if  (r < 0) r = 0;

  var b = ((num >> 8) & 0x00FF) + amt;

  if (b > 255) b = 255;
  else if  (b < 0) b = 0;

  var g = (num & 0x0000FF) + amt;

  if (g > 255) g = 255;
  else if (g < 0) g = 0;

  return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
}

// -- agents
function manageGardens (floorZones){
  let gardenZones = floorZones.filter((floorZone) => {
       return floorZone.specific && floorZone.specific === "auto-garden";
  });

  let gardenManagers = [];

   gardenZones.forEach(zone => {
       gardenManagers.push(new gardenFactory(zone))
   });
   return gardenManagers;
}

function gardenFactory(zone) {
  this.name = zone.name;
  this.circlesOfPlants = zone.circlesOfPlants;
  this.workerOuterSize = zone.workerOuterSize;
  this.workerInnerSize = zone.workerInnerSize;
  this.position = { ...zone.position };
  this.radius = zone.size[0];
  this.workers = [];
  this.nrWorkers = zone.nrWorkers ?? Math.floor(Math.cbrt(this.zone.size[0]) + 0.5);
  this.buildingInfos = {
    width: this.workerOuterSize * this.nrWorkers,
    height: this.workerOuterSize,
    topLeft: {
      x: this.position.x - Math.floor((this.workerOuterSize * this.nrWorkers) / 2),
      y: this.position.y + this.radius + 10
    },
    boxes: this.nrWorkers,
    orientation: zone.orientation ?? toradians(90)
  };
  let data = { ...this };
  for (let i = 0; i < this.nrWorkers; i++) {
    let workerPosition = {... this.buildingInfos.topLeft};
    workerPosition.x += (this.workerOuterSize * i);
    let worker = new gardenWorker(data, i + 1, workerPosition);
    this.workers.push(worker);
  }
}

function autoGardensManage(){
  autoGardens.forEach((garden) => {
    garden.workers.forEach((worker, index) => {
        if((worker.action.status === "powering" && worker.battery.current === worker.battery.capacity) || worker.action.status === "idle" ){
          worker.action.status = "active";
          worker.action.missionType = "cleaning";
          worker.action.objectiveType = "objectiveType";
          worker.action.objective = "active";

        }
    });
  });
}

function gardenWorker(data, index, pos) {
  this.outerSize = data.workerOuterSize;
  this.innerSize = data.workerInnerSize;
  this.model = 'gardener';
  this.rank = index;
  this.autoGarden = data.name;
  this.name = `Worker ${index}`;
  this.refillPosition = { ...pos };
  let multiplier = this.innerSize * 0.6;

  this.refillPosition.y += multiplier + 2;
  this.refillPosition.x += this.outerSize / 2;
  this.refillPosition.x = Math.floor(this.refillPosition.x);
  this.refillPosition.y = Math.floor(this.refillPosition.y); 
  this.currentPosition = { ...this.refillPosition };
  this.refillOrientation = toradians(270);
  this.currentOrientation = this.refillOrientation;
  this.speed = 50; // millisec per pixel
  this.spots = [null, null, null, null, null]; // "pockets" to carry seeds
  this.battery = { capacity: 200, current: 200, costPer100Pixels: 1, chargingTimePerUnit: 5000 };
  this.pixelsSpent = 0;
  this.action = {
    status : "powering",
    missionType : null,
    objective : null,
    objectiveType : null
  }
}

function toradians(degrees) {
	return degrees * Math.PI / 180;
}