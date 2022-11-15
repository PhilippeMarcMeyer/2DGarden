/*
Wip : the red dot figures the hunter and the yellow ones the preys
mobs move around and avoid the obstacles (circles that are figured by rocks and borders)
The hunter catches the preys and find its reward
dot number temporaly shown
to eat
10/20/22 : the hunter now pauses to devours its prey and shakes a little
           the hunter is slower than its preys
10/21/22 : gradients, improvement of setup (much quicker)
10/27/22 : peaceful mode : the preys go under a flower
TODO : 
the hunter sees its preys even if they are concealed by a rock
the preys flee when detecting the hunter but then sometimes go straight to it <==== !!!
use ie6 classes for the mobs
Ideas : Being concealed by flowers could give an advantage (so they may wait longer under the flower cover before panicking). Preys could stay in panic mode longer due to adrenalin. Use dot product to avoid bug turning straight into the ant mouth ! What about some traits and genetic algo (the bug could panic less or more, tend to turn large or not...) Preys could counter attack spiting acid

*/
const doDrawRays = false;
const doDrawDotProduct = false;
const gameSpeed = 15;
const preyNr = 24; 
const hunterNr = 3;
const flowerNr = 17;
const rockNr = 16;
const mobMagnifier = 3;
const widthAndHeight = 740;
const half = 300;
const trueHalf = widthAndHeight / 2;
const letters = "A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z".split(",");
const flowerColors = ["#AE4FBE","#D792EF","#6FADDF","#AE6FBE","#D794EF","#7FADDF"];
const rayNumber = 15;

let inGame = false;
let fibers = [];
let rockModels = [];
let counter = 0;
let mobs = [];
let flowers = [];
let rocks = [];
let context;
let gradient;

function setup() {
  createCanvas(widthAndHeight, widthAndHeight);
  context = drawingContext;
  gradient = context.createLinearGradient(0, 0, widthAndHeight, widthAndHeight);
  gradient.addColorStop(0, "rgb(250,168,80)");
  gradient.addColorStop(0.5, "rgb(71,156,71)");
  gradient.addColorStop(1, "rgb(47,156,120)");
  fibers = createFibers(widthAndHeight,35);
  if(rocks.length) return;
  letters.forEach((letter,i) => {
    if(i < rockNr-1){
      rockModels.push({
        "name": letter,
        "diameter": Math.floor(random(40,100) + 0.5),
        "pos": {
          "x": Math.floor(random(-half,half) + 0.5),
          "y": Math.floor(random(-half,half) + 0.5)
        },
        "poly": getPolyModel(Math.floor(random(0,polyModels.length-1) + 0.5))
      });
  }
});
  rocks = rockModels.map((r) => {
    let rock = {
      name: r.name,
      pos: r.pos,
      diameter: r.diameter,
      poly : r.poly
    };
    if(rock.poly){
      rock.poly.forEach((pt) => {
        pt.x = (pt.x * r.diameter * 0.65) + r.pos.x;
        pt.y = (pt.y * r.diameter * 0.65) + r.pos.y;
      });
    }
    return rock;
  });
  
  for(let i = 0 ; i < flowerNr-1 ; i++){
    let flower = {pos:{}};
    flower.poly = JSON.parse(JSON.stringify(flowerPolies));
    let isInside = false;
    do {
      flower.pos.x = Math.floor(random(-half,half) + 0.5);
      flower.pos.y = Math.floor(random(-half,half) + 0.5);
      let nearByRocks = rockModels.filter((r) => {
        return getDistance(flower.pos,r.pos) <= r.diameter/2;
      });
      isInside = nearByRocks.length > 0;
    } while(isInside);

    flower.size = Math.floor(random(25,65) + 0.5);
    flower.color = flowerColors[Math.floor(Math.random(0,flowerColors.length-1) + 0.5)];
    flower.poly.forEach((petal) => {
          petal.forEach((pt) => {
            pt.x = (pt.x * flower.size) + flower.pos.x;
            pt.y = (pt.y * flower.size) + flower.pos.y;
          });
      });
    flowers.push(flower);
  }
  for(let i = 0;i < hunterNr; i++){
    mobs.push(new Ant(++counter,1))
  }
  for(let i = 0;i < preyNr; i++){
    mobs.push(new Bug(++counter,1))
  }
  while (!inGame) {
    setStartingMobPositions();
  }
}

function draw() {
  let nrPreys = mobs.filter((m) => {
    return m.type == "prey";
  }).length;
  if(nrPreys == 0){
    location.reload();
  } 
  frameRate(gameSpeed)
     context.fillStyle = gradient;
  rect(0,0,width,height);
    context.fill();
  translate(width / 2, height / 2);
  
  drawFibers();
  drawRocks();
  if (!inGame) {
    textSize(32);
    fill(0, 102, 153, 255);
    text('the garden is loading...',-150,0);
    textSize(12);
  } else {
    fill(0, 102, 153, 255);
    text(`bugs eaten : ${preyNr - mobs.length + hunterNr} / ${preyNr}`,-trueHalf +20,-trueHalf +20);
    textSize(12);
    mobs.forEach((m) => {
      m.drawMob();
      calcRays(m)
      collideRays(m);
      m.detectMobs = detectOtherMobs(m);
      if (doDrawRays) {
        drawRays(m);
      }
      moveMob(m);
    });
    drawFlowers();
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
  
  mobs.forEach((m) => {
    if(!m.ready){
      m.ready = true;
      rocks.forEach((r) => {
      let distance = getDistance(m.pos, r.pos);
      if (distance <= (r.diameter / 2) + m.size) {
        m.ready = false;
        m.pos.x = -1000;
        m.pos.y = -1000;
      }
      }); 
    }
  });
  inGame = (mobs.filter((m) => {return !m.ready;}).length == 0);
}

function drawFlowers(){
  flowers.forEach((f) => {
    context.save();
    context.beginPath();
    context.globalAlpha = 0.6;
    context.fillStyle = f.color;
    context.strokeStyle = "#000000";
    f.poly.forEach((petal) => {
      context.moveTo(petal[0].x, petal[0].y);
      let ptsNr = petal.length;
      for(let i = 1; i < ptsNr; i++){
        context.lineTo(petal[i].x, petal[i].y);
      }
    });

    context.closePath();
    context.stroke();
    context.fill();
    context.restore();
  });
}

function moveMob(m) {
  m.stopFor = undefined ? 0 : m.stopFor;
  if(m.stopFor > 0){
    m.stopFor--;
  }
  if(m.stopFor > 0){
    return;
  }
  if(m.fleeFor > 0){
    m.fleeFor--;
  }
    if(m.fleeFor <= 0){
    m.fleeing = false;
  }
  let isHunter = m.type == "hunter";
  let preyChased = false;
  let dangerPt;
  let maxDist,maxRay,minDist,minRay;
  let previousPos = {
    ...m.pos
  };
  let previousRot =  m.rot;
   // If a mob has been detected
  if(m.detectMobs.length){
    if(isHunter){
      let preys = m.detectMobs.filter((x) => {
        return x.type == "prey" && getDistance(x.pos,m.pos) < m.sightLength;
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
          m.stopFor = Math.round(frameRate()) * 3;
        }
        preyChased = true;
        m.hunting = true;
      }
    }else{
        let hunters = m.detectMobs.filter((x) => {
          return x.type == "hunter" && getDistance(x.pos,m.pos) < m.sightLength;
        });
        if(hunters.length){
          let justCheck = frameCount%6 == 1;
          if(!m.fleeing || justCheck){
              dangerPt = hunters[0].pos;
              let dot = Math.acos(((dangerPt.x - m.pos.x) * Math.cos(m.rot) + (dangerPt.y - m.pos.y) * Math.sin(m.rot)) / getDistance(dangerPt,m.pos));
              m.lastDot = Math.floor(dot*100)/100;
            let rotDiff = Math.abs(m.rot - hunters[0].rot);
              if(dot < HALF_PI ){
                m.rot = (m.rot + PI + (Math.random()+0.25)) % TWO_PI;
              }
            if(!justCheck){
                hunterInView = true;
                m.fleeing = true; 
                m.preferedPt = null;
                m.fleeFor = frameRate();
              return;            
            }

          }
        }else{
          if(m.fleeFor == 0){
            m.fleeing = false; 
            let minDist = 9999;
          flowers.forEach((f) => {
            let dist = getDistance(m.pos,f.pos);
            if(dist < minDist){
              minDist = dist;
              m.preferedPt = f.pos;
            }
          });
        }
      }
    }
  }else{
    m.hunting = false;
  }
  let isPeacefullMode = !m.fleeing;
  
  maxDist = m.rayDest.d;
  maxRay = m.rayDest;
  minDist = 9999;
  // todo go to the nearest flower
  if(isPeacefullMode && m.preferedPt != null){
    let flowerPtFromMe = {x:(m.preferedPt.x-m.pos.x),y:(m.preferedPt.y-m.pos.y)};
    let flowerPtFromMeNormalized = normalizePoint(flowerPtFromMe);
    maxRay.rot = getAngle(flowerPtFromMeNormalized);
    maxDist = getDistance(m.pos,m.preferedPt);
  }else{
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
  }
let move = m.fleeing ? m.urgencyMove : m.move;
  move = m.hunting ? m.huntingMove : move;
  if (maxDist > 0) {
    maxDist = Math.min(move, maxDist);
    if(!preyChased){
      if (maxDist < move) {
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
        let escapeDist = insideRocks[0].diameter / 5 + move;
        m.pos.x = m.pos.x + heading.x * escapeDist;
        m.pos.y = m.pos.y + heading.y * escapeDist;
        isInside = getDistance(insideRocks[0].pos, m.pos) < (insideRocks[0].diameter / 2) - 2;
        i++;
      }
    }else{
      let nearHalf = trueHalf - m.size;
      if(m.pos.x > nearHalf || m.pos.x < -nearHalf || m.pos.y > nearHalf || m.pos.y < -nearHalf )        {
        if(m.pos.x > nearHalf) m.pos.x -= move; 
        if(m.pos.x < -nearHalf) m.pos.x += move; 
        if(m.pos.y > nearHalf) m.pos.y -= move; 
        if(m.pos.y < -nearHalf) m.pos.y += move; 
        m.rot = getRandomRotation(); 
      }
    }
  }
}

function drawRocks() {
  rocks.forEach((r) => {
    drawPoly(r);
  });
}

function drawCircle(r){
    context.save();
    context.beginPath();
    context.fillStyle = "#000000";
    context.fillText(r.name, r.pos.x - 4, r.pos.y);
    context.save();
    context.beginPath();
    context.strokeStyle = "#eeeeee";
    noFill();
    circle(r.pos.x, r.pos.y, r.diameter);
    context.stroke();
    context.restore(); 
}

function drawPoly(r){
  if(!r.poly) return;
  var grd = context.createRadialGradient(r.pos.x, r.pos.y, 5,r.pos.x, r.pos.y, r.diameter/2);
  	grd.addColorStop(0.2, "#7F7272");
  	grd.addColorStop(0.5, "#665A5A");
	grd.addColorStop(0.9, "#534848");
    context.save();
    context.beginPath();
    context.globalAlpha = 1;
    context.fillStyle = grd;
    context.strokeStyle = "#000000";
    context.moveTo(r.poly[0].x, r.poly[0].y);
    let ptsNr = r.poly.length;
    for(let i = 1; i < ptsNr; i++){
        context.lineTo(r.poly[i].x, r.poly[i].y);
    }
    context.closePath();
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

  if (endPt.x <= -trueHalf) {
    endPt.x = -trueHalf + 5;
    if (!equation.horizontal && !equation.vertical) {
      endPt.y = (equation.slope * endPt.x) + equation.c;
    }
  }
  if (endPt.x >= trueHalf) {
    endPt.x = trueHalf - 5;
    if (!equation.horizontal && !equation.vertical) {
      endPt.y = (equation.slope * endPt.x) + equation.c;
    }
  }
  if (endPt.y <= -trueHalf) {
    endPt.y = -trueHalf + 5;
    if (!equation.horizontal && !equation.vertical) {
      endPt.x = (endPt.y - equation.c) / equation.slope;
    }
  }
  if (endPt.y >= trueHalf) {
    endPt.y = trueHalf - 5;
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
    if(m.type === otherMob.type){
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

function createFibers(numFibers,baseLength){
  let result = [];
  const twoPI = 2 * Math.PI;
  for (let i=0; i<numFibers; i++){
    let x1 = random() * width - width/2;
    let y1 = random() * height - height/2;
    let theta = random() * twoPI;
    let segmentLength = random() * baseLength + 2;
    let x2 = cos(theta) * segmentLength + x1;
    let y2 = sin(theta) * segmentLength + y1;
    
    let r = Math.floor(random(15,90));
    let g = Math.floor(random(15,65));
    let b =  Math.floor(random(100,120));
    let color = {r:r,g:g,b:b};
    
    result.push({
    p1: {
      x: x1,
      y: y1
    },
    p2: {
      x: x2,
      y: y2
    },
      color : color
  });
  }
 return result;
}

function drawFibers(){
  let numFibers = fibers.length;
  strokeWeight(3);
  context.globalAlpha = 0.2;
  for (let i=0; i < numFibers; i++){
    stroke(fibers[i].color.r,fibers[i].color.g,fibers[i].color.b);
    line(fibers[i].p1.x,fibers[i].p1.y, fibers[i].p2.x,fibers[i].p2.y);
  }
  strokeWeight(1);
  context.globalAlpha = 1;
}
