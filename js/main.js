/* Philippe Meyer */

window.onload = function() {
	var canvas = document.getElementById("canvas"),
		context = canvas.getContext("2d"),
		width = canvas.width = window.innerWidth,
		height = canvas.height = window.innerHeight
		
	var things = [];
	var needUpdate = true;
	
	var fov = width /2;
	var w2 = width/2;
	var h2 = height/2;
	
	var k90degres = toradians(90);
	var k360degres = toradians(360);
	var camera = new Camera(0.1,20);

	things.push(new Shape(new Cube(),80,{x:40,y:20,z:-300},{x:0.2,y:0.1,z:0},"one")),
	//things.push(new Shape(new Cube(),40,{x:-150,y:20,z:100},{x:0.2,y:0,z:0},"two"));

	update();

function update() {
	if(needUpdate){
		
		context.clearRect(0, 0 ,width, height);

		things.forEach(function(thing){
			thing.draw();
		});
		needUpdate = false;
	}
	requestAnimationFrame(update);
	
}

function Camera(rotStep,walkStep) {
	this.rotation = {x:0,y:toradians(90),z:0};
	this.position = {x:0,y:0,z:0};
	this.walkStep = walkStep;
	this.rotStep = rotStep;
	this.turn = function(amount){ // -1 or +1
		//this.rotation.x += rotAngle.x;
		this.rotation.y -= this.rotStep*amount;
		if(this.rotation.y <0) this.rotation.y  += k360degres;
		if(this.rotation.y >k360degres ) this.rotation.y  =0;
		console.log("Camera : " + Math.floor(todegrees(this.rotation.y)));
	}
	this.walk = function(amount){// -1 or +1
		// Calculate new position considering the amount, the position and the direction
		var dirx = Math.sin(this.rotation.y);
		var dirz = Math.cos(this.rotation.y);
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

function Shape(geometry,shapeSize,shapePosition,shapeRotation,name){
	
	this.shapeSize = shapeSize;
	this.shapePosition = shapePosition;
	this.rotation = shapeRotation;
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
		
		var centerOfItem = {"x":this.shapePosition.x,"y":this.shapePosition.y,"z":this.shapePosition.z}; // For (my) ease of comprehension !
		//var dot=scalarProduct(this.shapePosition,camera.rotation);
		var angle = camera.rotation.y;
		var angleDegres = todegrees(angle);
		var pointX = centerOfItem.x;
		var pointZ = centerOfItem.z;
		
		var originX = camera.position.x;
		var originZ = camera.position.z;	
		
		var cos = Math.cos(angle);
		var sin = Math.sin(angle) ;
		
		var dX = pointX - originX;
		var dZ = pointZ - originZ;
		
		var x =  cos * dX - sin * dZ + originZ;
		var z =  sin * dX + cos * dZ + originZ;
		
		var distance = Math.sqrt(x*x+z*z);
		
		centerOfItem.x = x;
		centerOfItem.z = z;
		
		console.log("item : " + this.name +" " + Math.floor(centerOfItem.x)+"," + Math.floor(centerOfItem.z));
		
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
			points = doRotate(points,this.rotation.x,this.rotation.y,this.rotation.z);//-camera.rotation.y,
			var points2D = [];
			var shapeSize =  this.shapeSize;
			var shapePosition = this.shapePosition;
			points.forEach(function(point){
				point.x *= shapeSize;
				point.y *= shapeSize;
				point.z *= shapeSize;
				
				point.x += centerOfItem.x;
				point.y += centerOfItem.y;
				point.z += centerOfItem.z;
				
								
				scale=fov/(fov+distance);
				var x = Math.floor(point.x*scale+w2);
				var y = Math.floor(point.y*scale+h2);
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
			    camera.walk(1);
				needUpdate = true;
				break;
			case 40: // down
				camera.walk(-1);
				needUpdate = true;
				break;
		}
	}); 
	
	window.onresize = function(event) {
		width = canvas.width = window.innerWidth,
		height = canvas.height = window.innerHeight
		w2 = width/2;
		h2 = height/2;
		fov = width /2;
		needUpdate = true;
	};
}