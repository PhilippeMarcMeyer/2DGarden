/* Philippe Meyer */

window.onload = function() {
	var canvas = document.getElementById("canvas"),
		context = canvas.getContext("2d"),
		width = canvas.width = window.innerWidth,
		height = canvas.height = window.innerHeight
		
	var things = [];
	var needUpdate = true;
	
	var fov = width;
	var w2 = width/2;
	var h2 = height/2;
	
	var k90degres = toradians(90);
	var k360degres = toradians(360);
	
	var camera = new Camera(0.1,20);
	context.translate(width / 2, height / 2);
// primitive,size,distance,altitude,angleToOrigine,rotation,name
	var aRotation = {x:0.2,y:0.1,z:0};
	var cubePrime = new Cube();
	var nrOfCubes = 12;
	var angleDiff = toradians(360/nrOfCubes);
	var distance,size,altitude,angleToOrigine,name;
	
	for(var i = 0;i < nrOfCubes ;i++){
		name = String.fromCharCode(65+i);
		size = 20 + i*2;
		altitude = 0;
		distance = w2 - i*20;
		angleToOrigine = angleDiff * i;
		things.push(new Shape(cubePrime,size,distance,altitude,angleToOrigine,aRotation,name));

	}

	update();

function update() {
	if(needUpdate){
		
		context.clearRect(-w2 , -h2, width, height);
		things.forEach(function(thing){
			thing.draw();
		});
		needUpdate = false;
	}
	requestAnimationFrame(update);
	
}

function Camera(rotStep,walkStep) {
	this.rotation = 0; 
	this.position = {x:0,y:0,z:0};
	this.walkStep = walkStep;
	this.rotStep = rotStep;
	this.turn = function(amount){ // -1 or +1
		//this.rotation.x += rotAngle.x;
		this.rotation -= this.rotStep*amount;
		if(this.rotation<0) this.rotation  += k360degres;
		if(this.rotation >k360degres ) this.rotation  =0;
		console.log("Camera : " + Math.floor(todegrees(this.rotation)));
	}
	this.walk = function(amount){// -1 or +1
		// Calculate new position considering the amount, the position and the direction
		var dirx = Math.sin(this.rotation);
		var dirz = Math.cos(this.rotation);
		this.position.x = Math.floor(this.position.x - (dirx * amount * this.walkStep)); 
		this.position.z = Math.floor(this.position.z - (dirz * amount * this.walkStep));
	}
}

// Converts from degrees to radians.
function  toradians(degrees) {
	return degrees * Math.PI / 180;
}

// Converts from radians to degrees.
function todegrees(radians) {
	return radians * 180 / Math.PI;
}


function Cube(){
	this.data = [
		[-1,-1,-1],
		[1,-1,-1],
		[1, 1,-1],
		[-1, 1,-1],
		[1,-1, 1],
		[-1,-1, 1],
		[-1, 1, 1],
		[1, 1, 1]
	];
this.poly=[];
this.poly[0]=[0,1,2,3];
this.poly[1]=[1,4,7,2];
this.poly[2]=[4,5,6,7]; 
this.poly[3]=[5,0,3,6];
this.poly[4]=[5,4,1,0];
this.poly[5]=[3,2,7,6];
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

function hypo(x,y,z){
return Math.sqrt(x*x+y*y+z*z);
}
// primitive,size,distance,altitude,angleToOrigine,rotation,name

function Shape(geometry,size,distance,altitude,angleToOrigine,rotation,name){
	
	this.size = size;
	this.distance = distance;
	this.altitude = altitude;
	this.angleToOrigine = angleToOrigine; // something to do with the cam rotation its only an integer
	this.position = {"x":0,"y":altitude,"z":distance};	//initial position with camera at 0 degree
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
		
		var newRotation = this.angleToOrigine - camera.rotation;
			if(newRotation <0) newRotation  += k360degres;
			if(newRotation >k360degres ) newRotation  -= k360degres;
		
		var sin = Math.sin(newRotation);
		var cos = Math.cos(newRotation);
		var newPositionFromCenter = {
			"x": Math.floor(sin*this.distance),
			"y": this.altitude,
			"z":-Math.floor(cos*this.distance)
		};
		var newDistance = this.distance; // for the present we dont walk
		// var diffX = newPositionFromCenter.x - camera.position.x;
		// var diffY = newPositionFromCenter.y - camera.position.y;
		// var diffZ = newPositionFromCenter.z - camera.position.z;

		// var newDistance = hypo(diffX,diffY,diffZ);
		// var newPosition = {
			// "x": Math.floor(sin*this.distance),
			// "y": this.altitude,
			// "z":-Math.floor(cos*this.distance)
		// };
		
doDraw = Math.abs(newRotation) < k90degres;
		
	var doDraw = true; // centerOfItem.z >0;
		if(doDraw){
			context.strokeStyle="darkred"; 
			context.stroke();

			var scale;
			var points = [];
			this.geometry.data.forEach(function(point){
				var copyOfPoint = {"x":point.x,"y":point.y,"z":point.z};
				points.push(copyOfPoint);
			});
			points = doRotate(points,this.rotation.x,this.rotation.y,this.rotation.z);
			var points2D = [];
			var size =  this.size;
			var position = this.position;
			//newPositionFromCenter
			//newRotation
			points.forEach(function(point){
				point.x *= size;
				point.y *= size;
				point.z *= size;
				
				point.x += newPositionFromCenter.x;
				point.y += newPositionFromCenter.y;
				point.z += newPositionFromCenter.z;
				
								
				scale=fov/(fov+newDistance);
				var x = Math.floor(point.x*scale);
				var y = Math.floor(point.y*scale);
				points2D.push({"x":x,"y":y});
			});
			context.beginPath();
			for(var i = 0;i < this.polyNr;i++){
				var polyPoints = this.geometry.poly[i];
				drawPoly(context,points2D,polyPoints);
			}
			context.stroke();
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
function simpleRotate(item,angle){
	rotatedX = x * cos(angle) - y * sin(angle)
   rotatedY = y * cos(angle) + x * sin(angle)
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
				needUpdate = true;
				camera.turn(-1);
				break;
			case 39: // right
				needUpdate = true;
				camera.turn(1);
				break;
			case 38: // up
			    //camera.walk(1);
				//needUpdate = true;
				break;
			case 40: // down
				//camera.walk(-1);
				//needUpdate = true;
				break;
		}
	}); 
	
	window.onresize = function(event) {
		width = canvas.width = window.innerWidth,
		height = canvas.height = window.innerHeight
		w2 = width/2;
		h2 = height/2;
		fov = width;
		needUpdate = true;
	};
}