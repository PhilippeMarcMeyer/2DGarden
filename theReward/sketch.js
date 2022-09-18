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
           let rock = {name : r.name, pos : r.pos, color : r.color, diameter : r.diameter};
          return rock;
      })
      framerate = 1;
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
               let distance = getDistance(m.pos,r.pos);
               if(distance <= (r.diameter / 2) + m.size){
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
      context.strokeStyle = '#0000dd';
      m.raysDestLeft.forEach((r) => {
        context.moveTo(m.raySrc.x, m.raySrc.y);
        context.lineTo(r.x, r.y);
      });
      context.closePath();
      context.stroke();
      context.beginPath();
      context.strokeStyle = '#ddaa00';
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
      if(!m.rayDest || !m.raySrc) return;
      let nearByRocks = rocks.filter((r) => {
        return getDistance(r.pos,m.pos) <= m.sightLength + r.diameter;
      });
      if(nearByRocks.length){
        let result = collideRay(nearByRocks,m.raySrc,m.rayDest);
        if(result){
          m.rayDest.x = result.endPt.x;
          m.rayDest.y = result.endPt.y;
          m.rayDest.d = result.d;
        }
        m.raysDestRight.forEach((ray) => {
          let result = collideRay(nearByRocks,m.raySrc,ray);
          if(result){
            ray.x = result.endPt.x;
            ray.y = result.endPt.y;
            ray.d = result.d;
          }
        });
        m.raysDestLeft.forEach((ray) => {
          let result = collideRay(nearByRocks,m.raySrc,ray);
          if(result){
            ray.x = result.endPt.x;
            ray.y = result.endPt.y;
            ray.d = result.d;
          }
        });
      }
    }

    function collideRay(rocks,raySrc, rayDest){
      let distMin = 999;
      let pt = null;
      rocks.forEach((r) => {
        let arr = interceptCircleLine({x:r.pos.x,y:r.pos.y,radius:r.diameter/2},{p1:{x:raySrc.x,y:raySrc.y},p2:{x:rayDest.x,y:rayDest.y}});
        if(arr.length > 0){
          for(let i = 0; i <= arr.length; i++){
            if(arr[i] != null){
              let distance = getDistance(arr[i],raySrc,arr[i]);
              if(distance < distMin){
                distMin = distance;
                pt = {...arr[i]};
              }
            }
          }
        }
      });
      if(pt){
        return {endPt : {...pt}, d : distMin};
      }
      return null;
    }

    function calcRays(m){
      m.rayDest = null;
      m.raysDestLeft = [];
      m.raysDestRight = [];
      let dir = polarToCartesian(m.rot);
      m.raySrc = { // just a point on the circle perimeter
        x: m.pos.x + (dir.x * m.size / 2),
        y: m.pos.y + (dir.y * m.size / 2),
        d: null
      }
      m.rayDest = {
        x: m.raySrc.x + (dir.x * m.sightLength),
        y: m.raySrc.y + (dir.y * m.sightLength),
        d: null
      };
      for (let i = 0; i <= (m.rayNr / 2) - 1; i++) {
        dir = polarToCartesian(m.rot + ((i+1) * m.rayAngle));
        m.raysDestRight.push({
          x: m.raySrc.x + (dir.x * m.sightLength),
          y: m.raySrc.y + (dir.y * m.sightLength),
          d: null
        });
        dir = polarToCartesian(m.rot - ((i+1) * m.rayAngle));
        m.raysDestLeft.push({
          x: m.raySrc.x + (dir.x * m.sightLength),
          y: m.raySrc.y + (dir.y * m.sightLength),
          d: null
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

    function interceptCircleLine(circle, line){
      //https://stackoverflow.com/users/3877726/blindman67
      var a, b, c, d, u1, u2, ret, retP1, retP2, v1, v2;
      v1 = {};
      v2 = {};
      v1.x = line.p2.x - line.p1.x;
      v1.y = line.p2.y - line.p1.y;
      v2.x = line.p1.x - circle.x;
      v2.y = line.p1.y - circle.y;
      b = (v1.x * v2.x + v1.y * v2.y);
      c = 2 * (v1.x * v1.x + v1.y * v1.y);
      b *= -2;
      d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - circle.radius * circle.radius));
      if(isNaN(d)){ // no intercept
          return [];
      }
      u1 = (b - d) / c;  // these represent the unit distance of point one and two on the line
      u2 = (b + d) / c;    
      retP1 = {};   // return points
      retP2 = {}  
      ret = []; // return array
      if(u1 <= 1 && u1 >= 0){  // add point if on the line segment
          retP1.x = line.p1.x + v1.x * u1;
          retP1.y = line.p1.y + v1.y * u1;
          ret[0] = retP1;
      }
      if(u2 <= 1 && u2 >= 0){  // second add point if on the line segment
          retP2.x = line.p1.x + v1.x * u2;
          retP2.y = line.p1.y + v1.y * u2;
          ret[ret.length] = retP2;
      }       
      return ret;
  }