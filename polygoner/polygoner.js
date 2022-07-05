let pointsList = [];
var polygones = [[]];
let centralPt = null;
let formulasZone = null;
let size = 600;
let isMultiple = false;

function setup() {
  let can = createCanvas(size, size);
  can.parent('canvasZone');
  formulasZone = document.getElementById("formulas");
  can.mouseReleased(addPoints);
  background(230);
  strokeWeight(5);
  setListeners();
}

function addPoints() {
	if (isMultiple) {
		polygones[polygones.length-1].push({x : mouseX, y : mouseY});

	}else
	{
		pointsList.push({x : mouseX, y : mouseY});
	}
}

var center = function (arr)
{
    var minX, maxX, minY, maxY;
    for (var i = 0; i < arr.length; i++)
    {
        minX = (arr[i].x < minX || minX == null) ? arr[i].x : minX;
        maxX = (arr[i].x > maxX || maxX == null) ? arr[i].x : maxX;
        minY = (arr[i].y < minY || minY == null) ? arr[i].y : minY;
        maxY = (arr[i].y > maxY || maxY == null) ? arr[i].y : maxY;
    }
    return {x : Math.floor((minX + maxX) / 2),y : Math.floor((minY + maxY) / 2)};
}



function draw() {

	if (isMultiple) {
		polygones.forEach((arr) => {
			if (arr.length > 0) {
				point(arr[0].x, arr[0].y);
			}
			if (arr.length > 1) {
				let prevPoint = null;
				arr.forEach((p, index) => {
					point(p.x, p.y);
					if (prevPoint != null) {
						line(prevPoint.x, prevPoint.y, p.x, p.y);
					}
					prevPoint = p;
				});
				centralPt = center(arr);
				point(centralPt.x, centralPt.y);
			}	
		});
	} else {
		if (pointsList.length > 0) {
			point(pointsList[0].x, pointsList[0].y);
		}
		if (pointsList.length > 1) {
			let prevPoint = null;
			pointsList.forEach((p, index) => {
				point(p.x, p.y);
				if (prevPoint != null) {
					line(prevPoint.x, prevPoint.y, p.x, p.y);
				}
				prevPoint = p;
			});
			centralPt = center(pointsList);
			point(centralPt.x, centralPt.y);
		}
	}
}

function setListeners(){
	document.querySelector("#multiple").addEventListener("change",function(){
		polygones = [[]];
		pointsList = [];
		isMultiple = !isMultiple;
	  },false);
	document.getElementById("eraseLast").addEventListener("click",function(){
	  if(pointsList.length > 0){
		if(isMultiple){
			polygones.splice(-1);
		}else{
			pointsList.splice(-1);
		}
	  }
	},false);
	document.getElementById("eraseAll").addEventListener("click",function(){
		if(isMultiple){
			polygones= [[]];
		}else{
			pointsList = [];
		}
	},false);
	document.getElementById("close").addEventListener("click",function(){
		if(isMultiple){
			if(polygones[polygones.length -1].length > 2){
				polygones[polygones.length -1].push(polygones[polygones.length -1][0]);
			}
		}else{
			if(pointsList.length > 2){
				pointsList.push(pointsList[0]);
			}
		}

	},false);
	document.getElementById("saveRelative").addEventListener("click",function(){
		let relativePoints = [];
		if(isMultiple){
			let index = -1;
			polygones.forEach((arr) => {
				index++;
				relativePoints.push([]);
				arr.forEach((p) => {
					let result = {...p};
					result.x -= centralPt.x;
					result.y -= centralPt.y;
					result.x /= size / 2;
					result.y /= size / 2;
					relativePoints[index].push(result);
				});
			});	
			polygones.push([]);
		}else{
			pointsList.forEach((p) => {
				let result = {...p};
				result.x -= centralPt.x;
				result.y -= centralPt.y;
				result.x /= size / 2;
				result.y /= size / 2;
				relativePoints.push(result);
			});		
		}
		  formulasZone.innerHTML = JSON.stringify(relativePoints);

	},false);
}