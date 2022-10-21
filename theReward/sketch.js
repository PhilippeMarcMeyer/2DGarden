/*
Wip : the red dot figures the hunter and the green one the prey
mobs just move around and avoid the obstacles (the circles and borders)
The hunter catches the preys and find its reward
TODO : fix
the hunter sees its preys even if they are concealed by a rock
10/20/22 : the hunter now pauses to devours its prey and shakes a little
           the hunter is slower than its preys
10/21/22 : gradients, 
*/

const doDrawRays = false;
const mobMagnifier = 3;
const widthAndHeight = 600;
const half = 300;
const polyModels = [[{"x": -0.37,"y": -0.164}, {"x": -0.2,"y": -0.357}, {"x": -0.11,"y": -0.31}, {"x": -0.053,"y": -0.38}, {"x": -0.02,"y": -0.444}, {"x": 0.14,"y": -0.357}, {"x": 0.187,"y": -0.26}, {"x": 0.333,"y": -0.317}, {"x": 0.4,"y": -0.287}, {"x": 0.543,"y": 0.16}, {"x": 0.43,"y": 0.336}, {"x": 0.307,"y": 0.293}, {"x": 0.28,"y": 0.326}, {"x": 0.31,"y": 0.48}, {"x": 0.293,"y": 0.6}, {"x": 0.13,"y": 0.586}, {"x": -0.023,"y": 0.536}, {"x": -0.093,"y": 0.44}, {"x": -0.123,"y": 0.333}, {"x": -0.103,"y": 0.206}, {"x": -0.243,"y": 0.34}, {"x": -0.343,"y": 0.336}, {"x": -0.46,"y": 0.173}, {"x": -0.487,"y": 0.046}, {"x": -0.437,"y": 0.02}, {"x": -0.417,"y": -0.054}, {"x": -0.447,"y": -0.127}, {"x": -0.37,"y": -0.164}],
[{"x": -0.333,"y": -0.38}, {"x": -0.46,"y": -0.194}, {"x": -0.493,"y": 0.15}, {"x": -0.38,"y": 0.456}, {"x": -0.197,"y": 0.646}, {"x": -0.143,"y": 0.82}, {"x": 0.047,"y": 0.783}, {"x": 0.18,"y": 0.606}, {"x": 0.407,"y": 0.416}, {"x": 0.557,"y": 0.28}, {"x": 0.693,"y": 0.19}, {"x": 0.557,"y": -0.117}, {"x": 0.33,"y": -0.19}, {"x": 0.147,"y": -0.414}, {"x": -0.117,"y": -0.464}, {"x": -0.333,"y": -0.38}],
[{"x": -0.05,"y": -0.624},{"x": -0.233,"y": -0.53},{"x": -0.403,"y": -0.394},{"x": -0.483,"y": -0.247},{"x": -0.577,"y": -0.024},{"x": -0.597,"y": 0.16},{"x": -0.57,"y": 0.253},{"x": -0.23,"y": 0.46},{"x": -0.173,"y": 0.56},{"x": -0.13,"y": 0.626},{"x": -0.053,"y": 0.57},{"x": -0.01,"y": 0.473},{"x": 0.153,"y": 0.446},{"x": 0.407,"y": 0.25},{"x": 0.477,"y": 0.03},{"x": 0.53,"y": -0.224},{"x": 0.597,"y": -0.3},{"x": 0.54,"y": -0.414},{"x": 0.387,"y": -0.397},{"x": 0.163,"y": -0.417},{"x": 0.043,"y": -0.517},{"x": -0.05,"y": -0.624}]];

const flowerPolies = [[{"x":0.003,"y":-0.003},{"x":0.028,"y":-0.138},{"x":0.04,"y":-0.253},{"x":0.047,"y":-0.354},{"x":0.043,"y":-0.436},{"x":0.036,"y":-0.506},{"x":0.019,"y":-0.555},{"x":0.004,"y":-0.597},{"x":-0.019,"y":-0.618},{"x":-0.039,"y":-0.631},{"x":-0.063,"y":-0.625},{"x":-0.081,"y":-0.613},{"x":-0.102,"y":-0.583},{"x":-0.112,"y":-0.548},{"x":-0.124,"y":-0.496},{"x":-0.124,"y":-0.44},{"x":-0.122,"y":-0.367},{"x":-0.104,"y":-0.292},{"x":-0.083,"y":-0.201},{"x":-0.044,"y":-0.109},{"x":0.002,"y":-0.002},{"x":0.002,"y":-0.004},{"x":-0.041,"y":-0.128},{"x":-0.081,"y":-0.242},{"x":-0.126,"y":-0.327},{"x":-0.163,"y":-0.406},{"x":-0.206,"y":-0.457},{"x":-0.24,"y":-0.501},{"x":-0.277,"y":-0.523},{"x":-0.303,"y":-0.539},{"x":-0.331,"y":-0.533},{"x":-0.344,"y":-0.525},{"x":-0.36,"y":-0.497},{"x":-0.359,"y":-0.47},{"x":-0.357,"y":-0.425},{"x":-0.338,"y":-0.383},{"x":-0.317,"y":-0.323},{"x":-0.277,"y":-0.27},{"x":-0.231,"y":-0.202},{"x":-0.165,"y":-0.141},{"x":-0.093,"y":-0.067},{"x":0.003,"y":-0.004},{"x":-0.003,"y":0.005},{"x":-0.094,"y":-0.096},{"x":-0.188,"y":-0.168},{"x":-0.262,"y":-0.234},{"x":-0.337,"y":-0.274},{"x":-0.393,"y":-0.311},{"x":-0.449,"y":-0.322},{"x":-0.486,"y":-0.337},{"x":-0.523,"y":-0.327},{"x":-0.538,"y":-0.321},{"x":-0.553,"y":-0.296},{"x":-0.547,"y":-0.276},{"x":-0.541,"y":-0.24},{"x":-0.512,"y":-0.213},{"x":-0.481,"y":-0.172},{"x":-0.429,"y":-0.141},{"x":-0.374,"y":-0.101},{"x":-0.296,"y":-0.073},{"x":-0.215,"y":-0.039},{"x":-0.111,"y":-0.019},{"x":-0.003,"y":0.004},{"x":0.002,"y":0.003},{"x":-0.132,"y":-0.032},{"x":-0.242,"y":-0.064},{"x":-0.345,"y":-0.076},{"x":-0.423,"y":-0.089},{"x":-0.497,"y":-0.084},{"x":-0.545,"y":-0.079},{"x":-0.591,"y":-0.063},{"x":-0.612,"y":-0.049},{"x":-0.63,"y":-0.024},{"x":-0.624,"y":-0.007},{"x":-0.617,"y":0.02},{"x":-0.587,"y":0.037},{"x":-0.556,"y":0.058},{"x":-0.504,"y":0.069},{"x":-0.45,"y":0.083},{"x":-0.375,"y":0.083},{"x":-0.3,"y":0.081},{"x":-0.206,"y":0.064},{"x":-0.112,"y":0.044},{"x":0.002,"y":0.003},{"x":-0.002,"y":0.011},{"x":-0.129,"y":0.031},{"x":-0.249,"y":0.065},{"x":-0.337,"y":0.091},{"x":-0.421,"y":0.127},{"x":-0.475,"y":0.155},{"x":-0.525,"y":0.192},{"x":-0.549,"y":0.217},{"x":-0.57,"y":0.25},{"x":-0.565,"y":0.269},{"x":-0.561,"y":0.293},{"x":-0.534,"y":0.302},{"x":-0.508,"y":0.315},{"x":-0.462,"y":0.308},{"x":-0.419,"y":0.305},{"x":-0.356,"y":0.28},{"x":-0.299,"y":0.257},{"x":-0.224,"y":0.209},{"x":-0.158,"y":0.161},{"x":-0.075,"y":0.088},{"x":-0.002,"y":0.011},{"x":0.007,"y":0.008},{"x":-0.105,"y":0.096},{"x":-0.186,"y":0.171},{"x":-0.261,"y":0.246},{"x":-0.31,"y":0.306},{"x":-0.354,"y":0.367},{"x":-0.372,"y":0.412},{"x":-0.39,"y":0.456},{"x":-0.385,"y":0.484},{"x":-0.381,"y":0.51},{"x":-0.358,"y":0.518},{"x":-0.337,"y":0.524},{"x":-0.301,"y":0.513},{"x":-0.271,"y":0.496},{"x":-0.227,"y":0.462},{"x":-0.189,"y":0.422},{"x":-0.143,"y":0.364},{"x":-0.106,"y":0.299},{"x":-0.062,"y":0.214},{"x":-0.03,"y":0.122},{"x":0.007,"y":0.009},{"x":0.006,"y":0.012},{"x":-0.045,"y":0.133},{"x":-0.09,"y":0.246},{"x":-0.114,"y":0.338},{"x":-0.137,"y":0.423},{"x":-0.14,"y":0.488},{"x":-0.142,"y":0.546},{"x":-0.131,"y":0.584},{"x":-0.12,"y":0.616},{"x":-0.097,"y":0.628},{"x":-0.08,"y":0.633},{"x":-0.052,"y":0.62},{"x":-0.032,"y":0.601},{"x":-0.006,"y":0.564},{"x":0.01,"y":0.522},{"x":0.031,"y":0.461},{"x":0.039,"y":0.397},{"x":0.047,"y":0.313},{"x":0.041,"y":0.227},{"x":0.033,"y":0.12},{"x":0.006,"y":0.013},{"x":0.013,"y":0.007},{"x":0.018,"y":0.147},{"x":0.037,"y":0.259},{"x":0.052,"y":0.361},{"x":0.078,"y":0.437},{"x":0.099,"y":0.505},{"x":0.13,"y":0.548},{"x":0.152,"y":0.586},{"x":0.182,"y":0.6},{"x":0.202,"y":0.609},{"x":0.225,"y":0.597},{"x":0.238,"y":0.581},{"x":0.253,"y":0.547},{"x":0.253,"y":0.511},{"x":0.254,"y":0.457},{"x":0.238,"y":0.402},{"x":0.221,"y":0.332},{"x":0.184,"y":0.264},{"x":0.143,"y":0.18},{"x":0.081,"y":0.1},{"x":0.013,"y":0.007},{"x":0.011,"y":0.01},{"x":0.086,"y":0.119},{"x":0.149,"y":0.221},{"x":0.216,"y":0.292},{"x":0.269,"y":0.36},{"x":0.325,"y":0.399},{"x":0.366,"y":0.435},{"x":0.409,"y":0.446},{"x":0.436,"y":0.457},{"x":0.464,"y":0.442},{"x":0.473,"y":0.434},{"x":0.484,"y":0.401},{"x":0.474,"y":0.377},{"x":0.464,"y":0.331},{"x":0.433,"y":0.297},{"x":0.401,"y":0.242},{"x":0.346,"y":0.202},{"x":0.288,"y":0.144},{"x":0.206,"y":0.104},{"x":0.121,"y":0.046},{"x":0.011,"y":0.011},{"x":0.017,"y":-0.002},{"x":0.127,"y":0.078},{"x":0.238,"y":0.121},{"x":0.323,"y":0.171},{"x":0.408,"y":0.189},{"x":0.469,"y":0.215},{"x":0.529,"y":0.209},{"x":0.565,"y":0.217},{"x":0.601,"y":0.196},{"x":0.612,"y":0.189},{"x":0.623,"y":0.158},{"x":0.61,"y":0.143},{"x":0.597,"y":0.107},{"x":0.561,"y":0.091},{"x":0.524,"y":0.055},{"x":0.463,"y":0.041},{"x":0.402,"y":0.012},{"x":0.318,"y":0.007},{"x":0.233,"y":-0.01},{"x":0.125,"y":-0.002},{"x":0.017,"y":-0.001},{"x":0.011,"y":0.004},{"x":0.151,"y":0.003},{"x":0.264,"y":0.01},{"x":0.367,"y":-0.005},{"x":0.446,"y":-0.009},{"x":0.517,"y":-0.034},{"x":0.562,"y":-0.047},{"x":0.603,"y":-0.077},{"x":0.62,"y":-0.093},{"x":0.632,"y":-0.124},{"x":0.622,"y":-0.136},{"x":0.609,"y":-0.163},{"x":0.575,"y":-0.17},{"x":0.54,"y":-0.186},{"x":0.486,"y":-0.181},{"x":0.431,"y":-0.184},{"x":0.359,"y":-0.164},{"x":0.286,"y":-0.147},{"x":0.199,"y":-0.106},{"x":0.111,"y":-0.065},{"x":0.011,"y":0.003},{"x":0.012,"y":-0.006},{"x":0.132,"y":-0.056},{"x":0.239,"y":-0.117},{"x":0.32,"y":-0.164},{"x":0.391,"y":-0.219},{"x":0.439,"y":-0.26},{"x":0.476,"y":-0.307},{"x":0.496,"y":-0.338},{"x":0.507,"y":-0.374},{"x":0.499,"y":-0.392},{"x":0.488,"y":-0.413},{"x":0.461,"y":-0.417},{"x":0.431,"y":-0.421},{"x":0.39,"y":-0.405},{"x":0.347,"y":-0.39},{"x":0.293,"y":-0.353},{"x":0.242,"y":-0.315},{"x":0.183,"y":-0.253},{"x":0.128,"y":-0.189},{"x":0.066,"y":-0.099},{"x":0.012,"y":-0.006},{"x":0.006,"y":-0.002},{"x":0.092,"y":-0.114},{"x":0.155,"y":-0.206},{"x":0.208,"y":-0.297},{"x":0.242,"y":-0.366},{"x":0.269,"y":-0.436},{"x":0.277,"y":-0.484},{"x":0.283,"y":-0.532},{"x":0.272,"y":-0.557},{"x":0.261,"y":-0.582},{"x":0.238,"y":-0.583},{"x":0.215,"y":-0.586},{"x":0.184,"y":-0.564},{"x":0.158,"y":-0.542},{"x":0.124,"y":-0.497},{"x":0.096,"y":-0.451},{"x":0.066,"y":-0.382},{"x":0.045,"y":-0.311},{"x":0.023,"y":-0.217},{"x":0.013,"y":-0.121},{"x":0.006,"y":-0.002}]];

const letters = "A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z".split(",");
const preyNr = 8; // not to many as it defers the game init (9 or 10 max)
const flowerNr = 17;
const flowerColors = ["#AE4FBE","#D792EF","#6FADDF","#AE6FBE","#D794EF","#7FADDF"];


let inGame = false;
let rayNumber = 15;
let fibers = [];
let rockModels = [];
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
  move: 4,
  pos: {
    x: -1000,
    y: -1000
  },
  rot: 0,
  drawnRot : 0,
  mobList : []
}];
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
  letters.forEach((letter) => {
  rockModels.push({
    "name": letter,
    "diameter": Math.floor(random(40,100) + 0.5),
    "pos": {
      "x": Math.floor(random(-half,half) + 0.5),
      "y": Math.floor(random(-half,half) + 0.5)
    },
    "poly": getPolyModel(Math.floor(random(0,2) + 0.5))
  });
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
        pt.x = (pt.x * r.diameter * 0.7) + r.pos.x;
        pt.y = (pt.y * r.diameter * 0.7) + r.pos.y;
      });
    }
    return rock;
  });
  
  for(let i = 0 ; i < flowerNr-1 ; i++){
    let flower = {pos:{}};
    flower.poly = JSON.parse(JSON.stringify(flowerPolies));
    flower.pos.x = Math.floor(random(-half,half) + 0.5);
    flower.pos.y = Math.floor(random(-half,half) + 0.5);
    flower.size = Math.floor(random(15,65) + 0.5);
    flower.color = flowerColors[Math.floor(Math.random(0,flowerColors.length-1) + 0.5)];
    flower.poly.forEach((petal) => {
          petal.forEach((pt) => {
            pt.x = (pt.x * flower.size) + flower.pos.x;
            pt.y = (pt.y * flower.size) + flower.pos.y;
          });
      });
    flowers.push(flower);
  }
  
  for(let i = 0;i < preyNr; i++){
    mobs.push({
    id: i+2,
    fleeing : false,
    specie: "bug",
    type: "prey",
    color: "#EBB667",
    size: 6,
    move: Math.floor(random(5,8)+0.5),
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
}

function draw() {
  let nrPreys = mobs.filter((m) => {
    return m.type == "prey";
  }).length;
  if(nrPreys == 0){
    location.reload();
  } 
  frameRate(12)
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
    setStartingMobPositions()
  } else {
    mobs.forEach((m) => {
      drawMob(m);
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
          m.stopFor = Math.round(frameRate()) * 1;
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
        if(m.pos.x > nearHalf) m.pos.x -= m.move; 
        if(m.pos.x < -nearHalf) m.pos.x += m.move; 
        if(m.pos.y > nearHalf) m.pos.y -= m.move; 
        if(m.pos.y < -nearHalf) m.pos.y += m.move; 

        m.rot = getRandomRotation(); 
      }
    }
  }
  m.drawnRot = getDistance(previousPos,m.pos) < 3 ? previousRot : m.rot;
}

function drawRocks() {
  rocks.forEach((r) => {
    drawPoly(r);
    //drawCircle(r)
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
    //context.stroke();
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
  let d0 =  m.size*0.95;
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
  let stopRot = m.stopFor > 0 ? (frameCount%2 == 0 ? 0.05: -0.05 ) : 0;
  let heading = polarToCartesian(m.drawnRot+stopRot);
  let headPoint = {x:0,y:0};
  headPoint.x = m.pos.x + heading.x * d2;
  headPoint.y = m.pos.y + heading.y * d2;
  let rotAntenna = m.drawnRot+0.3;
  let antenaPt = polarToCartesian(rotAntenna);
  antenaPt.x = headPoint.x + antenaPt.x * d0
  antenaPt.y = headPoint.y + antenaPt.y * d0;
  line(headPoint.x,headPoint.y,antenaPt.x,antenaPt.y);
  
  rotAntenna = m.drawnRot-0.3;
  antenaPt = polarToCartesian(rotAntenna);
  antenaPt.x = headPoint.x + antenaPt.x * d0
  antenaPt.y = headPoint.y + antenaPt.y * d0;
  line(headPoint.x,headPoint.y,antenaPt.x,antenaPt.y);
  
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
