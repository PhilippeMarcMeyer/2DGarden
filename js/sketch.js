let w2,h2,k90degres,k60degres,k45degres,k180degres,k270degres,k360degres,k80degres,k280degres,camFov,focalW,focalH,zoom,focalAverage;
let needUpdate,saveContext,context,camera,mode,things,debugMode,scribble;

function setup() {
    debugMode = false;
    createCanvas(windowWidth, windowHeight);
    setUtilValues();
    translate(width / 2, height / 2);
	context = drawingContext;
	things = setNotMobs();
	camera = new Kamera(0.2,10,toradians(90));
	setKeyDown();
	
  }

  function draw() {
	translate(width / 2, height / 2);
	clear();
	//context.clearRect(-w2 , -h2, width, height);
	context.fillStyle="rgb(185,183,184)"; 
	context.rect(-w2 , -h2, width, height);
	context.fill();
	context.fillStyle="black"; 
	camera.draw();
	things.forEach(function(thing){
		thing.draw();
	});
  }


// Utilities
  function setKeyDown(){
    document.addEventListener("keydown", function(event) {
		switch(event.code) {
			case "KeyQ": // left ctrlKey shiftKey
				camera.turn(-1);
				break;
			case "ArrowLeft": // left ctrlKey shiftKey
				camera.turn(-1);
				break;
			case "KeyA": // left ctrlKey shiftKey
				camera.turn(-1);
				break;

			case "KeyE": // right
				camera.turn(1);
				break;
			case "ArrowRight": // right
				camera.turn(1);
			break;
			case "KeyD": // left ctrlKey shiftKey
				camera.turn(1);
				break;

			case "KeyW": // up
			    camera.walk(1);
				break;
			case "ArrowUp": // up
			    camera.walk(1);
				break;
				
			case "KeyS": // down
				camera.walk(-0.75);
				break;
			case "KeyS": // down
				camera.walk(-0.75);
				break;

		    default:
				console.log(event.code)
		}
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
	this.position = {x:0,y:0,z:0};
	this.previousLocation = {x:0,y:0,z:0}; 
	this.antePenultLocation = {x:0,y:0,z:0}; 

	this.sightWidth = toradians(90);
	this.sightLength = 200;
	this.walkStep = walkStep;
	this.rotStep = rotStep;
	this.bodyRadius = 20;
	this.turn = function(amount){ // -1 or +1
		this.rotation -= this.rotStep*amount;
		if(this.rotation<0) this.rotation  += k360degres;
		if(this.rotation >k360degres ) this.rotation = 0;
	}
	this.walk = function(amount){// -1 or +1
		// Calculate new position considering the amount, the position and the direction	
		this.savePosition();
		var dirx = Math.cos(this.rotation);
		var dirz = - Math.sin(this.rotation);
		this.position.x = Math.floor(this.position.x + (dirx * amount * this.walkStep)); 
		this.position.z = Math.floor(this.position.z + (dirz * amount * this.walkStep));
	}

	this.draw = function(){
		var self = this;
		
	    self.checkCollisions();
		
		self.drawSoil();
		
		self.drawCross();

		self.drawScanner();

		self.drawCamera();
	}
	
	this.drawSoil=function(){
		var self = this;
		var soilColor = color(20,230,160); 
		things.forEach(function(x){
			var alpha = 1-(x.distance/400);
				if (alpha < 0.1) alpha = 0.1;
				context.globalAlpha=alpha;				
				context.beginPath();
				context.strokeStyle="black"; 
				context.fillStyle=soilColor; 
				fill(soilColor);

				context.arc(0, 0, x.distance, 0, Math.PI * 2, true);
				context.closePath();
				context.stroke();	
				context.fill();				
			}); 
	}
	this.checkCollisions = function () {
		var self = this;
		things.forEach(function (x) {
			var poly = x.geometry.data2D;
			if (collideCirclePoly(self.position.x, self.position.z, self.bodyRadius * 2, poly)) {
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

		var west = simpleRotate(vectorCam, k90degres);
		var east = simpleRotate(vectorCam, -k90degres);
		var north = vectorCam;
		var south = simpleRotate(vectorCam, -k180degres);


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
			context.save();

			context.globalAlpha=1;	
			
			context.beginPath();
			context.strokeStyle="black"; 
			context.fillStyle="red"; 
			
			context.beginPath();
			context.arc(camera.position.x, camera.position.z, this.bodyRadius,0, 2*Math.PI,false);
			context.closePath();
			context.stroke();
			context.fill();

			//var messagePosition = camera.position.x + "," + camera.position.z;
			var camCos = Math.cos(camera.rotation);
			var camSin = -Math.sin(camera.rotation);
			var vectorCam = {x:camCos*30,y:camSin*30};
			
			context.fillStyle="white"; 
			context.beginPath();
			//drawArrow(context,camera.position.x,camera.position.z,camera.position.x+vectorCam.x,camera.position.z+vectorCam.y);
			context.arc(camera.position.x+(vectorCam.x*0.4), camera.position.z+(vectorCam.y*0.4), (this.bodyRadius/3),0, 2*Math.PI,false);
			context.closePath();
			context.stroke();
			context.fill();

			context.fillStyle="black"; 
			context.beginPath();
			context.arc(camera.position.x+(vectorCam.x*0.5), camera.position.z+(vectorCam.y*0.5), (this.bodyRadius/4),0, 2*Math.PI,false);
			context.closePath();
			context.stroke();
			context.fill();

			context.strokeStyle="darkred"; 
			context.fillStyle="black"; 
			/*
			context.beginPath();
			context.fillText(messagePosition, camera.position.x -7, camera.position.z -this.bodyRadius/2);
			context.fillText(Math.floor(camera.rotation * 180 / Math.PI) +" °", camera.position.x -6, camera.position.z +this.bodyRadius/2);

			context.closePath();
			context.stroke();
			*/
		

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
		this.antePenultLocation.z = this.previousLocation.z;
		
		this.previousLocation.x = this.position.x;
		this.previousLocation.y = this.position.y;
		this.previousLocation.z = this.position.z;
	}
	
	this.restorePosition = function(){
		this.position.x = this.previousLocation.x;
		this.position.y = this.previousLocation.y;
		this.position.z = this.previousLocation.z;
		
		this.previousLocation.x = this.antePenultLocation.x;
		this.previousLocation.y = this.antePenultLocation.y;
		this.previousLocation.z = this.antePenultLocation.z;
	}

}

function setNotMobs(){
    let things = [];
    things.push(new PolyThing(30,100,k90degres,0.5,"A"));
    things.push(new PolyThing(30,140,k90degres-0.4,0.25,"B"));
    things.push(new PolyThing(30,250,k180degres-0.5,0.1,"C"));
    things.push(new PolyThing(45,185,k180degres+1,.3,"D"));
    things.push(new PolyThing(60,220,0.9,.3,"E",[
		{x:0,y:-1},
		{x:-0.5,y:-0.25},
		{x:-1,y:0.25},
		{x:-1,y:0.5},
		{x:-0.5,y:1},
		{x:0,y:1},
		{x:0.5,y:1},
		{x:0.5,y:0.5},
		{x:1,y:1},
		{x:0.5,y:-0.5},
		{x:0.,y:-1}]));
    things.push(new PolyThing(50,450,1.5,.7,"F"));
	things.push(new PolyThing(34,320,1.5,.7,"G"));
	//things.push(new PolyThing(15,10,1.1,.7,"H"));
    return things;
}

function PolyThing(size, distance, angleToOrigine, innerRotation, name,matrix) {
	if (!matrix){
		matrix = [{x:-1,y:-1},{x:1,y:-1},{x:1,y:1},{x:-1,y:1}];
	}

    this.size = size;
    this.distance = distance;
    this.angleToOrigine = angleToOrigine;
    this.name = name;
    this.innerRotation = innerRotation;
    this.positionAbsolute = { x: 0, y: 0 };
    this.positionRelative = { x: 0, y: 0 };
    this.half = Math.floor(size / 2);
    this.geometry = {data2D:matrix};
    this.hit = false;
    this.hitAngles = [];
    this.hitMiddleAngle = 0;
	
    var cos = Math.cos(this.angleToOrigine);
    var sin = -Math.sin(this.angleToOrigine);

    // the real position according to origin point
    this.positionAbsolute.x = Math.floor(cos * distance);
    this.positionAbsolute.y = Math.floor(sin * distance);


	this.geometry.data2D.forEach((pt)=>{
		pt.x = this.positionAbsolute.x + (this.half * pt.x);
		pt.y = this.positionAbsolute.y + (this.half * pt.y);
	});

	this.geometry.data2D.forEach((pt)=>{
		pt = simpleRotate(pt,this.innerRotation);
	});

    this.draw = function () {
        // the camera moves : the objects stay stationnary so the positionRelative == positionAbsolute
        var self = this;
		var isVisible = false;
		if(camera.knownThings.indexOf(self.name) != -1){
			isVisible = true;
		}else{
			if(self.hit){
				camera.knownThings.push(self.name);
				isVisible = true;
			}
		}

		if(!isVisible) return;

        context.save();
        context.globalAlpha = 0.8;
        context.strokeStyle = "black";
        context.fillStyle = "rgb(20,230,160)";
        context.beginPath();

        context.moveTo(self.geometry.data2D[0].x, self.geometry.data2D[0].y);
		self.geometry.data2D.forEach((pt)=>{
			context.lineTo(pt.x, pt.y);
		});

        context.closePath();
        context.stroke();
        if (self.hit) {
            context.fillStyle = "#C19864";
            context.fill();
            context.fillStyle = "black";
			if(debugMode){
            	context.fillText(Math.floor(todegrees(self.hitMiddleAngle)) + " °", self.topRight.x + 2, self.topRight.y - 2);
			}
        }

        context.globalAlpha = 1;
        context.restore();
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

