let w2, h2, w4, h4, k90degres, k60degres, k45degres, k180degres, k270degres, k360degres, k80degres, k280degres, camFov, focalW, focalH, zoom, focalAverage;
let needUpdate, saveContext, context, _camera, mode, things, debugMode, scribble;
let worldModel, gameLoaded, floor;
let keys = { up: false, down: false, left: false, right: false }

const framerate = 50;
const camOverPlantLimit = 40;

function setup() {
	debugMode = false;
	gameLoaded = false;
	frameRate(framerate);
	loadJSON('/files/world1.json', result => {
		worldModel = { ...result }
		things = setNotMobs(worldModel);
		createCanvas(windowWidth, windowHeight);
		setUtilValues();
		translate(width / 2, height / 2);
		context = drawingContext;
		_camera = new Kamera(framerate / 350, 350 / framerate, toradians(90)); 
		setKeyDown();
		setKeyUp();
		floor = new Floor(worldModel);
		gameLoaded = true;
	});
}

function draw() {
	if (!gameLoaded) return;
	translate(width / 2, height / 2);
	clear();
	floor.draw();
	_camera.setDirection();
	things
		.filter((t) => {
			return !(t instanceof Plant) || (t instanceof Plant && t.collider.dim2 < camOverPlantLimit)
		})
		.forEach(function (thing) {
			thing.draw();
		});
	_camera.draw();
	things
		.filter((t) => {
			return (t instanceof Plant && t.collider.dim2 >= camOverPlantLimit);
		})
		.forEach(function (thing) {
			thing.draw();
		});

		if(debugMode){
			text(`Center                   : ${worldModel.currentCenter.x},${worldModel.currentCenter.y}`, -w2+20, -h2+20);
			text(`LadyBug position :${_camera.position.x},${_camera.position.y}`, -w2+20, -h2+40);
			text(`LadyBug distance : ${_camera.distance}`, -w2+20, -h2+60);
			text(`world radius          : ${worldModel.radius}`, -w2+20, -h2+80);
		}
}

// Utilities
function drawingPositionGet(truePosition) {
	return {
		"x": worldModel && worldModel.currentCenter ? truePosition.x - worldModel.currentCenter.x : truePosition.x,
		"y": worldModel && worldModel.currentCenter ? truePosition.y - worldModel.currentCenter.y : truePosition.y
	};
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	setUtilValues();
	translate(width / 2, height / 2);
	context = drawingContext;
}

function setUtilValues() {
	w2 = width / 2;
	h2 = height / 2;
	w4 = width / 4;
	h4 = height / 4;
	k90degres = toradians(90);
	k60degres = toradians(60);
	k45degres = toradians(45);
	k180degres = toradians(180);
	k270degres = toradians(270);
	k360degres = toradians(360);
	k80degres = toradians(80);
	k280degres = toradians(280);
	camFov = k45degres;
	focalW = w2 / Math.tan(camFov / 2);
	focalH = h2 / Math.tan(camFov / 2);
	zoom = 4;
	focalAverage = (focalW + focalH) / 2;
}

// Converts from degrees to radians.
function toradians(degrees) {
	return degrees * Math.PI / 180;
}

// Converts from radians to degrees.
function todegrees(radians) {
	return radians * 180 / Math.PI;
}

function Floor(worldModel){
	this.name = worldModel.name;
    this.radius = worldModel.radius;
    this.backgroundColor = worldModel.baseColor;
	this.perimeterColor = worldModel.perimeterColor;
    this.center = worldModel.currentCenter;
	this.shapes = worldModel.data && worldModel.data.floor && worldModel.data.floor.shapes ? worldModel.data.floor.shapes : [];
	this.elements = [];

	this.init = function () {
		let self = this;
		if (self.shapes.length > 0) {
			self.shapes.forEach((s) => {
				if (s.shape === "circle") {
					let cos = Math.cos(s.angleToOrigine);
					let sin = -Math.sin(s.angleToOrigine);
					let element = {};
					// the real position according to origin point
					element.center = { x: Math.floor(cos * s.distance), y: Math.floor(sin * s.distance) };
					element.shape = s.shape;
					element.color0 = s.color === "baseColor" ? worldModel.baseColor: s.color;
					let colorAmount = s.way === "up" ? 10 : -10;
					element.color1 = LightenDarkenColor(element.color0,colorAmount);
					element.color2 = LightenDarkenColor(element.color1,colorAmount);
					element.opacity = s.opacity;
					element.diameter1 = s.size[0];
					element.diameter2 = Math.floor(element.diameter1 / 2);
					self.elements.push(element);
				}else if(s.shape === "polygon"){
					let cos = Math.cos(s.angleToOrigine);
					let sin = -Math.sin(s.angleToOrigine);
					let element = {};
					// the real position according to origin point
					element.center = { x: Math.floor(cos * s.distance), y: Math.floor(sin * s.distance) };
					element.shape = s.shape;
					element.color = s.color === "baseColor" ? worldModel.baseColor: s.color;
					element.opacity = s.opacity;
					element.size = s.size[0];
					element.points = s.matrix.map((pt)=>{
						return simpleRotate(pt,s.innerRotation);
					});
					element.points.forEach((pt)=>{
						pt.x = element.center.x + (element.size * pt.x);
						pt.y = element.center.y + (element.size * pt.y);
					})
					if(s.colliderMode){
						element.collider = {
							shape:"poly",
							center : element.center,
							data: [...element.points],
							dim2 : null,
							mode : s.colliderMode
						}
					}
					self.elements.push(element);
				}
			});
		}
	}

	this.draw = function () {
		let self = this;
		context.save();
		context.beginPath();
		context.fillStyle = self.backgroundColor;
		context.strokeStyle = self.perimeterColor;
		context.rect(-w2, -h2, width, height);
		context.closePath();
		context.fill();
		context.stroke();
		context.restore();

		self.elements.forEach((elem) => {
			if (elem.shape === "cirxxcle") {
				context.save();
				context.beginPath();
				let centralPt = drawingPositionGet({ ...elem.center });
				context.fillStyle = elem.color1;
				context.strokeStyle = elem.color1;
				context.globalAlpha = elem.opacity;
				context.arc(centralPt.x, centralPt.y, elem.diameter1, 0, 2 * Math.PI);
				context.closePath();
				context.fill();
				context.stroke();

				context.beginPath();
				context.fillStyle = elem.color2;
				context.strokeStyle = elem.color2;
				context.globalAlpha = elem.opacity;
				context.arc(centralPt.x, centralPt.y, elem.diameter2, 0, 2 * Math.PI);
				context.closePath();
				context.fill();
				context.stroke();
				context.restore();
			}else if(elem.shape === "polygon"){
				context.save();
				context.beginPath(); 
				context.globalAlpha = elem.opacity;
				context.fillStyle = elem.color;
				context.strokeStyle =  elem.color;
				let drawPos = drawingPositionGet(elem.points[0]);
				context.moveTo(drawPos.x, drawPos.y);
				elem.points.forEach((pt)=>{
					drawPos = drawingPositionGet(pt);
					context.lineTo(drawPos.x, drawPos.y);
				})
				context.closePath();
				context.stroke();
				context.fill();
				context.restore();
			}
		});
	}

	this.init();

	return this;
}

function Kamera(rotStep,walkStep,rotation) {
	this.knownThings = [];
	this.rotation = rotation ? rotation : 0; 
	this.position = {x:0,y:0};
	this.distance = 0;
	this.previousLocation = {x:0,y:0}; 
	this.antePenultLocation = {x:0,y:0}; 
	this.isMoving = false;
	this.sightWidth = toradians(90);
	this.sightLength = 200;
	this.walkStep = walkStep;
	this.rotStep = rotStep;
	this.bodyRadius = 20;
	this.bodyInMotionDiameter1 = 18;
	this.bodyInMotionDiameter2 = 22;
	this.wLimit = w2 - w4;
	this.hLimit = h2 -h4;

	this.turn = function(amount){ // -1 or +1
		this.rotation -= this.rotStep*amount;
		if(this.rotation<0) this.rotation  += k360degres;
		if(this.rotation > k360degres ) this.rotation = 0;
	}

	this.setDirection = function(){

		_camera.isMoving = false;

		if(keys.left){
			_camera.turn(-1);
		}
		if(keys.right){
			_camera.turn(1);
		}
		if(keys.up){
			_camera.walk(1);
			_camera.isMoving = true;
		}	
		if(keys.down){
			_camera.walk(-0.45,true);
			_camera.isMoving = true;

		}	
	}
	this.getDistance = function(ptA,ptB){
		let w = Math.abs(ptA.x - ptB.x);
		let h = Math.abs(ptA.y - ptB.y);
		return Math.sqrt(Math.pow(w + h,2));
	}

	this.walk = function(amount,rnd){// -1 or +1
		var self = this;
		// Calculate new position considering the amount, the position and the direction	
		this.savePosition();
		//amount *= self.walkStep;
		let drawPos = drawingPositionGet(self.position);
		self.distance = self.getDistance({x:0,y:0},worldModel.currentCenter);
		let randomized = 0;
		if(rnd){
			let flipCoin = Math.floor(Math.random() * 2)
			randomized = Math.random();
			randomized*= flipCoin == 1 ? -1 : 1;
		}
		let rotation = this.rotation + randomized;
		var dirx = Math.cos(rotation);
		var dirz = - Math.sin(rotation);
		self.position.x = Math.floor(self.position.x + (dirx * amount * self.walkStep)); 
		self.position.y = Math.floor(self.position.y + (dirz * amount * self.walkStep));

		let didMove = true;

		floor.elements
			.forEach((x) => {
				if(x.collider && x.collider.shape === "poly"){
					if (collideCirclePoly(self.position.x, self.position.y, self.bodyRadius * 2, x.collider.data)) {
						self.restorePosition();
						didMove = false;
						console.log("STOP");
					}
				}
			});

		if (didMove) {
			if (drawPos.x > self.wLimit) {
				worldModel.currentCenter.x += (self.position.x - self.previousLocation.x);
			} else if (drawPos.x < self.wLimit) {
				worldModel.currentCenter.x -= (self.previousLocation.x - self.position.x);
			}

			if (drawPos.y > self.hLimit) {
				worldModel.currentCenter.y += (self.position.y - self.previousLocation.y);
			} else if (drawPos.y < self.hLimit) {
				worldModel.currentCenter.y -= (self.previousLocation.y - self.position.y);
			}
		}
	}

	this.draw = function(){
		var self = this;
		
	    self.checkCollisions();
		self.drawCross();
		self.drawCamera();
		//self.drawScanner();
	}

	this.checkCollisions = function () {
		var self = this;
		things.forEach(function (x) {
			if(x.collider.shape === 'poly'){
				if (collideCirclePoly(self.position.x, self.position.y, self.bodyRadius * 2, x.collider.data)) {
					self.restorePosition();
				}
			}else if(x.collider.shape === 'circle'){
				if (collideCircleCircle(self.position.x, self.position.y, self.bodyRadius * 2, x.collider.center.x,x.collider.center.y, x.collider.data)) {
					x.shake();
				}
			}
		});
	}
	
	this.drawCross = function () {
		context.save();
		context.globalAlpha = 0.4;
		context.beginPath();
		context.strokeStyle = "green";
		context.fillStyle = "white";
		var camCos = Math.cos(k90degres);
		var camSin = -Math.sin(k90degres);

		var vectorCam = {
			x: camCos * 50,
			y: camSin * 50
		};

		var west = drawingPositionGet(simpleRotate(vectorCam, k90degres));
		var east = drawingPositionGet(simpleRotate(vectorCam, -k90degres));
		var north = drawingPositionGet(vectorCam);
		var south = drawingPositionGet(simpleRotate(vectorCam, -k180degres));

		context.beginPath();
		context.strokeStyle = "black";
		context.moveTo(west.x, west.y);
		context.lineTo(east.x, east.y);
		context.moveTo(north.x, north.y);
		context.lineTo(south.x, south.y);
		context.closePath();
		context.stroke();

		context.beginPath();
		context.fillStyle = "black";
		context.fillText("W", west.x - 5, west.y);
		context.fillText("E", east.x - 5, east.y);
		context.fillText("N", north.x - 5, north.y);
		context.fillText("S", south.x - 5, south.y);
		context.closePath();
		context.stroke();

		context.restore();
	}
	
	this.drawCamera=function(){
		let self = this;
		let drawPos = drawingPositionGet(this.position);
		//self.drawScanner();
		// Body

		let camCos = Math.cos(_camera.rotation + k90degres);
		let camSin = -Math.sin(_camera.rotation + k90degres);
		let ptdot1 = {
			x: camCos * -9,
			y: camSin * -9
		};
		let ptdot2 = {
			x: camCos * 9,
			y: camSin * 9
		};

		camCos = Math.cos(_camera.rotation);
		camSin = -Math.sin(_camera.rotation);

		let ptdot3 = {x:camCos* -10,y:camSin* -10};
		context.save();

		context.globalAlpha=1;	
		
		context.beginPath();
		context.strokeStyle="black"; 
		context.fillStyle="red"; 
		
		context.beginPath();
		if(self.isMoving){
			if(frameCount % 4 === 0){
				context.ellipse(drawPos.x, drawPos.y, this.bodyRadius, this.bodyInMotionDiameter2,_camera.rotation*-1, 0, 2 * Math.PI);
			}else{
				context.ellipse(drawPos.x, drawPos.y, this.bodyRadius, this.bodyInMotionDiameter1,_camera.rotation*-1, 0, 2 * Math.PI);
			}
		}else{
			context.ellipse(drawPos.x, drawPos.y, this.bodyRadius, this.bodyRadius * 0.9,_camera.rotation*-1, 0, 2 * Math.PI);
		}

		context.closePath();
		context.stroke();
		context.fill();
		context.stroke();

		context.beginPath();
		context.strokeStyle="#111"; 
		context.fillStyle="#111"; 
		circle(drawPos.x + ptdot1.x,drawPos.y + ptdot1.y,6);
		circle(drawPos.x + ptdot2.x,drawPos.y + ptdot2.y,6);
		circle(drawPos.x + ptdot3.x,drawPos.y + ptdot3.y,6);
		context.closePath();
		context.stroke();
		context.fill();

		// right Eye
		let eyeCos = Math.cos(_camera.rotation-0.4);
		let eyeSin = -Math.sin(_camera.rotation-0.4);
		let vectorEye= {x:eyeCos*30,y:eyeSin*30};
		let pupilCos = Math.cos(_camera.rotation-0.3);
		let pupilSin = -Math.sin(_camera.rotation-0.3);
		let vectorPupil= {x:pupilCos*30,y:pupilSin*30};

		context.fillStyle="white"; 
		context.beginPath();
		context.arc(drawPos.x+(vectorEye.x*0.5),drawPos.y+(vectorEye.y*0.5), (this.bodyRadius/4),0, 2*Math.PI,false);
		context.closePath();
		context.stroke();
		context.fill();

		context.fillStyle="black"; 
		context.beginPath();
		context.arc(drawPos.x+(vectorPupil.x*0.6), drawPos.y+(vectorPupil.y*0.6), (this.bodyRadius/8),0, 2*Math.PI,false);
		context.closePath();
		context.stroke();
		context.fill();

		//strokeWeight(10);
		// left Eye
		eyeCos = Math.cos(_camera.rotation+0.4);
		eyeSin = -Math.sin(_camera.rotation+0.4);
		vectorEye= {x:eyeCos*30,y:eyeSin*30};
		pupilCos = Math.cos(_camera.rotation+0.3);
		pupilSin = -Math.sin(_camera.rotation+0.3);
		vectorPupil= {x:pupilCos*30,y:pupilSin*30};
		context.fillStyle="white"; 
		context.beginPath();
		context.arc(drawPos.x+(vectorEye.x*0.5),drawPos.y+(vectorEye.y*0.5), (this.bodyRadius/4),0, 2*Math.PI,false);
		context.closePath();
		context.stroke();
		context.fill();

		context.fillStyle="black"; 
		context.beginPath();
		context.arc(drawPos.x+(vectorPupil.x*0.6), drawPos.y+(vectorPupil.y*0.6), (this.bodyRadius/8),0, 2*Math.PI,false);
		context.closePath();
		context.stroke();
		context.fill();

		context.restore();
	}

	this.drawScanner=function(){
		context.save();
		context.globalAlpha=0.35;
		context.beginPath();
		var rotationLeftLimit = _camera.rotation-this.sightWidth/2;
		var rotationRightLimit = _camera.rotation+this.sightWidth/2;

		context.strokeStyle="rgb(255,255,0)"; 
		var ray;
		things.forEach(function(x){
			x.hit = false;
			x.hitAngles.length = 0;
		});
		var relativeAngle = - this.sightWidth/2;
		var step = 0.02;
		var rayLength =  this.sightLength-this.bodyRadius;
		for(var i = rotationLeftLimit;i <= rotationRightLimit;i+=step){
			camCos = Math.cos(i);
			camSin = -Math.sin(i);
			
			var start = {"x":_camera.position.x+camCos*this.bodyRadius,"y":_camera.position.y+camSin*this.bodyRadius};
			context.moveTo(start.x, start.y);
			
			ray= {x:camCos*rayLength,y:camSin*rayLength};
			var end = {"x":start.x+ray.x,"y":start.y+ray.y};
			context.lineTo(end.x,end.y);
			things.forEach(function(x){
				
				var poly = x.geometry.data2D;
			/*
				if(collideLinePoly(start.x,start.y,end.x,end.y,poly)){
					x.hit = true;
					x.hitAngles.push(relativeAngle);
				}	
				*/				
			});
			relativeAngle += step;
		}
		things.forEach(function(x){
			if(x.hit){
				var nrHits = x.hitAngles.length;
				if(nrHits==0){
					x.hit = false;
				}else if(nrHits==1){
					x.hitMiddleAngle = x.hitAngles[0];
				}else{
					x.hitMiddleAngle = x.hitAngles[Math.floor((nrHits-1)/2)];
				}
			}
		
		});
		
		context.moveTo(_camera.position.x, _camera.position.y);
		camCos = Math.cos(rotationRightLimit);
		camSin = -Math.sin(rotationRightLimit);
		ray= {x:camCos*this.sightLength,y:camSin*this.sightLength};
		context.lineTo(_camera.position.x+ray.x,_camera.position.y+ray.y);
		context.closePath();
		context.stroke();

		context.beginPath();
		context.moveTo(_camera.position.x, _camera.position.y);
		context.arc(_camera.position.x, _camera.position.y, this.sightLength, -rotationRightLimit, -rotationLeftLimit,false);
		
		context.closePath();
		context.stroke();
		context.restore();
	}	
	
	this.savePosition = function(){
		
		this.antePenultLocation.x = this.previousLocation.x;
		this.antePenultLocation.y = this.previousLocation.y;
		
		this.previousLocation.x = this.position.x;
		this.previousLocation.y = this.position.y;
	}
	
	this.restorePosition = function(){
		this.position.x = this.previousLocation.x;
		this.position.y = this.previousLocation.y;
		
		this.previousLocation.x = this.antePenultLocation.x;
		this.previousLocation.y = this.antePenultLocation.y;
	}

}

function setNotMobs(world){
	let notMobs = [];
    world.data.rocks.forEach((r)=>{
		notMobs.push(new PolyThing(r));
	});
	notMobs.forEach(function (t) {
		t.init();
	});
	let notMobsPlants = [];
	world.data.plants.forEach((r)=>{
		notMobsPlants.push(new Plant(r));
	});
	notMobsPlants.forEach(function (t) {
		t.init();
	});
	notMobsPlants.sort((a,b) => {
		return a.collider.dim2 - b.collider.dim2;
	});
	notMobs = notMobs.concat(notMobsPlants);
	return notMobs;
}

function Plant(data) {
	this.birth = new Date(data.birth);
	this.today = new Date();
	this.age = Math.floor((this.today.getTime() - this.birth.getTime()) / (1000 * 3600 * 24));
	this.size = Math.min(this.age * data.size.growthPerDay + data.size.min, data.size.max);
	this.distance = data.distance;
	this.angleToOrigine = data.angleToOrigine;
	this.name = data.name;
	this.innerRotation = data.innerRotation;
	this.positionAbsolute = { x: 0, y: 0 };
	this.positionRelative = { x: 0, y: 0 };
	this.half = Math.floor(this.size / 2);
	this.shape = data.shape;
	this.hit = false;
	this.hitAngles = [];
	this.hitMiddleAngle = 0;
	this.color = data.color;
	this.leaves = data.leaves || null;
	this.model = data.model ? data.model : null;
	this.collider = {
		shape: "circle",
		center : null,
		data: null,
		dim2 : null
	}
	this.init = function () {
		let self = this;
		if (self.leaves === null) {
			if(self.model){
				let modelQueryResult = worldModel.data.models.filter((x) => { return x.name === self.model});
				if(modelQueryResult.length === 1){
					self.leaves = {...modelQueryResult[0].leaves};
				}
			}
		}
		if (self.leaves === null) {
			throw 'Not implemented plant : ' + self.name;
		}
		let spikesRadius = Math.min(self.age * self.leaves.leafModel.size.growthPerDay + self.leaves.leafModel.size.min, self.leaves.leafModel.size.max);
		self.geometry = {};
		self.geometry.heart = { shape: self.shape, color: self.color, diameter: self.size, center: null };
		self.collider.data = self.size;
		if (self.leaves === null) {
			self.geometry.crown = null;
		} else {
			self.geometry.crown = { shape: self.leaves.shape, color: self.leaves.leafModel.color,number: self.leaves.number, radius: spikesRadius }
			self.geometry.crown.spikes = [];
			if (self.geometry.crown.shape === "double-curve" || self.geometry.crown.shape === "double-bezier") {
				for (let i = 0; i < self.geometry.crown.number; i++) {
					let matrix = [...self.leaves.leafModel.matrix];
					self.geometry.crown.spikes.push({
						curveLeft: {
							ctrlPt1: matrix[0],
							pt1: matrix[1],
							pt2: matrix[2],
							ctrlPt2: matrix[3]
						},
						curveRight: {
							ctrlPt1: matrix[4],
							pt1: matrix[5],
							pt2: matrix[6],
							ctrlPt2: matrix[7]
						}
					})
				}
				// the real position according to origin point
				let cos = Math.cos(self.angleToOrigine);
				let sin = -Math.sin(self.angleToOrigine);
				self.positionAbsolute.x = Math.floor(cos * self.distance);
				self.positionAbsolute.y = Math.floor(sin * self.distance);
				self.geometry.heart.center = { x: self.positionAbsolute.x, y: self.positionAbsolute.y };
				self.collider.center = { x: self.positionAbsolute.x, y: self.positionAbsolute.y };
				const spikeRadius = self.geometry.crown.radius;
				self.collider.dim2 = spikeRadius;
				self.geometry.crown.spikes.forEach((spike, index) => {
					for (const key in spike.curveLeft) {
						let centralPoint = { ...self.positionAbsolute };
						spike.curveLeft[key] = simpleRotate(spike.curveLeft[key],self.innerRotation+self.leaves.leafModel.angles[index]);
						spike.curveLeft[key].x = Math.floor(centralPoint.x + (spike.curveLeft[key].x * spikeRadius));
						spike.curveLeft[key].y = Math.floor(centralPoint.y + (spike.curveLeft[key].y * spikeRadius));
					}
					for (const key in spike.curveRight) {
						let centralPoint = { ...self.positionAbsolute };
						spike.curveRight[key] = simpleRotate(spike.curveRight[key],self.innerRotation+self.leaves.leafModel.angles[index]);
						spike.curveRight[key].x = Math.floor(centralPoint.x + (spike.curveRight[key].x * spikeRadius));
						spike.curveRight[key].y = Math.floor(centralPoint.y + (spike.curveRight[key].y * spikeRadius));
					}
			});
			}else{
				throw 'Not implemented plant crown shape : ' + self.geometry.crown.shape;
			}
		}
	}
	this.shake = function () {
		var self = this;
		self.animation = [-2, 2, -2, 2, -2, 2, -2, 2, -2, 2, -2, 2, -2, 2, -2, 2];
	}
	this.draw = function () {
		var self = this;
		isVisible = true;
		if(!isVisible) return;
		if(self.geometry && self.geometry.crown ){
			if(self.geometry.crown.shape === "double-curve" || self.geometry.crown.shape === "double-bezier"){
				let color = self.geometry.crown.color;
				self.geometry.crown.spikes.forEach((spike)=>{
					let leftPts = {...spike.curveLeft};
					let rightPts = {...spike.curveRight};

					for (const key in leftPts) {
						leftPts[key] = drawingPositionGet(leftPts[key]);
					}
					for (const key in rightPts) {
						rightPts[key] = drawingPositionGet(rightPts[key]);
					}
					context.save();
					if (self.animation && self.animation.length > 0) {
						translate(self.animation[0], self.animation[0]);
						self.animation.shift();
					} 
					context.globalAlpha = 1;
					context.strokeStyle = color;
					context.fillStyle = color;
					context.beginPath();
					if (self.geometry.crown.shape === "double-curve") {
						curve(leftPts.ctrlPt1.x, leftPts.ctrlPt1.y, leftPts.pt1.x, leftPts.pt1.y, leftPts.pt2.x, leftPts.pt2.y, leftPts.ctrlPt2.x, leftPts.ctrlPt2.y);
						curve(rightPts.ctrlPt1.x, rightPts.ctrlPt1.y, rightPts.pt1.x, rightPts.pt1.y, rightPts.pt2.x, rightPts.pt2.y, rightPts.ctrlPt2.x, rightPts.ctrlPt2.y);
					}
					if (self.geometry.crown.shape === "double-bezier") {
						context.strokeStyle = LightenDarkenColor(color,60);
						bezier(leftPts.pt1.x, leftPts.pt1.y,leftPts.ctrlPt1.x, leftPts.ctrlPt1.y,leftPts.ctrlPt2.x, leftPts.ctrlPt2.y,  leftPts.pt2.x, leftPts.pt2.y);
						bezier( rightPts.pt1.x, rightPts.pt1.y,rightPts.ctrlPt1.x, rightPts.ctrlPt1.y, rightPts.ctrlPt2.x, rightPts.ctrlPt2.y, rightPts.pt2.x, rightPts.pt2.y);
					}
					context.closePath();
					context.stroke();
					context.fill();
					context.restore();

				});
				if(self.geometry.heart.shape === 'circle'){
					context.save();
					context.strokeStyle = self.geometry.heart.color;
					context.fillStyle = self.geometry.heart.color;
					context.beginPath();
					let centralPt = drawingPositionGet({...self.geometry.heart.center});
					circle(centralPt.x, centralPt.y, self.geometry.heart.diameter);
					if (debugMode) text(self.name, centralPt.x + 20, centralPt.y);
					context.closePath();
					context.stroke();
					context.fill();
					context.restore();
				}
			}
		}
	}
}

function PolyThing(data) {
	if (!data.matrix){
		matrix = [{x:-1,y:-1},{x:1,y:-1},{x:1,y:1},{x:-1,y:1}];
	}

    this.size = data.size;
    this.distance = data.distance;
    this.angleToOrigine = data.angleToOrigine;
    this.name = data.name;
    this.innerRotation = data.innerRotation;
    this.positionAbsolute = { x: 0, y: 0 };
    this.positionRelative = { x: 0, y: 0 };
    this.half = Math.floor(data.size / 2);
    this.geometry = {data2D:data.matrix};
    this.hit = false;
    this.hitAngles = [];
    this.hitMiddleAngle = 0;
	this.colors= data.colors.split(",");
	this.borderColor = LightenDarkenColor(this.colors[0], -20);
	this.repeat = data.repeat;
	this.collider = {
		shape:"poly",
		data:null
	}

	this.init = function(){
		let self = this;
		if(Array.isArray(self.geometry.data2D[0])){
			self.repeat=0;
		}else{
			let copyGeometry = [...self.geometry.data2D];
			self.geometry.data2D.length=0;
			self.geometry.data2D.push(copyGeometry);
			if(self.repeat > 0){
				for(let i=0;i<self.repeat;i++){
					let arr = [];
					self.geometry.data2D[i].forEach((position, index)=>{
						if(index%5!=0){
							arr.push({x:position.x*.7,y:position.y*0.7});
						}
					})
					self.geometry.data2D.push(arr);
				}
			}
		}
		if(!self.colors[0]) self.colors[0] = "#ccc";
        let prevColor = self.colors[0];
		while(self.colors.length < self.geometry.data2D.length){
        	prevColor = LightenDarkenColor(prevColor,10);
			self.colors.push(prevColor);
		}

		var cos = Math.cos(self.angleToOrigine);
		var sin = -Math.sin(self.angleToOrigine);
	
		// the real position according to origin point
		self.positionAbsolute.x = Math.floor(cos * self.distance);
		self.positionAbsolute.y = Math.floor(sin * self.distance);
	
		self.geometry.data2D.forEach((arr, index)=>{
			let rotatedPoints = arr.map((pt)=>{
				return simpleRotate(pt,self.innerRotation);
			});
			arr = [...rotatedPoints];
		});
	
		self.geometry.data2D.forEach((arr)=>{
			arr.forEach((pt)=>{
			pt.x = self.positionAbsolute.x + (self.half * pt.x);
			pt.y = self.positionAbsolute.y + (self.half * pt.y);
		})});
		self.collider.data = self.geometry.data2D[0];
	}
   

    this.draw = function () {
        // the _camera moves : the objects stay stationnary so the positionRelative == positionAbsolute
        var self = this;
		/*
		var isVisible = false;
		if(_camera.knownThings.indexOf(self.name) != -1){
			isVisible = true;
		}else{
			if(self.hit){
				_camera.knownThings.push(self.name);
				isVisible = true;
			}
		}
		*/
		isVisible = true;

		if(!isVisible) return;
		self.geometry.data2D.forEach((arr,index)=>{
			context.save();
			context.globalAlpha = 1;
			context.fillStyle = self.colors[index];
			context.strokeStyle = index === 0 ? self.borderColor : self.colors[index];
			context.beginPath(); 
			let drawPos = drawingPositionGet(arr[0]);
			context.moveTo(drawPos.x, drawPos.y);
			arr.forEach((pt)=>{
				drawPos = drawingPositionGet(pt);
				context.lineTo(drawPos.x, drawPos.y);
			})
			context.closePath();
			context.stroke();
			context.fill();
			context.globalAlpha = 1-(index/5);
			context.restore();
		});

    }
}

function simpleRotate(point,angle){
    var cos = Math.cos(angle);
    var sin = -Math.sin(angle);
    rotatedX = point.x * cos - point.y * sin;
    rotatedY = point.y * cos + point.x * sin;
    return { "x": rotatedX, "y": rotatedY };
}

function simpleTranslate(point,angle,amount){
    var cos = Math.cos(angle);
    var sin = Math.sin(angle);
    point.x += Math.floor(cos * amount);
    point.y += Math.floor(sin * amount);
    return point;
}

function calcAngleDegrees(x, y) { // origine : MDN docs
    return Math.atan2(y, x) * 180 / Math.PI;
}

function calcAngleRadians(x, y) { // origine : calcAngleDegrees
    return Math.atan2(y, x);
}

function keepWithInCircle(rotation){
	if(rotation<0) rotation  += k360degres;
	if(rotation >k360degres ) rotation  -= k360degres;
	return rotation;
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
 
    return (usePound?"#":"") + (g | (b << 8) | (r << 16)).toString(16);
  
}

function setKeyDown(){
    document.addEventListener("keydown", function(event) {
		switch(event.code) {
			case "KeyQ": 
				keys.left = true;
				break;
			case "ArrowLeft": 
				keys.left = true;
				break;
			case "KeyA":
				keys.left = true;
				break;

			case "KeyE": 
				keys.right = true;
				break;
			case "ArrowRight": 
				keys.right = true;
				break;
			case "KeyD": 
				keys.right = true;
				break;

			case "KeyW": // up
				keys.up = true;
				break;
			case "ArrowUp": // up
				keys.up = true;
				break;
				
			case "KeyS": // down
				keys.down = true;
				break;
			case "ArrowDown": // down
				keys.down = true;
				break;
		};
	}); 
  }

  function setKeyUp(){
    document.addEventListener("keyup", function(event) {
		switch(event.code) {
			case "KeyQ": 
				keys.left = false;
				break;
			case "ArrowLeft": 
				keys.left = false;
				break;
			case "KeyA": 
				keys.left = false;
				break;

			case "KeyE": 
				keys.right = false;
				break;
			case "ArrowRight": 
				keys.right = false;
				break;
			case "KeyD":
				keys.right = false;
				break;

			case "KeyW": // up
				keys.up = false;
				break;
			case "ArrowUp": // up
				keys.up = false;
				break;
				
			case "KeyS": // down
				keys.down = false;
				break;
			case "ArrowDown": // down
				keys.down = false;
				break;
		};
	}); 
  }