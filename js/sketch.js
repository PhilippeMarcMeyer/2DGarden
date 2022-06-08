let w2,h2,w4,h4,k90degres,k60degres,k45degres,k180degres,k270degres,k360degres,k80degres,k280degres,camFov,focalW,focalH,zoom,focalAverage;
let needUpdate,saveContext,context,_camera,mode,things,debugMode,scribble;
let worldModel,gameLoaded;
let keys = { up: false, down: false, left: false, right: false }

function setup() {
    debugMode = false;
	gameLoaded = false;
	frameRate(25);
	loadJSON('/files/world1.json', result => {
		worldModel = {...result}
		things = setNotMobs(worldModel);
		things.forEach(function(t){
			t.init();
		});
		createCanvas(windowWidth, windowHeight);
		setUtilValues();
		translate(width / 2, height / 2);
		context = drawingContext;
		_camera = new Kamera(0.2,10,toradians(90));
		setKeyDown();
		setKeyUp();
		gameLoaded = true;
	  });
  }

  function draw() {
	if(!gameLoaded) return;
	translate(width / 2, height / 2);
	clear();
	context.fillStyle=worldModel.baseColor || "rgb(185,183,184)"; 
	context.rect(-w2 , -h2, width, height);
	context.fill();
	context.fillStyle="black"; 
	_camera.setDirection();
	_camera.draw();
	things.forEach(function(thing){
		thing.draw();
	});
  }


// Utilities

function drawingPositionGet(truePosition) {
	return {
		"x": worldModel && worldModel.currentCenter ? truePosition.x - worldModel.currentCenter.x : truePosition.x,
		"y": worldModel && worldModel.currentCenter ? truePosition.y - worldModel.currentCenter.y : truePosition.y
	};
}

function secondaryKey() {
	if (keyIsDown("KeyW"))
		_camera.walk(1);
}
  
  function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    setUtilValues();
    translate(width / 2, height / 2);
    context = drawingContext;
  }

  function setUtilValues(){
	w2 = width/2;
	h2 = height/2;
	w4 = width/4;
	h4 = height/4;
	k90degres = toradians(90);
	k60degres = toradians(60);
	k45degres = toradians(45);
	k180degres = toradians(180);
	k270degres = toradians(270);
	k360degres = toradians(360);
	k80degres = toradians(80);
	k280degres = toradians(280);
	camFov = k45degres;
	focalW = w2 / Math.tan(camFov/2);
	focalH = h2 / Math.tan(camFov/2);
	zoom = 4;
	focalAverage = (focalW + focalH)/2;
  }

  // Converts from degrees to radians.
function  toradians(degrees) {
	return degrees * Math.PI / 180;
}

// Converts from radians to degrees.
function todegrees(radians) {
	return radians * 180 / Math.PI;
}

function Kamera(rotStep,walkStep,rotation) {
	this.knownThings = [];
	this.rotation = rotation ? rotation : 0; 
	this.position = {x:0,y:0};
	this.previousLocation = {x:0,y:0}; 
	this.antePenultLocation = {x:0,y:0}; 

	this.sightWidth = toradians(90);
	this.sightLength = 200;
	this.walkStep = walkStep;
	this.rotStep = rotStep;
	this.bodyRadius = 20;

	this.turn = function(amount){ // -1 or +1
		this.rotation -= this.rotStep*amount;
		if(this.rotation<0) this.rotation  += k360degres;
		if(this.rotation > k360degres ) this.rotation = 0;
	}

	this.setDirection = function(){

		if(keys.left){
			_camera.turn(-1);
		}
		if(keys.right){
			_camera.turn(1);
		}
		if(keys.up){
			_camera.walk(1);
		}	
		if(keys.down){
			_camera.walk(-0.45,true);
		}	
	}

	this.walk = function(amount,rnd){// -1 or +1
		var self = this;
		// Calculate new position considering the amount, the position and the direction	
		this.savePosition();
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

		let drawPos = drawingPositionGet(self.position);
		if(drawPos.x > (w2 - w4)){
			worldModel.currentCenter.x += (self.position.x - self.previousLocation.x);
		}else if(drawPos.x < (w4 - w2)){
			worldModel.currentCenter.x -= (self.previousLocation.x - self.position.x);
		}

		if(drawPos.y > (h2 -h4)){
			worldModel.currentCenter.y += (self.position.y - self.previousLocation.y);
		}else if(drawPos.y < (h4 - h2)){
			worldModel.currentCenter.y -= (self.previousLocation.y - self.position.y);
		}
	}

	this.draw = function(){
		var self = this;
		
	    self.checkCollisions();
		self.drawCross();
		self.drawCamera();
	}

	this.checkCollisions = function () {
		var self = this;
		things.forEach(function (x) {
			if(x.collider.shape === 'poly'){
				if (collideCirclePoly(self.position.x, self.position.y, self.bodyRadius * 2, x.collider.data)) {
					self.restorePosition();
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
		var self = this;
		let drawPos = drawingPositionGet(this.position);
		//self.drawScanner();

		context.save();

		context.globalAlpha=1;	
		
		context.beginPath();
		context.strokeStyle="black"; 
		context.fillStyle="red"; 
		
		context.beginPath();
		context.arc(drawPos.x, drawPos.y, this.bodyRadius,0, 2*Math.PI,false);
		context.closePath();
		context.stroke();
		context.fill();

		var camCos = Math.cos(_camera.rotation);
		var camSin = -Math.sin(_camera.rotation);
		var vectorCam = {x:camCos*30,y:camSin*30};
		
		context.fillStyle="white"; 
		context.beginPath();
		context.arc(drawPos.x+(vectorCam.x*0.4),drawPos.y+(vectorCam.y*0.4), (this.bodyRadius/3),0, 2*Math.PI,false);
		context.closePath();
		context.stroke();
		context.fill();

		context.fillStyle="black"; 
		context.beginPath();
		context.arc(drawPos.x+(vectorCam.x*0.5), drawPos.y+(vectorCam.y*0.5), (this.bodyRadius/4),0, 2*Math.PI,false);
		context.closePath();
		context.stroke();
		context.fill();

		context.strokeStyle="darkred"; 
		context.fillStyle="black"; 

		context.restore();
	}

	this.drawScanner=function(){
		context.save();
		context.globalAlpha=0.35;
		context.beginPath();
		var rotationLeftLimit = camera.rotation-this.sightWidth/2;
		var rotationRightLimit = camera.rotation+this.sightWidth/2;

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
			
			var start = {"x":camera.position.x+camCos*this.bodyRadius,"y":camera.position.z+camSin*this.bodyRadius};
			context.moveTo(start.x, start.y);
			
			ray= {x:camCos*rayLength,y:camSin*rayLength};
			var end = {"x":start.x+ray.x,"y":start.y+ray.y};
			context.lineTo(end.x,end.y);
			things.forEach(function(x){
				
				var poly = x.geometry.data2D;
			
				if(collideLinePoly(start.x,start.y,end.x,end.y,poly)){
					x.hit = true;
					x.hitAngles.push(relativeAngle);
				}					
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
		
		context.moveTo(camera.position.x, camera.position.z);
		camCos = Math.cos(rotationRightLimit);
		camSin = -Math.sin(rotationRightLimit);
		ray= {x:camCos*this.sightLength,y:camSin*this.sightLength};
		context.lineTo(camera.position.x+ray.x,camera.position.z+ray.y);
		context.closePath();
		context.stroke();

		context.beginPath();
		context.moveTo(camera.position.x, camera.position.z);
		context.arc(camera.position.x, camera.position.z, this.sightLength, -rotationRightLimit, -rotationLeftLimit,false);
		
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
	world.data.plants.forEach((r)=>{
		notMobs.push(new Plant(r));
	});

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
	this.collider = {
		shape: "circle",
		data: null
	}
	this.init = function () {
		let self = this;
		if (self.leaves === null) {
			throw 'Not implemented plant crown shape : ' + self.geometry.crown.shape;
		}
		let spikesRadius = Math.min(self.age * self.leaves.leafModel.size.growthPerDay + self.leaves.leafModel.size.min, self.leaves.leafModel.size.max);
		self.geometry = {};
		self.geometry.heart = { shape: self.shape, color: self.color, diameter: self.size, center: null };
		if (self.leaves === null) {
			self.geometry.crown = null;
		} else {
			self.geometry.crown = { shape: self.leaves.shape, color: self.leaves.leafModel.color, number: self.leaves.number, radius: spikesRadius }
			self.geometry.crown.spikes = [];
			if (self.geometry.crown.shape === "double-curve") {
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
				self.geometry.heart.center = { x: self.positionAbsolute.x, y: self.positionAbsolute.y }
				const spikeRadius = self.geometry.crown.radius;
				self.geometry.crown.spikes.forEach((spike, index) => {
					for (const key in spike.curveLeft) {
						let centralPoint = { ...self.positionAbsolute };
						let cos = Math.cos(self.leaves.leafModel.angles[index]+self.angleToOrigine);
						let sin = -Math.sin(self.leaves.leafModel.angles[index]+self.angleToOrigine);
						centralPoint.x = Math.floor(cos);
						centralPoint.y = Math.floor(sin);
						spike.curveLeft[key].x = Math.floor(centralPoint.x + (spike.curveLeft[key].x + spikeRadius));
						spike.curveLeft[key].y = Math.floor(centralPoint.y + (spike.curveLeft[key].y + spikeRadius));
					}
					for (const key in spike.curveRight) {
						let centralPoint = { ...self.positionAbsolute };
						let cos = Math.cos(self.leaves.leafModel.angles[index]);
						let sin = -Math.sin(self.leaves.leafModel.angles[index]);
						centralPoint.x = Math.floor(cos);
						centralPoint.y = Math.floor(sin);
						spike.curveRight[key].x = Math.floor(centralPoint.x + (spike.curveRight[key].x + spikeRadius));
						spike.curveRight[key].y = Math.floor(centralPoint.y + (spike.curveRight[key].y + spikeRadius));
					}
			});
console.log(self.geometry)
			}else{
				throw 'Not implemented plant crown shape : ' + self.geometry.crown.shape;
			}
		}
	}
	this.draw = function () {
		var self = this;
		isVisible = true;
		if(!isVisible) return;
		if(self.geometry && self.geometry.crown ){
			if(self.geometry.crown.shape === "double-curve"){
				let color = self.geometry.crown.color;
				self.geometry.crown.spikes.forEach((spike)=>{
					context.save();
					context.globalAlpha = 1;
					context.strokeStyle = color;
					context.fillStyle = color;
					context.beginPath();
						curve(spike.curveLeft.ctrlPt1.x,spike.curveLeft.ctrlPt1.y,spike.curveLeft.pt1.x,spike.curveLeft.pt1.y,spike.curveLeft.pt2.x,spike.curveLeft.pt2.y,spike.curveLeft.ctrlPt2.x,spike.curveLeft.ctrlPt2.y);
						curve(spike.curveRight.ctrlPt1.x,spike.curveRight.ctrlPt1.y,spike.curveRight.pt1.x,spike.curveRight.pt1.y,spike.curveRight.pt2.x,spike.curveRight.pt2.y,spike.curveRight.ctrlPt2.x,spike.curveRight.ctrlPt2.y);
					context.closePath();
					context.stroke();
					context.fill();
					context.restore();

				})
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
			context.strokeStyle = self.colors[index];
			context.fillStyle = self.colors[index];
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
			context.fillStyle = "black";
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
    return { "x": rotatedX, "y": rotatedY }
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