const express = require('express');
const bodyParser = require('body-parser')
const app = express()
const port = 8080;
const server = require('http').Server(app)
const io = require('socket.io')(server, {
  cookie: true
})
const cookieParser = require('cookie-parser')
const cookieName = "garden";
const fs = require('fs');
/* const { createCanvas } = require('canvas')

const width = 600
const height = 600

const canvas = createCanvas(width, height)
const context = canvas.getContext('2d') */

let users = [];
let worldModel = null;
let worldOnHold = false;
let worldLoading = false;
let maxPlantDistance = 1600;
let limitingCirles = [];
let evolutionChance = 0.1;

//const dayLengthNoConnection = 2 * 3600 * 1000; // 2 heures
const dayLengthConnection = 3 * 60 * 1000; // m minutes
let dayLength = dayLengthConnection;
let serverLoaded = false;
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(cookieParser())
app.use(express.json())
app.use(express.static(__dirname));

worldLoading = true;

const worldFileName = 'tinyIsland.json';

loadFile(worldFileName)
  .then(function (data) {
    if (data && "error" in data) {
      console.log(`${data.filename} could not be loaded due to error ${data.error}.`);
    } else {
      worldModel = {
        ...data
      };
      loadFile(worldModel.plantsFile)
        .then(function (plants) {
          if (plants && "error" in plants) {
            console.log(`${plants.filename} could not be loaded due to error ${plants.error}.`);
          } else {
            if (plants === null) {
              worldModel.data.plants = [];
            } else {
              worldModel.data.plants = [...plants];
            }
            loadFile('players.json')
              .then(function (players) {
                if (players && "error" in players) {
                  console.log(`${players.filename} could not be loaded due to error ${players.error}.`);
                } else {
                  if (players === null) {
                    usersMemory = {};
                  } else {
                    usersMemory = {
                      ...players
                    };
                  }
                  worldLoading = false;
                  limitingCirles = worldModel.data.floor.shapes.filter((x) => {
                    return x.type && x.type === "auto-limit";
                  });

                  limitingCirles.forEach((circle) => {
                    if (!circle.position) {
                      circle.position = getPosition(circle.distance, circle.angleToOrigine);
                    }
                  });

                  serverLoaded = true;

                  console.log(`World model loaded at ${new Date().toISOString()}`);

                  intervalPlayersSaving = setInterval(function () {
                    savePlayers();
                  }, 3 * 60 * 1000)

                  maxPlantDistance = worldModel.radius * 1;
                  intervalDays = setInterval(function () {
                    worldOnHold = true;
                    worldModel.gardenDay++;
                    checkLakeAndRocks();
                    checkGenerations();
                    checkPlants();
                    savePlants();
                    saveWorld();
                    io.emit('info', {
                      what: 'world-day',
                      day: worldModel.gardenDay
                    }); // call also to reload ?
                  }, dayLength);
                }
              })
          }
        })
    }
  })

function loadFile(filename) {
  return new Promise(function (resolve, reject) {
    fs.readFile(`./files/${filename}`, "utf8", (err, fileContent) => {
      if (err) {
        reject({
          "filename": filename,
          "error": err
        });
      } else {
        try {
          if (fileContent === '') {
            resolve(null);
          } else {
            let data = JSON.parse(fileContent);
            resolve(data);
          }
        } catch (e) {
          reject({
            "filename": filename,
            "error": "invalid json"
          });
        }
      }
    });
  });
}

function savePlants(callback) {
  let plants = null;

  if (worldModel.data.plants) {
    try {
      plants = JSON.stringify(worldModel.data.plants, null, 2);
    } catch (e) {
      console.error(e);
    }
  }

  if (!plants) {
    return;
  }

  worldLoading = true;

  fs.writeFile(`./files/${worldModel.plantsFile}`, "", err => {
    if (err) {
      console.log("Error emptying plants file:", err);
    }
    fs.writeFile(`./files/${worldModel.plantsFile}`, plants, err => {
      if (err) {
        console.log("Error writing plants file:", err);
      } else {
        worldLoading = false;
        worldOnHold = false;
        if (callback) callback();
      }
    });
  });
}

function saveWorld(callback) {
  // todo : put changing dara like fardenDay in a separate file
  // Give the data complete to the front which should not load data directly
  worldLoading = true;
  let model = JSON.parse(JSON.stringify(worldModel));
  if (model.data.plants) model.data.plants = [];
  try {
    modelJson = JSON.stringify(model, null, 2);
  } catch (e) {
    console.error(e);
  }

  if (!modelJson) return;

  fs.writeFile(`./files/${worldFileName}`, "", err => {
    if (err) {
      console.log("Error emptying world file:", err);
    }
    fs.writeFile(`./files/${worldFileName}`, modelJson, err => {
      if (err) {
        console.log("Error writing world file:", err);
      } else {
        worldLoading = false;
        worldOnHold = false;
        if (callback) callback();
      }
    });
  });
}

app.get('/', function (req, res) {
  if (serverLoaded) {
    res.sendFile('index.html', {
      root: __dirname
    });
  } else {
    res.status(202).json({
      "error": "Server is still loading ! Try later"
    });
  }
});

app.get('/plants', function (req, res) {
  if (serverLoaded) {
    if (arePlantsReady()) {
      res.status(200).json(worldModel.data.plants);
    }
  } else {
    res.status(202).json({
      "error": "Server is still loading ! Try later"
    });
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
      u.position = identity.position ? identity.position : {
        x: 0,
        y: 0
      };
      u.rotation = identity.rotation ? identity.rotation : 0;
      u.generation = identity.generation || 1;
      u.dotsColor = identity.dotsColor || '#000000';
      u.dotsNumber = identity.dotsNumber || 3;
    }
  });

  if (!found) {
    users.push({
      name: identity.name,
      color: identity.color,
      id: idconnected,
      socket: socket,
      position: identity.position ? identity.position : {
        x: 0,
        y: 0
      },
      rotation: identity.rotation ? identity.rotation : 0,
      generation: identity.generation || 1,
        dotsColor : identity.dotsColor || '#000000',
        dotsNumber : identity.dotsNumber || 3
    });
  }

  let newPlayer = users.filter((u) => {
    return idconnected === u.id;
  });

  let otherPlayers = users.filter((u) => {
    return idconnected !== u.id;
  });

  if (newPlayer.length === 1) {
    p = newPlayer[0];
    // tell client's new player about it's player identity and show it
    console.log('player-identity')
    let data = {
      playerId: idconnected,
      what: "player-identity",
      name: p.name,
      color: p.color,
      position: p.position,
      rotation: p.rotation,
      generation: p.generation,
      dotsColor: p.dotsColor,
      dotsNumber: p.dotsNumber
    };
    socket.emit('info', data);
    if (otherPlayers.length > 0) {
      data.what = "player-connected";
      // Tell other players, there's a new kid in town !
      otherPlayers.forEach((u) => {
        u.socket.emit('info', data);
      });
      // Tell the new player, other players are already in the game
      otherPlayers.forEach((u) => {
        data = {
          playerId: u.id,
          what: "player-connected",
          name: u.name,
          color: u.color,
          position: u.position,
          rotation: u.rotation,
          generation: u.generation,
          dotsColor: u.dotsColor,
          dotsNumber: u.dotsNumber
        };
        socket.emit('info', data);
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
          u.socket.emit('info', {
            playerId: idDisconnected,
            name: u.name,
            what: "player-disconnected"
          });
        })
    }, 1500)
  });

  socket.on('info', (msg) => {
    if (msg.what === 'ping') {
      socket.emit('info', {
        what: "pong"
      });
    } else if (msg.what === 'player-moved') {
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
            u.socket.emit('info', {
              position: msg.position,
              rotation: msg.rotation,
              target: msg.target,
              what: "target-shake"
            });
          }
        })
    } else if (msg.what === 'plant-moved') {
      console.log(msg);
      if (arePlantsReady()) {
        worldModel.data.plants.forEach((p) => {
          if (p.name === msg.target) {
            p.position = msg.position;
            let plantPosInfos = getAngleAndDistance(p.position);
            p.distance = plantPosInfos.distance;
            p.angleToOrigine = plantPosInfos.angleToOrigine;
            p.parentCircle = null;
            p.isOnRock = false;
            p.rockHouse = "";
            worldModel.data.rocks.forEach((rock) => {
              if (!p.isOnRock && pointIsInsidePoly(p.position, rock.position, rock.size)) {
                p.isOnRock = true;
                p.rockHouse = rock.name;
              }
            });
            if (worldOnHold || worldLoading) {
              // toDo : keep it for moving later
            } else {
              worldLoading = true;
              savePlants(function () {
                users
                  .forEach((u) => {
                    u.socket.emit('info', {
                      what: "plant-moved"
                    });
                  })
              });
            }
          }
        });
      } else {
        console.log("plants are not ready !");
      }
    }
  });
})

server.listen(port, () => {
  console.log(`2DGarden listening on port ${port}`)
});

function getIdentity(cookiesString) {
  let cookiesList = cookiesString ? cookiesString.split(';') : [];
  let identities = [{
      "name": "Elrond",
      "color": "#FF0000",
      "dotsColor": "#000000",
      "dotsNumber": 3,
      "birth": null,
      "maxAge": 450,
      "generation": 1
    },
    {
      "name": "Boromir",
      "color": "#DDDD00",
      "dotsColor": "#000000",
      "dotsNumber": 3,
      "birth": null,
      "maxAge": 450,
      "generation": 1
    },
    {
      "name": "Frodo",
      "color": "#0000AD",
      "dotsColor": "#000000",
      "dotsNumber": 3,
      "birth": null,
      "maxAge": 450,
      "generation": 1
    },
    {
      "name": "Sam",
      "color": "#FF4500",
      "dotsColor": "#000000",
      "dotsNumber": 3,
      "birth": null,
      "maxAge": 450,
      "generation": 1
    },
    {
      "name": "Aragorn",
      "color": "#00ADAD",
      "dotsColor": "#000000",
      "dotsNumber": 3,
      "birth": null,
      "maxAge": 450,
      "generation": 1
    },
    {
      "name": "Galadriel",
      "color": "#AD00AD",
      "dotsColor": "#000000",
      "dotsNumber": 3,
      "birth": null,
      "maxAge": 450,
      "generation": 1
    },
    {
      "name": "Gimli",
      "color": "#582900",
      "dotsColor": "#000000",
      "dotsNumber": 3,
      "birth": null,
      "maxAge": 450,
      "generation": 1
    },
    {
      "name": "Isildur",
      "color": "#FFCC00",
      "dotsColor": "#000000",
      "dotsNumber": 3,
      "birth": null,
      "maxAge": 450,
      "generation": 1
    },
    {
      "name": "Legolas",
      "color": "#F0E0D0",
      "dotsColor": "#000000",
      "dotsNumber": 3,
      "birth": null,
      "maxAge": 450,
      "generation": 1
    },
    {
      "name": "Tom Bombadil",
      "color": "#33FFCC",
      "dotsColor": "#000000",
      "dotsNumber": 3,
      "birth": null,
      "maxAge": 450,
      "generation": 1
    },
    {
      "name": "Meriadoc",
      "color": "#CC6600",
      "dotsColor": "#000000",
      "dotsNumber": 3,
      "birth": null,
      "maxAge": 450,
      "generation": 1
    },
    {
      "name": "Peregrin",
      "color": "#CC0066",
      "dotsColor": "#000000",
      "dotsNumber": 3,
      "birth": null,
      "maxAge": 450,
      "generation": 1
    }
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
            if (identity.forceByCookie) {
              identity.color = identity.color || usersMemory[identity.name].color;
              identity.dotsColor = identity.dotsColor || usersMemory[identity.name].dotsColor;
              identity.dotsNumber = identity.dotsNumber || usersMemory[identity.name].dotsNumber;
              identity.birth = identity.birth || usersMemory[identity.name].birth;
              identity.maxAge = identity.maxAge || usersMemory[identity.name].maxAge;
              identity.generation = identity.generation || usersMemory[identity.name].generation;
            } else {
              // take the informations from the server
              identity.color = usersMemory[identity.name].color;
              identity.dotsColor = usersMemory[identity.name].dotsColor;
              identity.dotsNumber = usersMemory[identity.name].dotsNumber;
              identity.birth = usersMemory[identity.name].birth;
              identity.maxAge = usersMemory[identity.name].maxAge;
              identity.generation = usersMemory[identity.name].generation;
            }
          }
        } else {
          console.log("bug : " + identity.name + "is already connected !")
        }
      }
    }
  }

  if (!hasIdentity) {
    let givenNames = [];
    users.forEach((x) => {
      givenNames.push(x.name);
    });

    let availableIdentities = identities.filter((x) => {
      return givenNames.indexOf(x.name) === -1;
    })
    identity = availableIdentities.length > 0 ? availableIdentities[0] : {
      "name": "nobody",
      "color": "#cccccc",
      "dotsColor": "#000000",
      "dotsNumber": 3,
      "birth": null,
      "maxAge": 450,
      "generation": 1
    };
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
  let usersDict = {
    ...usersMemory
  };
  usersCopy.forEach((u) => {
    usersDict[u.name] = {
      position: u.position || {
        x: 0,
        y: 0
      },
      rotation: u.rotation || 0,
      color: u.color,
      birth: u.birth || worldModel.gardenDay,
      dotsNumber: u.dotsNumber || 3,
      dotsColor: u.dotsColor || "#000000",
      maxAge: u.maxAge || 450,
      generation: u.generation || 1
    }
  });
  usersMemory = {
    ...usersDict
  };
  fs.writeFile("./files/players.json", JSON.stringify(usersDict, null, 2), err => {
    if (err) {
      console.log("Error writing users file:", err);
    }
  });
}

function destroy() {
  if (!arePlantsReady()) return;
  worldModel.data.plants = worldModel.data.plants.filter((x) => {
    let test = Math.random();
    return test < 0.3;
  });
  savePlants();
}

function deduplicateGarden() {
  if (!arePlantsReady()) return;
  let duplicateNr = 0;
  worldModel.data.plants.sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  });
  let previous = "azertyuiop";
  worldModel.data.plants.forEach((x) => {
    if (x.name === previous) {
      x.name = "toDelete";
      duplicateNr++;
    } else {
      previous = x.name;
    }
  });
  if (duplicateNr > 0) {
    worldModel.data.plants = worldModel.data.plants.filter((x) => {
      return x.name !== "toDelete";
    });
    savePlants();
  }
}

function saveSpecies() {
  if (!arePlantsReady()) return;
  let savedNames = [];
  worldModel.data.models.forEach((m) => {
    let nr = worldModel.data.plants.filter((p) => {
      return p.model === m.name;
    }).length;
    if (nr === 0) {
      worldModel.data.plants.push({
        "birth": worldModel.gardenDay,
        "distance": 15 + Math.floor(Math.random() * 40) + Math.floor(Math.random() * 80),
        "angleToOrigine": 0.6472761753028762,
        "color": `${LightenDarkenColor(m.petals.leafModel.color,20)}`,
        "shape": "circle",
        "size": {
          "min": m.heartLess ? 0 : parseInt(Math.floor(m.petals.leafModel.size.min / 5)),
          "max": m.heartLess ? 0 : Math.min(parseInt(Math.floor(m.petals.leafModel.size.max / 5)), 9),
          "growthPerDay": m.heartLess ? 0 : 1
        },
        "name": `${m.name}-${worldModel.gardenDay}*1`,
        "innerRotation": Math.random() * Math.PI * 2,
        "model": `${m.name}`,
        "stage": 0
      })
      savedNames.push(m.name);
    }
  });
  return savedNames;
}

function getSeedsChance(modelName) {
  if (!arePlantsReady()) return;
  let nr = worldModel.data.plants.filter((x) => {
    return x.model === modelName;
  }).length;

  return Math.max(1 - (nr * 0.3), 0.1);
}

function getModelExpansion(modelName) {
  if (!arePlantsReady()) return;
  return worldModel.data.plants.filter((x) => {
    return x.model === modelName;
  }).length;
}

function checkPlants() {

  if (worldLoading) return;

  if (!arePlantsReady()) return;

  deduplicateGarden();

  // removing dead plants :-(
  console.log(`Beginning Checking plants at ${new Date().toISOString()}`);

  console.log("plants before : " + worldModel.data.plants.length);

  // First limits ; the number of plants is limited inside every cirlcle

  let seedAllowed = {};

  limitingCirles.forEach((circle) => {
    circle.currentNr = 0;
    seedAllowed[circle.name] = 0;
  });
  seedAllowed.outSideCircles = 0;

  let currentNrOutOfCircles = 0;

  worldModel.data.plants.forEach((p) => {
    if (!p.position) {
      p.position = getPosition(p.distance, p.angleToOrigine);
    }
    let found = false;
    for (let i = 0; i < limitingCirles.length; i++) {
      if (p.parentCircle) {
        if (p.parentCircle === limitingCirles[i].name) {
          limitingCirles[i].currentNr++;
          found = true;
          break;
        }
      } else {
        if (getDistance(limitingCirles[i].position, p.position, limitingCirles[i].name) < limitingCirles[i].size[0]) {
          p.parentCircle = limitingCirles[i].name;
          limitingCirles[i].currentNr++;
          found = true;
          break;
        }
      }
    }
    if (!found) currentNrOutOfCircles++;
  });

  let maxPlantsOutsideCircles = 25; // Plants outside circles
  let maxPlants = maxPlantsOutsideCircles;

  limitingCirles.forEach((circle) => {
    maxPlants += circle.maxPlants;
    console.log(`plants in circle ${circle.name} : ${circle.currentNr} / ${circle.maxPlants} `);
    seedAllowed[circle.name] = Math.max(0, circle.maxPlants - circle.currentNr);
  });

  console.log(`plants outside circles : ${currentNrOutOfCircles} / ${maxPlantsOutsideCircles} `);

  if (currentNrOutOfCircles > maxPlantsOutsideCircles) {
    let totalPlantsBefore = worldModel.data.plants.length;
    let ratio = maxPlantsOutsideCircles / currentNrOutOfCircles;
    worldModel.data.plants = worldModel.data.plants.filter((p) => {
      let test = Math.random();
      return (test <= ratio && p.parentCircle == null) || p.parentCircle != null;
    });
    let totalPlantsAfter = worldModel.data.plants.length;
    currentNrOutOfCircles -= (totalPlantsBefore - totalPlantsAfter);
  }
  console.log(`plants outside circles after houswork : ${currentNrOutOfCircles} / ${maxPlantsOutsideCircles} `);

  seedAllowed.outSideCircles = Math.max(0, maxPlantsOutsideCircles - currentNrOutOfCircles);

  console.log(`Plants total check : ${worldModel.data.plants.length} / ${maxPlants} `);

  let currentPopulation = worldModel.data.plants.length;
  let isPopulationLow = currentPopulation <= 40;

  let newPlants = [];
  worldModel.data.plants.forEach((x) => {
    let model;
    if (x.model) {
      model = worldModel.data.models.filter((y) => {
        return y.name === x.model;
      })[0];
    } else {
      console.log("not implemented yet");
    }
    let age = worldModel.gardenDay - x.birth + 1;
    console.log(x.name + " age : " + age);

    if (x.stage === 0) { // seed
      age += model.evolution.seedCountDown;
      if (age >= 1) {
        x.stage++; // flower
        x.birth = worldModel.gardenDay - 1;
      }
    } else if (x.stage >= 1) { // flower
      if (age >= model.evolution.seedsDay) {
        if (Math.random() <= getSeedsChance(x.model)) {
          console.log("seeds ?")
          let parentCircle = x.parentCircle || "outSideCircles";
          seedsNr = Math.min(seedAllowed[parentCircle], Math.floor(((model.evolution.seeds.max - model.evolution.seeds.min) * Math.random()) + 0.5) + model.evolution.seeds.min);
          console.log("seedsNr " + seedsNr)
          let n = 0
          while (n < seedsNr) {
            n++;
            if (Math.random() <= model.evolution.seedSuccesRate) {
              let seedAngle = (Math.random() * Math.PI * 2);
              let seedDistance = model.evolution.seedDistance.min + Math.floor(((model.evolution.seedDistance.max - model.evolution.seedDistance.min) * Math.random()) + 0.5);
              let newPt = getPosition(seedDistance, seedAngle);
              newPt.x += x.position.x;
              newPt.y += x.position.y;
              let seedPosInfos = getAngleAndDistance(newPt);
              let seed = {
                birth: worldModel.gardenDay,
                distance: seedPosInfos.distance,
                angleToOrigine: seedPosInfos.angleToOrigine,
                position: newPt,
                color: x.color,
                shape: x.shape,
                size: {
                  ...x.size
                },
                name: x.name.split("-")[0] + "-" + worldModel.gardenDay + "*" + (n + 1),
                innerRotation: (Math.random() * Math.PI * 2),
                model: x.model,
                stage: 0
              }
              if (model.heartLess && seed.size.min != 0) {
                seed.size = {
                  min: 0,
                  max: 0,
                  growthPerDay: 0
                }
              }
              if (Math.random() <= model.evolution.seedSuccesRate) {
                seed.evolution = {};
                if (x.evolution) {
                  seed.evolution.colors = [...x.evolution.colors];
                } else if (model.petals && model.petals.shape === "polygons-with-colors") {
                  seed.evolution.colors = [...model.petals.leafModel.colors];
                }
                if (seed.evolution.colors) {
                  let darker = Math.random() < 0.5;
                  let amount = darker ? -20 : 20;
                  seed.evolution.colors.forEach((c) => {
                    c = LightenDarkenColor(c, amount);
                  });
                }
              }
              newPlants.push(seed);
            }
          }
        }
      }
      if (age >= model.evolution.maxAge) {
        x.stage++; // giving back to garden :-(
      }
    }
    if (x.stage >= 2 && !isPopulationLow) { // dying
      if (Math.random() > 0.5) {
        x.stage++; // to remove on next day
      }
    }
  });

  let beforeNr = worldModel.data.plants.length;
  if (!isPopulationLow) {
    worldModel.data.plants = worldModel.data.plants.filter((x) => {
      return x.stage < 4;
    });
  }

  let afterNr = worldModel.data.plants.length;

  console.log(`Removing ${beforeNr - afterNr} old plants from the garden...`);

  if (newPlants.length > 0) {
    let seedsBefore = newPlants.length;
    let findLake = worldModel.data.floor.shapes.filter((x) => {
      return x.name && x.name === "south-lake";
    });
    if (findLake.length === 1) {
      let lakePosition = findLake[0].position;
      let lakeRadius = Math.floor(findLake[0].size[0]);
      newPlants = newPlants.filter((seed) => {
        return getDistance(lakePosition, seed.position) > lakeRadius;
      });
      let seedsAfter = newPlants.length;
      console.log(`${seedsBefore - seedsAfter} seed(s) have fallen into the lake...`);
    }
  }

  console.log(`Adding ${newPlants.length} seeds to the garden...`);

  if (newPlants.length > 0) {
    newPlants.forEach((p) => {
      p.isOnRock = false;
      p.rockHouse = "";
      worldModel.data.rocks.forEach((rock) => {
        if (!p.isOnRock && pointIsInsidePoly(p.position, rock.position, rock.size)) {
          p.isOnRock = true;
          p.rockHouse = rock.name;
        }
      });
    });
  }

  if (newPlants.length > 0) {
    worldModel.data.plants = [...worldModel.data.plants, ...newPlants];
  }

  let criticalDistance = 60;
  let criticalAge = 1;

  let youngPlants = worldModel.data.plants.filter((x) => {
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
      if (oldPlantsInVicinity.length > 0) {
        youth.stage = 4;
        notGrowingNr++;
      }
    });
    // get survivors
    youngPlants = youngPlants.filter((x) => {
      return x.stage === 1;
    });
    console.log(`Removing ${notGrowingNr} young plants from the garden...`);

    if (youngPlants.length > 0) {
      worldModel.data.plants = [...worldModel.data.plants, ...youngPlants];
    }
  }
  worldModel.data.plants = worldModel.data.plants.filter((x) => {
    return x.distance < 0.9 * worldModel.radius;
  });


  let savedSpeciesList = saveSpecies();

  if (savedSpeciesList.length > 0) {
    console.log(`${savedSpeciesList.length} saved specie(s) : ${savedSpeciesList.join(',')}`);
  }
  console.log(`Stop Checking plants at ${new Date().toISOString()}`);
}

function checkGenerations() {
  for (const bug in usersMemory) {
    let bugAge = worldModel.gardenDay - bug.birth;
    if (bugAge > bug.maxAge) {
      if (Math.random() <= 0.5) {
        bug.maxAge += 5;
      } else {
        bug.generation++;
        bug.birth = worldModel.gardenDay;
        if (Math.random() <= 0.2) {
          bug.dotsNumber += 1;
          if (bug.dotsNumber > 7) {
            bug.dotsNumber = 7;
          }
        }
        if (Math.random() <= 0.5) {
          bug.color = shuffleColor(bug.color, 10);
        }
      }
    }
  }
}

function shuffleColor(hexaColor, amount) {
  if (!hexaColor) {
    return hexaColor;
  }
  if (hexaColor.substring(0, 1) != "#") {
    return hexaColor;
  }
  let r = parseInt(hexaColor.substring(1, 3), 16);
  let g = parseInt(hexaColor.substring(3, 5), 16);
  let b = parseInt(hexaColor.substring(5, 7), 16);

  let whatColor = Math.random();
  let upOrDown = Math.random() <= 0.5 ? 1 : -1;
  if (whatColor <= 0.5) {
    r += (amount * upOrDown);
    if (r > 255) r = 255;
    if (r < 0) r = 0;
  } else if (whatColor <= 0.8) {
    b += (amount * upOrDown);
    if (b > 255) b = 255;
    if (b < 0) b = 0;
  } else {
    g += (amount * upOrDown);
    if (g > 255) g = 255;
    if (g < 0) g = 0;
  }
  let rHex = r < 16 ? '0' + r.toString(16) : r.toString(16);
  let gHex = g < 16 ? '0' + g.toString(16) : g.toString(16);
  let bHex = b < 16 ? '0' + b.toString(16) : b.toString(16);
  return '#' + rHex + gHex + bHex;
}

function getDistance(ptA, ptB, name) {
  if (!(ptA && ptA.x != undefined && ptA.y != undefined && ptB && ptB.x != undefined && ptB.y != undefined)) {
    if (!name) name = "???";
    console.log(`Err getDistance ${name}`);
    return 9999;
  }
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

function checkLakeAndRocks() {
  worldModel.data.floor.shapes.forEach((x) => {
    if (!x.position) {
      x.position = getPosition(x.distance, x.angleToOrigine);
    }
  });

  worldModel.data.rocks.forEach((x) => {
    if (!x.position) {
      x.position = getPosition(x.distance, x.angleToOrigine);
    }
  });
}

//Chris Coyier 
function LightenDarkenColor(col, amt) {

  if (!col) return "#888888";
  var usePound = false;

  if (col[0] == "#") {
    col = col.slice(1);
    usePound = true;
  }

  var num = parseInt(col, 16);

  var r = (num >> 16) + amt;

  if (r > 255) r = 255;
  else if (r < 0) r = 0;

  var b = ((num >> 8) & 0x00FF) + amt;

  if (b > 255) b = 255;
  else if (b < 0) b = 0;

  var g = (num & 0x0000FF) + amt;

  if (g > 255) g = 255;
  else if (g < 0) g = 0;

  return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
}

function toradians(degrees) {
  return degrees * Math.PI / 180;
}

function arePlantsReady() {
  return worldModel && worldModel.data && worldModel.data.plants && Array.isArray(worldModel.data.plants);
}


function pointIsInsidePoly(checkPoint, polyCenter, polySize) {
  // very approximative : should make only round rocks !!!
  let checkPointDistanceToCenter = getDistance(checkPoint, polyCenter);
  return checkPointDistanceToCenter < (polySize / 2);
}