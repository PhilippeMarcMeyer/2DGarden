const rockModels = [{
    "name": "A",
    "diameter": 80,
    "pos": {
      "x": -175,
      "y": -120
    },
    color: "#776655"
  },
  {
    "name": "B",
    "diameter": 80,
    "pos": {
      "x": -85,
      "y": 0
    },
    color: "#997755"
  },
  {
    "name": "C",
    "diameter": 100,
    "pos": {
      "x": -70,
      "y": -148
    },
    color: "#557799"
  },
  {
    "name": "D",
    "diameter": 125,
    "pos": {
      "x": 100,
      "y": 100
    },
    color: "#557799"
  }
];
    let inGame = false;
    const widthAndHeight = 600;
    const mobs = [{
      type: "ant",
      name: "warrior",
      color : "#dd0000",
      size: 12,
      sightLength :200,
      fov : Math.PI/2,
      raySrc : null,
      rayDest : null,
      raysDestLeft : [],
      raysDestRight : [],
      rayNr : 11,
      rayAngle : Math.PI/(2*10),
      move: 6,
      pos: {
        x: -1000,
        y: -1000
      },
      rot: 0
    }, {
      type: "bug",
      name: "defender",
      color : "#00dd00",
      size: 6,
      move: 3,
      sightLength :120,
      fov : Math.PI/3,
      raySrc : null,
      rayDest : null,
      raysDestLeft : [],
      raysDestRight : [],
      rayNr : 11,
      rayAngle : Math.PI/(3*10),
      pos: {
        x: -1000,
        y: -1000
      },
      rot: 0
    }];
    let rocks = [];
    let context;
    function setup() {
      createCanvas(widthAndHeight, widthAndHeight);
      context = drawingContext;
        rocks = rockModels.map((r) => {
           let rock = {name : r.name, pos : r.pos, color : r.color,multiplier: r.multiplier,diameter:r.diameter};
          return rock;
      })
      framerate = 20;
    }
    
    function draw() {
      translate(width / 2, height / 2);
      background(102,160,80);
      drawRocks();
      mobs.forEach((m) => {
        drawMob(m);
        calcRays(m);
        collideRays(m)
        drawRays(m);
      });
      if(!inGame){
          mobs.forEach((m) => {
              m.pos.x = Math.floor((Math.random() * widthAndHeight)) - widthAndHeight/2;
              m.pos.y = Math.floor((Math.random() * widthAndHeight)) - widthAndHeight/2;
              m.rot = getRandomRotation();
          });
          let isOnRock = false;
          mobs.forEach((m) => {
            rocks.forEach((r) => {
               let dist = getDistance(m.pos,r.pos);
               if(dist <= (r.diameter / 2) + m.size){
                isOnRock = true;
               }
          });
        });
        if(isOnRock){
          mobs.forEach((m) => {
            m.pos.x = -1000;
            m.pos.y = -1000;
        });
        }else{
          inGame = true;
        }
      }
    }
    
    function drawRocks(){
      rocks.forEach((r) => {
        context.save();
        context.beginPath();
        context.fillStyle = "#000000";
        context.fillText(r.name, r.pos.x -4, r.pos.y);
        context.save();
        context.beginPath();
        context.strokeStyle = "#eeeeee";
        noFill();
        circle( r.pos.x , r.pos.y, r.diameter);
        context.stroke();
        context.restore();
    });
    }

    function drawRays(m){
      context.save();

      context.beginPath();
      context.strokeStyle = "#000";
      context.moveTo(m.raySrc.x, m.raySrc.y);
      context.lineTo(m.rayDest.x, m.rayDest.y);
      context.closePath();
      context.stroke();

      context.beginPath();
      context.strokeStyle = m.color;
      m.raysDestLeft.forEach((r) => {
        context.moveTo(m.raySrc.x, m.raySrc.y);
        context.lineTo(r.x, r.y);
      });
      m.raysDestRight.forEach((r) => {
        context.moveTo(m.raySrc.x, m.raySrc.y);
        context.lineTo(r.x, r.y);
      });
      context.closePath();
      context.stroke();

      context.restore();
    }

    function drawMob(m){
      context.save();
      context.beginPath();
      context.strokeStyle = "#000";
      context.fillStyle = m.color;
      circle( m.pos.x , m.pos.y, m.size);
      context.closePath();
      context.stroke();
      context.fill();
    }

    function collideRays(m){
      // todo : and get Position of prey and follow
      // determine which ray to follow
      // check collision against boulders
      // just follow the nearest free ray, right preference
      // check collision against sides
      // if all the rays collide turn 90° clockwise
      // bug get position of hunter and flee opposite
      // when cornered turn and choose the farther free ay
    }

    function calcRays(m){
      m.rayDest = null;
      m.raysDestLeft = [];
      m.raysDestRight = [];
      let dir = polarToCartesian(m.rot);
      m.raySrc = { // just a point on the circle perimeter
        x: m.pos.x + (dir.x * m.size / 2),
        y: m.pos.y + (dir.y * m.size / 2)
      }
      m.rayDest = {
        x: m.raySrc.x + (dir.x * m.sightLength),
        y: m.raySrc.y + (dir.y * m.sightLength)
      };
      for (let i = 0; i <= (m.rayNr / 2) - 1; i++) {
        dir = polarToCartesian(m.rot + ((i+1) * m.rayAngle));
        m.raysDestRight.push({
          x: m.raySrc.x + (dir.x * m.sightLength),
          y: m.raySrc.y + (dir.y * m.sightLength)
        });
        dir = polarToCartesian(m.rot - ((i+1) * m.rayAngle));
        m.raysDestLeft.push({
          x: m.raySrc.x + (dir.x * m.sightLength),
          y: m.raySrc.y + (dir.y * m.sightLength)
        })
      }
    }

    function getDistance(ptA, ptB, name) {
      if (!(ptA && ptA.x != undefined && ptA.y != undefined && ptB && ptB.x != undefined && ptB.y != undefined)) {
        if (!name) name = "???";
        console.log(`Err getDistance ${name}`);
        return 9999;
      }
      return Math.sqrt(Math.pow(ptB.x - ptA.x, 2) + Math.pow(ptB.y - ptA.y, 2));
    }

    function getRandomRotation(){
      return Math.floor((Math.random() * Math.PI * 2) * 100) / 100;
    }

    function polarToCartesian(rot){
      return {x: Math.cos(rot), y : Math.sin(rot)}
    }