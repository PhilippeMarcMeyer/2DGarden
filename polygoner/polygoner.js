let pointsList = [];
var polygones = [];
let centralPt = null;
let formulasZone = null;
let size = 600;
let square = 30;
let imageLoaded = false;
let imageSize = {w:0,h:0};
let leftTop =  {x:0,y:0};

function setup() {
var selectedImage = "coccinelle.png";
let can = createCanvas(size, size);
can.parent('canvasZone');
formulasZone = document.getElementById("formulas");
can.mouseReleased(addPoints);
background(255);
setListeners();
    loadImage(selectedImage, function(temp) {
		originalImage = temp.get();
		if(originalImage){
			imageSize.w = originalImage.width;
			imageSize.h = originalImage.height;
			if(imageSize.w < size){
				leftTop.x = (size - imageSize.w)/2;
			}
			if(imageSize.h < size){
				leftTop.y = (size - imageSize.h)/2;
			}
		    imageLoaded = true;
		}
		
	}, function(event) {
		console.log(event);
	});
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
