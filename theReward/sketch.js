/*
Wip : the red dot figures the hunter and the green one the prey
For the present time mobs just move around and avoid the obstacles (the circles and borders)
Soon the hunter will catch the prey and find its reward
*/

const rockModels = [{
  "name": "A",
  "diameter": 80,
  "pos": {
    "x": -175,
    "y": -120
  }
},
{
  "name": "B",
  "diameter": 80,
  "pos": {
    "x": -85,
    "y": 0
  }
},
{
  "name": "C",
  "diameter": 100,
  "pos": {
    "x": -70,
    "y": -148
  }
},
{
  "name": "D",
  "diameter": 125,
  "pos": {
    "x": 100,
    "y": 100
  }
},
{
  "name": "E",
  "diameter": 65,
  "pos": {
    "x": 230,
    "y": 0
  }
},
{
  "name": "F",
  "diameter": 75,
  "pos": {
    "x": 0,
    "y": 0
  }
},
{
  "name": "G",
  "diameter": 45,
  "pos": {
    "x": 200,
    "y": -120
  }
},
{
  "name": "H",
  "diameter": 85,
  "pos": {
    "x": -200,
    "y": -230
  }
},
{
  "name": "I",
  "diameter": 45,
  "pos": {
    "x": 200,
    "y": 230
  }
},
{
  "name": "J",
  "diameter": 65,
  "pos": {
    "x": -150,
    "y": 230
  }
},
{
  "name": "K",
  "diameter": 65,
  "pos": {
    "x": -210,
    "y": 130
  }
},
{
  "name": "L",
  "diameter": 75,
  "pos": {
    "x": -10,
    "y": -130
  }
},
{
  "name": "M",
  "diameter": 55,
  "pos": {
    "x": -110,
    "y": -230
  }
}
];
const doDrawRays = true;
const seenMobMagnifier = 6;
const unseenMobMagnifier = 3;
let inGame = false;
let rayNumber = 15;

const widthAndHeight = 600;
const half = 300;

class LivingBeing{
// WIP
constructor(type, specie,size,pos,insight,alive) {
  this.type = type;
  this.specie = specie;
  this.size = size;
  this.lastPos = pos;
  this.lastDist = lastDist;
  this.insight = insight;
  this.alive = alive;
}

}

const mobs = [{
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
rayNr: rayNumber,
rayAngle: (Math.PI / 2) / (rayNumber - 1),
move: 4,
pos: {
  x: -1000,
  y: -1000
},
rot: 0,
mobList : []
}, {
specie: "bug",
type: "prey",
color: "#00dd00",
size: 6,
move: 3,
sightLength: 120,
fov: Math.PI / 2,
raySrc: null,
rayDest: null,
raysDestLeft: [],
raysDestRight: [],
rayNr: rayNumber,
rayAngle: (Math.PI / 2) / (rayNumber - 1),
pos: {
  x: -1000,
  y: -1000
},
rot: 0,
mobList : []
}];

let rocks = [];
let context;

function setup() {
createCanvas(widthAndHeight, widthAndHeight);
context = drawingContext;
rocks = rockModels.map((r) => {
  let rock = {
    name: r.name,
    pos: r.pos,
    diameter: r.diameter
  };
  return rock;
})
}

function draw() {
frameRate(40)
translate(width / 2, height / 2);
background(102, 160, 80);
drawRocks();
if (!inGame) {
  setStartingMobPositions()
} else {
  context.beginPath();
  context.fillStyle = "#000000";
  context.fillText(`frameCount : ${frameCount}`, 180, -280);
  context.fillText(`frameRate  : ${mathFloor(frameRate())}`, 180, -260);
  context.closePath();
  
  mobs.forEach((m) => {
    drawMob(m);
    calcRays(m);
    collideRays(m);
    if (doDrawRays) {
      drawRays(m);
    }
    findOtherMobs(m);
    moveMob(m);
  });
}
}

function setStartingMobPositions() {
const margin = 75;
const minPos = margin - half;
const maxPos = half - margin;
const minDist = half - margin;
mobs.forEach((m) => {
  m.pos.x = mathFloor((Math.random() * widthAndHeight)) - half;
  m.pos.y = mathFloor((Math.random() * widthAndHeight)) - half;
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

function findOtherMobs(m) {
// todo (ray intersect ray ?)
}

function moveMob(m) {
let previousPos = {
  ...m.pos
};
let previousRot = m.rot;
let maxDist = m.rayDest.d;
let maxRay = m.rayDest;
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
  maxDist = Math.min(m.move, maxDist);
  if (maxDist < m.move) {
    m.rot = getRandomRotation();
  } else {
    let newPos = polarToCartesian(maxRay.rot);
    m.pos.x += mathFloor(newPos.x * maxDist);
    m.pos.y += mathFloor(newPos.y * maxDist);
    m.rot = maxRay.rot;
  }
  let insideRocks = rocks.filter((r) => {
    return getDistance(r.pos, m.pos) < (r.diameter / 2) - 2;
  });
  if (insideRocks.length > 0) {
    m.pos = {
      ...previousPos
    };
    m.rot = getRandomRotation();
  }else{
    let nearHalf = half - m.size;
    if(m.pos.x > nearHalf || m.pos.x < -nearHalf || m.pos.y > nearHalf || m.pos.y < -nearHalf ){
      m.pos = {
        ...previousPos
      };
      m.rot = getRandomRotation(); 
    }
  }
}
}

function drawRocks() {
rocks.forEach((r) => {
  context.beginPath();
  context.fillStyle = "#000000";
  context.fillText(r.name, r.pos.x - 4, r.pos.y);
  context.closePath();

  context.beginPath();
  context.strokeStyle = "#eeeeee";
  noFill();
  circle(r.pos.x, r.pos.y, r.diameter);
  context.closePath();
  context.stroke();
});
}

function drawRays(m) {
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
}

function drawMob(m) {
context.save();
context.beginPath();
context.strokeStyle = "#000";
context.fillStyle = m.color;
circle(m.pos.x, m.pos.y, m.size);
context.closePath();
context.stroke();
context.fill();
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
return Math.hypot(ptB.x-ptA.x, ptB.y-ptA.y);
}

function mathFloor(n){
return ~~n;
}

function getRandomRotation() {
return mathFloor((Math.random() * Math.PI * 2) * 100) / 100;
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