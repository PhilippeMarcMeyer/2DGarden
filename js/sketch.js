let w2,h2,w4,h4,k90degres,k60degres,k45degres,k180degres,k270degres,k360degres,k80degres,k280degres,camFov,focalW,focalH,zoom,focalAverage;
let needUpdate,saveContext,context,_camera,mode,things,debugMode,scribble;
let worldModel,gameLoaded;

function setup() {
    debugMode = false;
	gameLoaded = false;
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

  function setKeyDown(){
    document.addEventListener("keydown", function(event) {
		switch(event.code) {
			case "KeyQ": // left ctrlKey shiftKey
				_camera.turn(-1);
				break;
			case "ArrowLeft": // left ctrlKey shiftKey
				_camera.turn(-1);
				break;
			case "KeyA": // left ctrlKey shiftKey
				_camera.turn(-1);
				break;

			case "KeyE": // right
				_camera.turn(1);
				break;
			case "ArrowRight": // right
				_camera.turn(1);
				break;
			case "KeyD": // left ctrlKey shiftKey
				_camera.turn(1);
				break;

			case "KeyW": // up
			    _camera.walk(1);
				break;
			case "ArrowUp": // up
			    _camera.walk(1);
				break;
				
			case "KeyS": // down
				_camera.walk(-0.45,true);
				break;
			case "ArrowDown": // down
				_camera.walk(-0.45,true);
				break;

		    default:
				console.log(event.code)
		};
		
	}); 
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
			var poly = x.geometry.data2D[0];
			if (collideCirclePoly(self.position.x, self.position.y, self.bodyRadius * 2, poly)) {
				self.restorePosition();
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
	let rocks = [];
    world.data.rocks.forEach((r)=>{
			rocks.push(new PolyThing(r));
	});
    return rocks;
}
//size, distance, angleToOrigine, innerRotation, name,color,matrix
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


	//	self.geometry.data2D = [...rotatedPoints];
	
		self.geometry.data2D.forEach((arr)=>{
			arr.forEach((pt)=>{
			pt.x = self.positionAbsolute.x + (self.half * pt.x);
			pt.y = self.positionAbsolute.y + (self.half * pt.y);
		})});
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