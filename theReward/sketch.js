/*
Wip : the red dot figures the hunter and the green one the prey
mobs just move around and avoid the obstacles (the circles and borders)
The hunter catches the preys and find its reward
TODO : fix
the hunter sees its preys even if they are concealed by a rock
*/

const doDrawRays = false;
const mobMagnifier = 3;
let inGame = false;
let rayNumber = 15;
let preyNr = 7; // not to many as it defers the game init (9 or 10 max)

const widthAndHeight = 600;
const half = 300;

const polyModels = [[{"x": -0.37,"y": -0.164}, {"x": -0.2,"y": -0.357}, {"x": -0.11,"y": -0.31}, {"x": -0.053,"y": -0.38}, {"x": -0.02,"y": -0.444}, {"x": 0.14,"y": -0.357}, {"x": 0.187,"y": -0.26}, {"x": 0.333,"y": -0.317}, {"x": 0.4,"y": -0.287}, {"x": 0.543,"y": 0.16}, {"x": 0.43,"y": 0.336}, {"x": 0.307,"y": 0.293}, {"x": 0.28,"y": 0.326}, {"x": 0.31,"y": 0.48}, {"x": 0.293,"y": 0.6}, {"x": 0.13,"y": 0.586}, {"x": -0.023,"y": 0.536}, {"x": -0.093,"y": 0.44}, {"x": -0.123,"y": 0.333}, {"x": -0.103,"y": 0.206}, {"x": -0.243,"y": 0.34}, {"x": -0.343,"y": 0.336}, {"x": -0.46,"y": 0.173}, {"x": -0.487,"y": 0.046}, {"x": -0.437,"y": 0.02}, {"x": -0.417,"y": -0.054}, {"x": -0.447,"y": -0.127}, {"x": -0.37,"y": -0.164}],
[{"x": -0.333,"y": -0.38}, {"x": -0.46,"y": -0.194}, {"x": -0.493,"y": 0.15}, {"x": -0.38,"y": 0.456}, {"x": -0.197,"y": 0.646}, {"x": -0.143,"y": 0.82}, {"x": 0.047,"y": 0.783}, {"x": 0.18,"y": 0.606}, {"x": 0.407,"y": 0.416}, {"x": 0.557,"y": 0.28}, {"x": 0.693,"y": 0.19}, {"x": 0.557,"y": -0.117}, {"x": 0.33,"y": -0.19}, {"x": 0.147,"y": -0.414}, {"x": -0.117,"y": -0.464}, {"x": -0.333,"y": -0.38}],
[{"x": -0.05,"y": -0.624},{"x": -0.233,"y": -0.53},{"x": -0.403,"y": -0.394},{"x": -0.483,"y": -0.247},{"x": -0.577,"y": -0.024},{"x": -0.597,"y": 0.16},{"x": -0.57,"y": 0.253},{"x": -0.23,"y": 0.46},{"x": -0.173,"y": 0.56},{"x": -0.13,"y": 0.626},{"x": -0.053,"y": 0.57},{"x": -0.01,"y": 0.473},{"x": 0.153,"y": 0.446},{"x": 0.407,"y": 0.25},{"x": 0.477,"y": 0.03},{"x": 0.53,"y": -0.224},{"x": 0.597,"y": -0.3},{"x": 0.54,"y": -0.414},{"x": 0.387,"y": -0.397},{"x": 0.163,"y": -0.417},{"x": 0.043,"y": -0.517},{"x": -0.05,"y": -0.624}]];

const rockModels = [{
    "name": "A",
    "diameter": 80,
    "pos": {
      "x": -175,
      "y": -120
    },
    "poly": getPolyModel(0)
  },
  {
    "name": "B",
    "diameter": 80,
    "pos": {
      "x": -85,
      "y": 0
    },
    "poly": getPolyModel(2)
  },
  {
    "name": "C",
    "diameter": 100,
    "pos": {
      "x": -70,
      "y": -148
    },
    "poly":getPolyModel(0)
  },
  {
    "name": "D",
    "diameter": 125,
    "pos": {
      "x": 100,
      "y": 100
    },
    "poly": getPolyModel(2)
  },
  {
    "name": "E",
    "diameter": 65,
    "pos": {
      "x": 230,
      "y": 0
    },
    "poly": getPolyModel(1)
  },
  {
    "name": "F",
    "diameter": 75,
    "pos": {
      "x": 0,
      "y": 0
    },
    "poly": getPolyModel(1)
  },
  {
    "name": "G",
    "diameter": 45,
    "pos": {
      "x": 200,
      "y": -120
    },
    "poly": getPolyModel(2)
  },
  {
    "name": "H",
    "diameter": 85,
    "pos": {
      "x": -200,
      "y": -230
    },
    "poly": getPolyModel(0)
  },
  {
    "name": "I",
    "diameter": 45,
    "pos": {
      "x": 200,
      "y": 230
    },
    "poly": getPolyModel(1)
  },
  {
    "name": "J",
    "diameter": 65,
    "pos": {
      "x": -150,
      "y": 230
    },
    "poly": getPolyModel(0)
  },
  {
    "name": "K",
    "diameter": 65,
    "pos": {
      "x": -210,
      "y": 130
    },
    "poly": getPolyModel(2)
  },
  {
    "name": "L",
    "diameter": 75,
    "pos": {
      "x": -10,
      "y": -130
    },
    "poly": getPolyModel(0)
  },
  {
    "name": "M",
    "diameter": 55,
    "pos": {
      "x": -110,
      "y": -230
    },
    "poly": getPolyModel(1)
  }
];

let mobs = [{
  id: 1,
  specie: "ant",
  type: "hunter",
  color: "#dd0000",
  size: 12,
  sightLength: 200,
  fov: Math.PI / 2,
  raySrc: null,
  rayDest: null,
  raysDestLeft: [],
  raysDestRight: [],
  detectMobs: [],
  rayNr: rayNumber,
  rayAngle: (Math.PI / 2) / (rayNumber - 1),
  move: 5,
  pos: {
    x: -1000,
    y: -1000
  },
  rot: 0,
  drawnRot : 0,
  mobList : []
}];

for(let i = 0;i < preyNr; i++){
    mobs.push({
    id: i+2,
    fleeing : false,
    specie: "bug",
    type: "prey",
    color: "#00dd00",
    size: 6,
    move: 5,
    sightLength: 120,
    fov: Math.PI / 2,
    raySrc: null,
    rayDest: null,
    raysDestLeft: [],
    raysDestRight: [],
    detectMobs: [],
    rayNr: rayNumber,
    rayAngle: (Math.PI / 2) / (rayNumber - 1),
    pos: {
      x: -1000,
      y: -1000
    },
    rot: 0,
    drawnRot : 0,
    mobList : []
  });
}

let rocks = [];
let context;

function setup() {
  createCanvas(widthAndHeight, widthAndHeight);
  context = drawingContext;
  if(rocks.length) return;
  rocks = rockModels.map((r) => {
    let rock = {
      name: r.name,
      pos: r.pos,
      diameter: r.diameter,
      poly : r.poly
    };
    if(rock.poly){
      rock.poly.forEach((pt) => {
        pt.x = (pt.x * r.diameter * 0.7) + r.pos.x;
        pt.y = (pt.y * r.diameter * 0.7) + r.pos.y;
      });
    }
    return rock;
  })
  framerate = 1;
}

function draw() {
  let nrPreys = mobs.filter((m) => {
    return m.type == "prey";
  }).length;
  if(nrPreys == 0){
    location.reload();
  } 
  frameRate(12)
  translate(width / 2, height / 2);
  background(102, 160, 80);
  drawRocks();
  if (!inGame) {
    textSize(32);
    fill(0, 102, 153, 255);
    text('the garden is loading...',-150,0);
    textSize(12);
    setStartingMobPositions()
  } else {
    mobs.forEach((m) => {
      drawMob(m);
      calcRays(m);
      collideRays(m);
      m.detectMobs = detectOtherMobs(m);
      if (doDrawRays) {
        drawRays(m);
      }
      moveMob(m);
    });
  }
}

function setStartingMobPositions() {
  const margin = 10;
  const minPos = margin - half;
  const maxPos = half - margin;
  const minDist = half - margin;
  mobs.forEach((m) => {
    m.pos.x = Math.floor((Math.random() * widthAndHeight)) - half;
    m.pos.y = Math.floor((Math.random() * widthAndHeight)) - half;
    if (m.pos.x < minPos) m.pos.x = margin;
    if (m.pos.x > maxPos) m.pos.x = maxPos;
    if (m.pos.y < minPos) m.pos.y = minPos;
    if (m.pos.y > maxPos) m.pos.y = maxPos;

    m.rot = getRandomRotation();
  });
  let isOnRock = false;
  mobs.forEach((m) => {
    rocks.forEach((r) => {
      let distance = getDistance(m.pos, r.pos);
      if (distance <= (r.diameter / 2) + m.size) {
        isOnRock = true;
      }
    });
  });
  if (isOnRock || getDistance(mobs[0].pos, mobs[1].pos) < minDist) {
    mobs.forEach((m) => {
      m.pos.x = -1000;
      m.pos.y = -1000;
    });
  } else {
    inGame = true;
  }
}

function moveMob(m) {
  let preyChased = false;
  let dangerPt;
  let maxDist,maxRay;
  let previousPos = {
    ...m.pos
  };
  let previousRot =  m.drawnRot ?  m.drawnRot : m.rot;
  
  if( m.detectMobs.length){ // If a mob has been detected
    if(m.type == "hunter"){
      let preys = m.detectMobs.filter((x) => {
        return x.type == "prey";
      });
      if(preys.length){
        let destPt = preys[0].pos;
        let destPtFromHunter= {x:(destPt.x-m.pos.x),y:(destPt.y-m.pos.y)};
        let destPtFromHunterNormalized = normalizePoint(destPtFromHunter);
        m.rot = getAngle(destPtFromHunterNormalized);
        maxDist = Math.min(m.move, m.detectMobs[0].dist);
        m.pos.x += Math.floor((destPtFromHunterNormalized.x * maxDist) + 0.5);
        m.pos.y += Math.floor((destPtFromHunterNormalized.y * maxDist) + 0.5);
        if(m.detectMobs[0].dist < m.size){
          mobs = mobs.filter((m) => {
            return m.id !=preys[0].id;
          });
        }
        preyChased = true;
      }
    }else{
        let hunters = m.detectMobs.filter((x) => {
          return x.type == "hunter";
        });
        if(hunters.length){
          if(!m.fleeing){
              dangerPt = hunters[0].pos;
              let dangerPtFromMe = {x:(dangerPt.x-m.pos.x),y:(dangerPt.y-m.pos.y)};
              let dangerPtFromMeNormalized = normalizePoint(dangerPtFromMe);
              m.rot = getAngle(dangerPtFromMeNormalized) + Math.PI;
              hunterInView = true;
              m.fleeing = true; 
              return;
          }
        }else{
          m.fleeing = false; 
        }
    }
  }
  maxDist = m.rayDest.d;
  maxRay = m.rayDest;
  for (let i = 0; i < ((m.rayNr / 2) - 1); i++) {
    if (m.raysDestLeft[i].d > maxDist) {
      maxDist = m.raysDestLeft[i].d;
      maxRay = m.raysDestLeft[i];
    }
    if (m.raysDestRight[i].d > maxDist) {
      maxDist = m.raysDestRight[i].d;
      maxRay = m.raysDestRight[i];
    }
  }
  if (maxDist > 0) {
    if(!preyChased){
      maxDist = Math.min(m.move, maxDist);
      if (maxDist < m.move) {
        m.rot = getRandomRotation();
      } else {
        let newPos = polarToCartesian(maxRay.rot);
        m.pos.x += Math.floor(newPos.x * maxDist);
        m.pos.y += Math.floor(newPos.y * maxDist);
        m.rot = maxRay.rot;
       }
    }
    let insideRocks = rocks.filter((r) => {
      return getDistance(r.pos, m.pos) < (r.diameter / 2) - 2;
    });
    if (insideRocks.length > 0) {
      let isInside = getDistance(insideRocks[0].pos, m.pos) < (insideRocks[0].diameter / 2) - 2;
      let i = 0;
      while (isInside && i < 20){
        m.rot = getRandomRotation(); 
        let heading = polarToCartesian(m.rot);
        let escapeDist = insideRocks[0].diameter / 5 + m.move;
        m.pos.x = m.pos.x + heading.x * escapeDist;
        m.pos.y = m.pos.y + heading.y * escapeDist;
        isInside = getDistance(insideRocks[0].pos, m.pos) < (insideRocks[0].diameter / 2) - 2;
        i++;
      }


    }else{
      let nearHalf = half - m.size;
      if(m.pos.x > nearHalf || m.pos.x < -nearHalf || m.pos.y > nearHalf || m.pos.y < -nearHalf )        {
        m.pos = {
          ...previousPos
        };
        m.rot = getRandomRotation(); 
      }
    }
  }
  m.drawnRot = getDistance(previousPos,m.pos) < 3 ? previousRot : m.rot;
}

function drawRocks() {
  rocks.forEach((r) => {
/*      context.save();
    context.beginPath();
    context.fillStyle = "#000000";
    context.fillText(r.name, r.pos.x - 4, r.pos.y);
    context.save();
    context.beginPath();
    context.strokeStyle = "#eeeeee";
    noFill();
    circle(r.pos.x, r.pos.y, r.diameter);
    context.stroke();
    context.restore();  */
    drawPoly(r);
  });
}

function drawPoly(r){
  if(!r.poly) return;
    context.save();
    context.beginPath();
    context.fillStyle = "#776655";
    context.strokeStyle = "#000000";
    context.moveTo(r.poly[0].x, r.poly[0].y);
    let ptsNr = r.poly.length;
    for(let i = 1; i < ptsNr; i++){
        context.lineTo(r.poly[i].x, r.poly[i].y);
    }
    context.closePath();
    context.stroke();
    context.fill();
    context.restore();
}

function drawRays(m) {
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

function drawMob(m) {
  if(m.type == "hunter"){
    drawHunter(m);
    return;
  }
  let d1 =  m.size*0.8;
  let d2 =  m.size*0.6;
  context.strokeStyle = "#000";
  context.fillStyle = m.color;
  circle(m.pos.x, m.pos.y, d1);
  context.stroke();
  context.fill();
  let heading = polarToCartesian(m.drawnRot);
  let headPoint = {x:0,y:0};
  headPoint.x = m.pos.x + heading.x * d2;
  headPoint.y = m.pos.y + heading.y * d2;
  circle(headPoint.x, headPoint.y, d2);
  context.stroke();
  context.fill();
}

function drawHunter(m){
  let d1 =  m.size*0.4;
  let d2 =  m.size*0.5;
  context.strokeStyle = "#000";
  context.fillStyle = "#d55";
  // body
  circle(m.pos.x, m.pos.y, d2);
  context.stroke();
  context.fill();
  context.fillStyle ="#f00";
  // head
  let heading = polarToCartesian(m.drawnRot);
  let headPoint = {x:0,y:0};
  headPoint.x = m.pos.x + heading.x * d2;
  headPoint.y = m.pos.y + heading.y * d2;
  circle(headPoint.x, headPoint.y, d1);
  context.stroke();
  context.fill();
  context.fillStyle ="#d55";
  // tail
  let tailPoint = {x:0,y:0};
  tailPoint.x = m.pos.x - heading.x * d2;
  tailPoint.y = m.pos.y - heading.y * d2;
  circle(tailPoint.x, tailPoint.y, d2);
  context.stroke();
  context.fill();
 //context.closePath();

}

function collideRays(m) {
  if (!m.rayDest || !m.raySrc) return;
  let nearByRocks = rocks.filter((r) => {
    return getDistance(r.pos, m.pos) <= m.sightLength + r.diameter;
  });

  if (nearByRocks.length) {
    let result = collideRayCircle(nearByRocks, m.raySrc, m.rayDest);
    if (result) {
      m.rayDest.x = result.endPt.x;
      m.rayDest.y = result.endPt.y;
      m.rayDest.d = result.d;
    }
    m.raysDestRight.forEach((ray) => {
      let result = collideRayCircle(nearByRocks, m.raySrc, ray);
      if (result) {
        ray.x = result.endPt.x;
        ray.y = result.endPt.y;
        ray.d = result.d;
      }
    });
    m.raysDestLeft.forEach((ray) => {
      let result = collideRayCircle(nearByRocks, m.raySrc, ray);
      if (result) {
        ray.x = result.endPt.x;
        ray.y = result.endPt.y;
        ray.d = result.d;
      }
    });
  }
  // Borders :
  let result = collideRayBorders(m.raySrc, m.rayDest);
  if (result) {
    m.rayDest.x = result.endPt.x;
    m.rayDest.y = result.endPt.y;
    m.rayDest.d = result.d;
    m.rayDest.equation = result.equation;
  }
  m.raysDestRight.forEach((ray) => {
    let result = collideRayBorders(m.raySrc, ray);
    if (result) {
      ray.x = result.endPt.x;
      ray.y = result.endPt.y;
      ray.d = result.d;
      ray.equation = result.equation;
    }
  });
  m.raysDestLeft.forEach((ray) => {
    let result = collideRayBorders(m.raySrc, ray);
    if (result) {
      ray.x = result.endPt.x;
      ray.y = result.endPt.y;
      ray.d = result.d;
      ray.equation = result.equation;
    }
  });
}

function collideRayBorders(raySrc, rayDest) {
  let endPt = {
    ...rayDest
  };
  let equation = getEquationOfLine({
    p1: {
      x: raySrc.x,
      y: raySrc.y
    },
    p2: {
      x: endPt.x,
      y: endPt.y
    }
  });

  if (endPt.x <= -half) {
    endPt.x = -half + 5;
    if (!equation.horizontal && !equation.vertical) {
      endPt.y = (equation.slope * endPt.x) + equation.c;
    }
  }
  if (endPt.x >= half) {
    endPt.x = half - 5;
    if (!equation.horizontal && !equation.vertical) {
      endPt.y = (equation.slope * endPt.x) + equation.c;
    }
  }
  if (endPt.y <= -half) {
    endPt.y = -half + 5;
    if (!equation.horizontal && !equation.vertical) {
      endPt.x = (endPt.y - equation.c) / equation.slope;
    }
  }
  if (endPt.y >= half) {
    endPt.y = half - 5;
    if (!equation.horizontal && !equation.vertical) {
      endPt.x = (endPt.y - equation.c) / equation.slope;
    }
  }
  let distance = getDistance(raySrc, endPt);
  return {
    endPt: endPt,
    d: distance,
    equation: equation
  }
}

function detectOtherMobs(m) {
  let nearByMobs = mobs.filter((otherMob) => {
    if(m.id === otherMob.id){
      return false;
    }else{
      let dist = getDistance(m.pos, otherMob.pos);
      otherMob.dist = dist;
      return dist <= m.sightLength + (otherMob.size * mobMagnifier);
    }
  });
  return nearByMobs.sort((a,b) => {
    return a.dist - b.dist;
  });
}

function collideRayMobs(mobs, raySrc, rayDest) {
  let distMin = 999;
  let pt = null;

  rocks.forEach((r) => {
    let arr = interceptCircleLine({
      x: r.pos.x,
      y: r.pos.y,
      radius: r.diameter / 2
    }, {
      p1: {
        x: raySrc.x,
        y: raySrc.y
      },
      p2: {
        x: rayDest.x,
        y: rayDest.y
      }
    });
    if (arr.length > 0) {
      for (let i = 0; i <= arr.length; i++) {
        if (arr[i] != null) {
          let distance = getDistance(arr[i], raySrc, arr[i]);
          if (distance < distMin) {
            distMin = distance;
            pt = {
              ...arr[i]
            };
          }
        }
      }
    }
  });
  if (pt) {
    return {
      endPt: {
        ...pt
      },
      d: distMin
    };
  }
  return null;
}

function collideRayCircle(rocks, raySrc, rayDest) {
  let distMin = 999;
  let pt = null;

  rocks.forEach((r) => {
    let arr = interceptCircleLine({
      x: r.pos.x,
      y: r.pos.y,
      radius: r.diameter / 2
    }, {
      p1: {
        x: raySrc.x,
        y: raySrc.y
      },
      p2: {
        x: rayDest.x,
        y: rayDest.y
      }
    });
    if (arr.length > 0) {
      for (let i = 0; i <= arr.length; i++) {
        if (arr[i] != null) {
          let distance = getDistance(arr[i], raySrc, arr[i]);
          if (distance < distMin) {
            distMin = distance;
            pt = {
              ...arr[i]
            };
          }
        }
      }
    }
  });
  if (pt) {
    return {
      endPt: {
        ...pt
      },
      d: distMin
    };
  }
  return null;
}

function calcRays(m) {
  m.rayDest = null;
  m.raysDestLeft = [];
  m.raysDestRight = [];
  let currentRot = m.rot;
  let dir = polarToCartesian(currentRot);
  m.raySrc = { // just a point on the circle perimeter
    x: m.pos.x + (dir.x * m.size / 2),
    y: m.pos.y + (dir.y * m.size / 2),
    d: null
  }
  m.rayDest = {
    x: m.raySrc.x + (dir.x * m.sightLength),
    y: m.raySrc.y + (dir.y * m.sightLength),
    d: null,
    rot : currentRot
  };
  for (let i = 0; i <= (m.rayNr / 2) - 1; i++) {
    currentRot = m.rot + ((i + 1) * m.rayAngle)
    dir = polarToCartesian(currentRot);
    m.raysDestRight.push({
      x: m.raySrc.x + (dir.x * m.sightLength),
      y: m.raySrc.y + (dir.y * m.sightLength),
      d: null,
      rot : currentRot
    });
    currentRot = m.rot - ((i + 1) * m.rayAngle);
    dir = polarToCartesian(m.rot - ((i + 1) * m.rayAngle));
    m.raysDestLeft.push({
      x: m.raySrc.x + (dir.x * m.sightLength),
      y: m.raySrc.y + (dir.y * m.sightLength),
      d: null,
      rot : currentRot
    })
  }
}

function intersectPointLineLine(lineA, lineB) {
  // from Burke on p5js.org modified to my needs
  const ua = ((lineB.p2.x - lineB.p1.x) * (lineA.p1.y - lineB.p1.y) -
      (lineB.p2.y - lineB.p1.y) * (lineA.p1.x - lineB.p1.x)) /
    ((lineB.p2.y - lineB.p1.y) * (lineA.p2.x - lineA.p1.x) -
      (lineB.p2.x - lineB.p1.x) * (lineA.p2.y - lineA.p1.y));

  const ub = ((lineA.p2.x - lineA.p1.x) * (lineA.p1.y - lineB.p1.y) -
      (lineA.p2.y - lineA.p1.y) * (lineA.p1.x - lineB.p1.x)) /
    ((lineB.p2.y - lineB.p1.y) * (lineA.p2.x - lineA.p1.x) -
      (lineB.p2.x - lineB.p1.x) * (lineA.p2.y - lineA.p1.y));

  const x = lineA.p1.x + ua * (lineA.p2.x - lineA.p1.x);
  const y = lineA.p1.y + ua * (lineA.p2.y - lineA.p1.y);

  return {
    x: x,
    y: y
  };
}

function getDistance(ptA, ptB, name) {
  if (!(ptA && ptA.x != undefined && ptA.y != undefined && ptB && ptB.x != undefined && ptB.y != undefined)) {
    if (!name) name = "???";
    console.log(`Err getDistance ${name}`);
    return 9999;
  }
  return Math.sqrt(Math.pow(ptB.x - ptA.x, 2) + Math.pow(ptB.y - ptA.y, 2));
}

function getRandomRotation() {
    return Math.floor((Math.random() * Math.PI * 2) * 100) / 100;
}

function polarToCartesian(rot) {
  return {
    x: Math.cos(rot),
    y: Math.sin(rot)
  }
}

function interceptCircleLine(circle, line) {
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
  if (isNaN(d)) { // no intercept
    return [];
  }
  u1 = (b - d) / c; // these represent the unit distance of point one and two on the line
  u2 = (b + d) / c;
  retP1 = {}; // return points
  retP2 = {}
  ret = []; // return array
  if (u1 <= 1 && u1 >= 0) { // add point if on the line segment
    retP1.x = line.p1.x + v1.x * u1;
    retP1.y = line.p1.y + v1.y * u1;
    ret[0] = retP1;
  }
  if (u2 <= 1 && u2 >= 0) { // second add point if on the line segment
    retP2.x = line.p1.x + v1.x * u2;
    retP2.y = line.p1.y + v1.y * u2;
    ret[ret.length] = retP2;
  }
  return ret;
}

function getEquationOfLine(line) {
  if (line.p1.x === line.p2.x) { // vertical line
    return {
      slope: null,
      horizontal: false,
      vertical: true,
      c: null
    };
  } else if (line.p1.y === line.p2.y) { // horizontal line
    return {
      slope: null,
      horizontal: true,
      vertical: false,
      c: null
    };
  } else {
    let slope = (line.p2.y - line.p1.y) / (line.p2.x - line.p1.x);
    let x1 = line.p1.x;
    let y1 = line.p1.y;
    let constant = y1 - slope * x1;
    return {
      slope: slope,
      horizontal: false,
      vertical: false,
      c: constant
    };
  }
}

function getAngle(pt){
  return Math.atan2(pt.y, pt.x)
}

function normalizePoint(pt){
  let result = {x:0,y:0};
  let biggest = Math.max(Math.abs(pt.x), Math.abs(pt.y));
  if(biggest != 0){
    result.x = pt.x / biggest;
    result.y = pt.y / biggest;
  }
  return result;
}

function getPolyModel(nr){
  if(polyModels && polyModels.length && polyModels.length > nr){
    return JSON.parse(JSON.stringify(polyModels[nr]));
  }
  return null;
}
