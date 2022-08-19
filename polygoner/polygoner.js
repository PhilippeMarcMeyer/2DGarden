let pointsList = [];
var polygones = [];
let centralPt = null;
let formulasZone = null;
let size = 600;
let square = 30;
let imageLoaded = false;
let imageSize = {w:0,h:0};
let leftTop =  {x:0,y:0};
let autoMode = false;
let CrtlPt1,CrtlPt2,ptA,ptB;
var arrObjects = [];
let can;

function setup() {
	var selectedImage = null;
	can = createCanvas(size, size);
	can.parent('canvasZone');
	can.mouseReleased(function () {
		if (autoMode) {
			let x = mouseX;
			let y = mouseY;
			arrObjects.forEach(function (pt) {
				if (pt.isDragged) {
					pt = stayInside(pt, x, y);
				}
				pt.isDragged = false;
			});
		} else {
			addPoints();
		}
	});
	formulasZone = document.getElementById("formulas");
	background(255);
	autoMode = document.getElementById("autoMode").checked;
	setListeners();
	ptA = {x:200,y:500,isDragged:false,radius:10,name:"A",color:"#00ff00",shape:"rect"};
	ptB = {x:300,y:500,isDragged:false,radius:10,name:"B",color:"#ee0000",shape:"rect"};
		
	CrtlPt1 = {x:400,y:20,isDragged:false,radius:10,name:"1",color:"#0000ff",shape:"ellipse"};
	CrtlPt2 = {x:240,y:20,isDragged:false,radius:10,name:"2",color:"#0000ff",shape:"ellipse"};
	arrObjects = [CrtlPt1,CrtlPt2,ptA,ptB];

	if (selectedImage) {
		loadImage(selectedImage, function (temp) {
			originalImage = temp.get();
			if (originalImage) {
				imageSize.w = originalImage.width;
				imageSize.h = originalImage.height;
				if (imageSize.w < size) {
					leftTop.x = (size - imageSize.w) / 2;
				}
				if (imageSize.h < size) {
					leftTop.y = (size - imageSize.h) / 2;
				}
				imageLoaded = true;
			}
		}, function (event) {
			console.log(event);
		});
	}
}

function addPoints() {
	pointsList.push({ x: mouseX, y: mouseY });
}

var center = function (arr) {
	var minX, maxX, minY, maxY;
	for (var i = 0; i < arr.length; i++) {
		minX = (arr[i].x < minX || minX == null) ? arr[i].x : minX;
		maxX = (arr[i].x > maxX || maxX == null) ? arr[i].x : maxX;
		minY = (arr[i].y < minY || minY == null) ? arr[i].y : minY;
		maxY = (arr[i].y > maxY || maxY == null) ? arr[i].y : maxY;
	}
	return { x: Math.floor((minX + maxX) / 2), y: Math.floor((minY + maxY) / 2) };
}

function draw() {

	clear();

	if(imageLoaded){
		image(originalImage,leftTop.x,leftTop.y,imageSize.w, imageSize.h);
	}



	strokeWeight(1);
	for (let i = square; i <= size; i += square) {
		line(0, i, size, i);
		line(i, 0, i, size);
	}

	push();
	stroke(0, 0, 0);
	bezier(ptA.x, ptA.y, CrtlPt1.x, CrtlPt1.y, CrtlPt2.x, CrtlPt2.y, ptB.x, ptB.y);
	pop();

	arrObjects.forEach(function(pt){
		drawObject(pt);
	});

	strokeWeight(5);

	point(size / 2, size / 2);

	if (pointsList.length > 0) {
		point(pointsList[0].x, pointsList[0].y);
	}

	polygones.forEach((polys) => {
		let prevPoint = null;
		polys.forEach((p, index) => {
			strokeWeight(5);
			point(p.x, p.y);
			if (prevPoint != null) {
				strokeWeight(1);
				line(prevPoint.x, prevPoint.y, p.x, p.y);
			}
			prevPoint = p;
		});
	});

	if (pointsList.length > 1) {
		let prevPoint = null;
		pointsList.forEach((p, index) => {
			strokeWeight(5);
			point(p.x, p.y);
			if (prevPoint != null) {
				strokeWeight(1);
				line(prevPoint.x, prevPoint.y, p.x, p.y);
			}
			prevPoint = p;
		});
		centralPt = center(pointsList);
		strokeWeight(5);
		point(centralPt.x, centralPt.y);
	}
}

function setListeners() {

	document.getElementById("PtBPtA").addEventListener("click", function () {
		if(autoMode){
			ptB.x = ptA.x
			ptB.y = ptA.y
		}
	}, false);

	document.getElementById("toPolygon").addEventListener("click", function () {
		if(autoMode){
			pointsList = [];
			let steps = 20;
			for (let i = 0; i <= steps; i++) {
			  let t = i / steps;
			  let x = bezierPoint(ptA.x, CrtlPt1.x, CrtlPt2.x, ptB.x, t);
			  let y = bezierPoint(ptA.y, CrtlPt1.y, CrtlPt2.y, ptB.y, t);
			  pointsList.push({ x: x, y: y });
			}
		}
	}, false);

	document.getElementById("multiply").addEventListener("click", function () {
		let nrRot = document.getElementById("nrRot").value;
		let angle = (Math.PI * 2) / nrRot;
		let copyArr = [...pointsList];
		let model = minimize(copyArr);
		let result =   [];
		for(let i = 0; i < nrRot ;i++){
			let rotatedArr = rotateArray(model,angle*i);
			let maximizedArr = maximize(rotatedArr);
			result = result.concat(maximizedArr);
		}
		result = result.filter((p) => {
			return p.x < size && p.y < size && p.x > 0 && p.y > 0;
		});
		pointsList = [...result];
	}, false);

	document.getElementById("autoMode").addEventListener("change", function () {
		autoMode = this.checked;
	}, false);

	document.getElementById("shake").addEventListener("click", function () {
		let xoff = 0;
		let yoff = 0;
		pointsList.forEach((pt,i) => {
			xoff += 0.01;
			yoff += 0.02;
			if(i%2){
				pt.x += noise(xoff);
				pt.y -= noise(yoff);
			}else{
				pt.x -= noise(xoff);
				pt.y += noise(yoff);
			}

		})
	}, false);

	document.getElementById("eraseLast").addEventListener("click", function () {
		if (pointsList.length > 0) {
			pointsList.splice(-1);
		}
	}, false);
	document.getElementById("eraseAll").addEventListener("click", function () {
		pointsList = [];

	}, false);
	document.getElementById("close").addEventListener("click", function () {
		if (pointsList.length > 2) {
			pointsList.push(pointsList[0]);
		}

	}, false);
	document.getElementById("saveRelative").addEventListener("click", function () {
		let relativePoints = [];

		polygones.forEach((polys) => {
			let arr = [];
			polys.forEach((p) => {
				let result = { ...p };
				result.x -= centralPt.x;
				result.y -= centralPt.y;
				result.x /= size / 2;
				result.y /= size / 2;
				result.x = Math.floor((result.x + 0.0005)*1000) / 1000;
				result.y = Math.floor((result.y + 0.0005)*1000) / 1000;
				arr.push(result);
			});
			relativePoints.push(arr);
		});
		let arr2 = [];
		pointsList.forEach((p) => {
			let result = { ...p };
			result.x -= centralPt.x;
			result.y -= centralPt.y;
			result.x /= size / 2;
			result.y /= size / 2;
			result.x = Math.floor((result.x + 0.0005)*1000) / 1000;
			result.y = Math.floor((result.y + 0.0005)*1000) / 1000;
			arr2.push(result);
		});
		relativePoints.push(arr2);

		polygones.push(pointsList);
		formulasZone.innerHTML = JSON.stringify(relativePoints);
		pointsList = [];
	}, false);
}

function mouseDragged() {
	if (!autoMode) return;
	let x = mouseX;
	let y = mouseY;
		arrObjects.forEach(function(pt){
		   if(pt.isDragged ){
			   pt.x = x;
			   pt.y = y;
		  }
	  });
	return false;
  }
  
  function mousePressed() {
	if (!autoMode) return;
	let x = mouseX;
	let y = mouseY;
	var oneFound = false;
	arrObjects.forEach(function(pt){
		if(!oneFound){
		  if(x <= pt.x+pt.radius && x >= pt.x-pt.radius && y <= pt.y+pt.radius && y >= pt.y-pt.radius ){
			  pt.isDragged = true;
			  oneFound = true;
		  }
		}
	  });
  }
  
  function maximize(PtArr){
	let arr = [];
	const halfSize = Math.floor(size / 2);
	arr = PtArr.map((pt) => {
		pt.x *= halfSize;
		pt.y *= halfSize;
		pt.x += halfSize;
		pt.y += halfSize;
		return pt;
	});
	return arr;
  }

  function minimize(PtArr){
	let arr = [];
	const halfSize = Math.floor(size / 2);
	arr = PtArr.map((pt) => {
		pt.x -= halfSize;
		pt.y -= halfSize;
		pt.x /= halfSize;
		pt.y /= halfSize;
		pt.x = Math.floor((pt.x + 0.0005)*1000) / 1000;
		pt.y = Math.floor((pt.y + 0.0005)*1000) / 1000;
		return(pt);
	});
	return arr;
  }

  function rotateArray(PtArr,angle){
	let arr = [];
	arr = PtArr.map((point) => {
		return simpleRotate(point, angle);
	});
	return arr;
  }

  function simpleRotate(point, angle) {
	var cos = Math.cos(angle);
	var sin = -Math.sin(angle);
	rotatedX = point.x * cos - point.y * sin;
	rotatedY = point.y * cos + point.x * sin;
	return { "x": rotatedX, "y": rotatedY };
}

  
function drawObject(pt){
	push()
		rectMode(CENTER)
		ellipseMode(CENTER);
		strokeWeight(1);
		fill(pt.color);
		stroke(pt.color);
		if(pt.isDragged){
			stroke(0);
			strokeWeight(3);
			point(pt.x, pt.y);
		}else if(pt.shape=="ellipse"){
			ellipse(pt.x, pt.y, pt.radius*2, pt.radius*2); 
		}else if(pt.shape=="rect"){
			rect(pt.x, pt.y, pt.radius*2, pt.radius*2); 
		}
		if(!pt.isDragged){
			textSize(16);
			stroke(255);
			fill(255);
			text(pt.name,pt.x-pt.radius/2, pt.y+pt.radius/2);
		}
		textSize(12);
		stroke(0);
		fill(0);
		text(floor(pt.x)+","+floor(pt.y),pt.x+pt.radius*2, pt.y);
	pop();
}

   function stayInside(pt,x,y){
	if(x < 0){
		 x = pt.radius;
	 }
	   if(y < 0){
		 y = pt.radius;
	 }
	   if(x > size){
		 x = size - pt.radius;
	 }
	   if(y > size){
		 y = size - pt.radius;
	 }
	 pt.x = round(x);
	 pt.y = round(y);
	 return pt;
   }