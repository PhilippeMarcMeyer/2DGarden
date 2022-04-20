/* Philippe Meyer */



window.onload = function() {
	var needUpdate,width,height,fov,h2,w2,k90degres,k270degres,k360degres;
	var saveContext;
	var canvas = document.getElementById("canvas");
	var	context = canvas.getContext("2d");
	var things = [];
	var camera = new Camera(0.05,10,toradians(90));
	var mode = "static";
init();

things.push(new Square(30,100,k90degres,0.5,"A"));

things.push(new Square(30,140,k90degres-0.4,0.25,"B"));

things.push(new Square(30,250,k180degres-0.5,0.1,"C"));

things.push(new Square(45,185,k180degres+1,.3,"D"));

things.push(new Square(22,220,0.9,.3,"E"));

things.push(new Square(50,450,1.5,.7,"F"));

update();

	
function init(){
	
	width = canvas.width = window.innerWidth;
	height = canvas.height = window.innerHeight;
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
	

	context.translate(width / 2, height / 2);

}

function update() {
		context.clearRect(-w2 , -h2, width, height);
		context.fillStyle="rgb(185,183,184)"; 
		context.rect(-w2 , -h2, width, height);
		context.fill();
		context.fillStyle="black"; 
		camera.draw();
		things.forEach(function(thing){
			thing.draw();
		});

	requestAnimationFrame(update);
	
}



// Converts from degrees to radians.
function  toradians(degrees) {
	return degrees * Math.PI / 180;
}

// Converts from radians to degrees.
function todegrees(radians) {
	return radians * 180 / Math.PI;
}





function scalarProduct(a,b){
var ax=a.x;
var ay=a.y;
var az=a.z;
var bx=b.x;
var by=b.y;
var bz=b.z;

var len = hypo(ax,ay,az);
ax=ax/len;
ay=ay/len;
az=az/len;

len = hypo(bx,by,bz);
bx=bx/len;
by=by/len;
bz=bz/len;

return ax*bx+ay*by+az*bz;
}

function scalarProduct2D(a,b){
var ax=a.x;
var ay=a.y;
var bx=b.x;
var by=b.y;

var len =  Math.sqrt(ax*ax+ay*ay);
ax=ax/len;
ay=ay/len;

len =  Math.sqrt(bx*bx+by*by);
bx=bx/len;
by=by/len;


return ax*bx+ay*by;
}

function hypo(x,y,z){
return Math.sqrt(x*x+y*y+z*z);
}

function Camera(rotStep,walkStep,rotation) {
	this.rotation = rotation ? rotation : 0; 
	this.position = {x:0,y:0,z:0};
	this.previousLocation = {x:0,y:0,z:0}; 
	this.antePenultLocation = {x:0,y:0,z:0}; 

	this.sightWidth = toradians(120);
	this.sightLength = 200;
	this.walkStep = walkStep;
	this.rotStep = rotStep;
	this.bodyRadius = 20;
	this.turn = function(amount){ // -1 or +1
		//this.rotation.x += rotAngle.x;
		this.rotation -= this.rotStep*amount;
		if(this.rotation<0) this.rotation  += k360degres;
		if(this.rotation >k360degres ) this.rotation  =0;
		//console.log("Camera : " + Math.floor(todegrees(this.rotation)));
	}
	this.walk = function(amount){// -1 or +1
		// Calculate new position considering the amount, the position and the direction
		//collideCirclePoly(cx, cy, diameter, vertices, interior) 
	
		this.savePosition();
		var dirx = Math.cos(this.rotation);
		var dirz = - Math.sin(this.rotation);
		this.position.x = Math.floor(this.position.x + (dirx * amount * this.walkStep)); 
		this.position.z = Math.floor(this.position.z + (dirz * amount * this.walkStep));
		

	}

	
	this.draw = function(){
		
		if(mode=="static"){
			this.drawStatic();
		}else if(mode=="dynamic"){
			this.drawDynamic();
		} else if (mode=="3d"){
			this.draw3D();
		}
			
	}
	
	this.drawStatic = function(){
		var self = this;
		
		self.checkCollisions();
		
		self.drawSoil();
		
		self.drawCross();
		
		self.drawCamera();

		self.drawScanner();

	}
	
	this.drawDynamic = function(){
		
			var camCos = Math.cos(camera.rotation);
			var camSin = -Math.sin(camera.rotation);
			
			var vectorCam = {x:camCos*50,y:camSin*50};
			
			var west = simpleRotate(vectorCam,k90degres);
			var east = simpleRotate(vectorCam,-k90degres);
			var north = vectorCam;
			var south = simpleRotate(vectorCam,-k180degres);
			
			context.globalAlpha=0.5;
			context.beginPath();
			context.strokeStyle="green"; 
			
			context.moveTo(west.x, west.y);
			context.lineTo(east.x, east.y);
			context.moveTo(north.x, north.y);
			context.lineTo(south.x, south.y);
			
			context.fillText("W",west.x-5, west.y);
			context.fillText("E",east.x-5, east.y);
			context.fillText("N",north.x-5, north.y);
			context.fillText("S",south.x-5, south.y);
			
			context.closePath();
			context.stroke();
			
			context.globalAlpha=1;
			context.beginPath();
			context.strokeStyle="darkblue"; 
			var messagePosition = camera.position.x + "," + camera.position.z;
	
			vectorCam = {x:0,y:-30};
			
			drawArrow(context,0,0,vectorCam.x,vectorCam.y);
			context.fillText(messagePosition+" * " + Math.floor(camera.rotation * 180 / Math.PI) +" °", 30, -30);
			context.closePath();
			context.stroke();
	}
	
	this.draw3D = function(){
	}
	
	this.drawSoil=function(){
		var self = this;
		things.forEach(function(x){
			var alpha = 1-(x.distance/300);
				if (alpha < 0.1) alpha = 0.1;
				
				context.globalAlpha=alpha;				
				context.beginPath();
				context.strokeStyle="black"; 
				context.fillStyle="rgb(20,230,160)"; 

				context.arc(0, 0, x.distance, 0, Math.PI * 2, true);
				context.closePath();
	
				context.stroke();	
				context.fill();				
			}); 
		
	}
	this.checkCollisions=function(){
		var self = this;
		things.forEach(function(x){
				var poly = [x.topLeft,x.topRight,x.bottomRight,x.bottomLeft,x.topLeft];
				if(collideCirclePoly(self.position.x , self.position.z, self.bodyRadius*2, poly)) {
					self.restorePosition ();
				}			
			}); 
	}
	
		this.drawCross=function(){
			context.save();
			context.globalAlpha=0.4;
			context.beginPath();
			context.strokeStyle="green"; 
			context.fillStyle="white"; 
			var camCos = Math.cos(k90degres);
			var camSin = -Math.sin(k90degres);
			
			var vectorCam = {x:camCos*50,y:camSin*50};
			
			var west = simpleRotate(vectorCam,k90degres);
			var east = simpleRotate(vectorCam,-k90degres);
			var north = vectorCam;
			var south = simpleRotate(vectorCam,-k180degres);
			
			
			context.beginPath();
			context.strokeStyle="black"; 
			context.moveTo(west.x, west.y);
			context.lineTo(east.x, east.y);
			context.moveTo(north.x, north.y);
			context.lineTo(south.x, south.y);
			context.closePath();
			context.stroke();

			context.beginPath();
			context.fillStyle="black";
			context.fillText("W",west.x-5, west.y);
			context.fillText("E",east.x-5, east.y);
			context.fillText("N",north.x-5, north.y);
			context.fillText("S",south.x-5, south.y);
			context.closePath();
			context.stroke();
			
			context.restore();
		}
	
	this.drawCamera=function(){
			context.save();

			context.globalAlpha=1;	
			
			context.beginPath();
			context.strokeStyle="darkred"; 
			context.fillStyle="white"; 
			
			context.beginPath();
			context.arc(camera.position.x, camera.position.z, this.bodyRadius,0, 2*Math.PI,false);
		
			context.closePath();
			context.stroke();
			context.fill();
			


			var messagePosition = camera.position.x + "," + camera.position.z;
			var camCos = Math.cos(camera.rotation);
			var camSin = -Math.sin(camera.rotation);
			var vectorCam = {x:camCos*30,y:camSin*30};
			

			context.beginPath();
			drawArrow(context,camera.position.x,camera.position.z,camera.position.x+vectorCam.x,camera.position.z+vectorCam.y);
			context.closePath();
			context.stroke();
			
			context.strokeStyle="darkred"; 
			context.fillStyle="black"; 
			
			context.beginPath();
			context.fillText(messagePosition, camera.position.x -7, camera.position.z -this.bodyRadius/2);
			context.fillText(Math.floor(camera.rotation * 180 / Math.PI) +" °", camera.position.x -6, camera.position.z +this.bodyRadius/2);

			context.closePath();
			context.stroke();
			
		

			context.restore();
	}

	this.drawScanner=function(){
		context.save();
		context.globalAlpha=0.35;
		context.beginPath();
		var rotationLeftLimit = camera.rotation-this.sightWidth/2;
		var rotationRightLimit = camera.rotation+this.sightWidth/2;

		context.strokeStyle="rgb(255,0,0)"; 
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
				
				var poly = [x.topLeft,x.topRight,x.bottomRight,x.bottomLeft,x.topLeft];
			
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
		
		things.forEach(function(x){
			if(x.hit){
//geometry.normals2D[0]
				
//scalarProduct2D
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
// primitive,size,distance,altitude,angleToOrigine,rotation,name





function Shape(geometry,size,distance,altitude,angleToOrigine,rotation,name){
	
	this.size = size;
	this.distance = distance;
	this.altitude = altitude;
	this.angleToOrigine = angleToOrigine; // something to do with the cam rotation its only an integer
	this.position = {"x":Math.cos(angleToOrigine)*distance,"y":altitude,"z":Math.sin(angleToOrigine)*distance};	//initial position with camera at 0 degree
	this.rotation = rotation;// nothing to do with the cam rotation
	this.geometry = {};
    this.name = name;
	
	this.geometry.data = [];
	this.geometry.poly = [];
	
	this.polyNr = geometry.poly.length;

	for(var i = 0;i < geometry.data.length;i++){
		var aPoint = geometry.data[i];
		var x = aPoint[0];
		var y = aPoint[1];
		var z = aPoint[2];
		var truePoint = {"x":x,"y":y,"z":z};
		this.geometry.data.push(truePoint);
	}
	for(var i = 0;i < geometry.data.length;i++){
		var aPoly = geometry.poly[i];
		this.geometry.poly.push(aPoly);
	}
	
	this.draw=function(){
		if(camera.position.x == 0 && camera.position.z == 0){		
			var newRotation = this.angleToOrigine - camera.rotation;
				if(newRotation <0) newRotation  += k360degres;
				if(newRotation >k360degres ) newRotation  -= k360degres;
			
			var cos = Math.cos(newRotation);
			var sin = Math.sin(newRotation);

			// not normed
			this.position = {
				"x": Math.floor(cos*this.distance),
				"y": this.altitude,
				"z":-Math.floor(sin*this.distance)
			};


		}else{
			
			// the circle is enlarged or shrunk but the angler of the camera does not change
			// the the angle of the cube to the camera changes
			// Get the distance to the object
			
			var cubeX = this.position.x - camera.position.x;
			var cubeY= this.position.y - camera.position.y;
			var cubeZ = this.position.z - camera.position.z;

			var newDistance = hypo(cubeX,cubeY,cubeZ);
			if(newDistance < 1) newDistance = 1;
			
			var cosCube = cubeX / newDistance;
			var sinCube = cubeZ / newDistance;
			
			this.angleToOrigine = calcAngleRadians(cosCube,sinCube);

			this.position = {"x":Math.cos(this.angleToOrigine)*newDistance,"y":this.altitude,"z":Math.sin(this.angleToOrigine)*newDistance};
			this.distance = newDistance;
			
		}

doDraw = newRotation <= k180degres;		
		if(doDraw){
			context.strokeStyle="black"; 
			var self = this;
			var scale;
			var points = [];
			this.geometry.data.forEach(function(point){
				var copyOfPoint = {"x":point.x,"y":point.y,"z":point.z};
				points.push(copyOfPoint);
			});
			points = doRotate(points,this.rotation.x+newRotation,this.rotation.y,this.rotation.z);
			var points2D = [];
			var size =  this.size;
			var position = this.position;
			//newPositionFromCenter
			//newRotation
			points.forEach(function(point){
				point.x *= size;
				point.y *= size;
				point.z *= size;
				
				point.x += self.position.x;
				point.y += self.position.y;
				point.z += self.position.z;
				
								
				scale=fov/(fov-point.z);
				var x = -Math.floor(point.x*scale);
				var y = Math.floor(point.y*scale);
				points2D.push({"x":x,"y":y});
			
			});
			context.beginPath();
			context.strokeStyle="darkred"; 
			for(var i = 0;i < this.polyNr-1;i++){
				var polyPoints = this.geometry.poly[i];
				drawPoly(context,points2D,polyPoints);
				context.stroke();
				context.strokeStyle="black"; 
			}
			context.strokeStyle="darkblue"; 
			drawPoly(context,points2D,polyPoints);
			context.stroke();
			
			var x2d = points2D[this.polyNr/2].x;
			var y2d = points2D[this.polyNr/2].y;
			var z3d = points[this.polyNr/2].z;
			
			var message = this.name + " : " + Math.floor(todegrees(this.angleToOrigine))+" ° => z = " + Math.floor(z3d) ;
			context.fillText(message,x2d ,y2d+20);
			
		}
	}
}	

function drawPoly(context,points,poly){
	
	context.moveTo(points[poly[0]].x, points[poly[0]].y);		

	for(var i = 1; i < poly.length; i++) {
		context.lineTo(points[poly[i]].x, points[poly[i]].y);
	}
	
	context.lineTo(points[poly[0]].x, points[poly[0]].y);

}



function calcRotationGivenAdjacentSide(adjacent, hypotenuse){
	if(!hypotenuse) hypotenuse = 1; // if already normed
	var ratio = adjacent/hypotenuse;
	var result = 1 - ratio*ratio/2;
	result = Math.acos(result);
	return result;	
}
	
function doRotate(points,pitch, roll, yaw) {
    var cosa = Math.cos(yaw);
    var sina = Math.sin(yaw);

    var cosb = Math.cos(pitch);
    var sinb = Math.sin(pitch);

    var cosc = Math.cos(roll);
    var sinc = Math.sin(roll);

    var Axx = cosa*cosb;
    var Axy = cosa*sinb*sinc - sina*cosc;
    var Axz = cosa*sinb*cosc + sina*sinc;

    var Ayx = sina*cosb;
    var Ayy = sina*sinb*sinc + cosa*cosc;
    var Ayz = sina*sinb*cosc - cosa*sinc;

    var Azx = -sinb;
    var Azy = cosb*sinc;
    var Azz = cosb*cosc;

    for (var i = 0; i < points.length; i++) {
        var px = points[i].x;
        var py = points[i].y;
        var pz = points[i].z;

        points[i].x = Axx*px + Axy*py + Axz*pz;
        points[i].y = Ayx*px + Ayy*py + Ayz*pz;
        points[i].z = Azx*px + Azy*py + Azz*pz;
    }
	return points;
}



	document.addEventListener("keydown", function(event) {
		switch(event.keyCode) {
			case 37: // left ctrlKey shiftKey
				camera.turn(-1);
				break;
			case 39: // right
				camera.turn(1);
				break;
			case 38: // up
			    camera.walk(1);
				break;
			case 40: // down
				camera.walk(-1);
				break;
		}
	}); 
	
	window.onresize = function(event) {
		init();
	};

}