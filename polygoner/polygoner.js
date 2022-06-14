let pointsList = [];
let centralPt = null;
let formulasZone = null;
let size = 400;

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
  pointsList.push({x : mouseX, y : mouseY});
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
	rect(0, 0, width, height);

  if(pointsList.length > 0){
	  point(pointsList[0].x,pointsList[0].y);
  }
  if(pointsList.length > 1){
	  let prevPoint = null;
	  pointsList.forEach((p,index) => {
		point(p.x,p.y);
		if(prevPoint != null){
			line(prevPoint.x, prevPoint.y, p.x, p.y);
		}
		prevPoint = p;
	  });
	  centralPt = center(pointsList);
	  point(centralPt.x,centralPt.y);
  }
}

function setListeners(){
	document.getElementById("eraseLast").addEventListener("click",function(){
	  if(pointsList.length > 0){
		  pointsList.splice(-1)
	  }
	},false);
	document.getElementById("eraseAll").addEventListener("click",function(){
	  if(pointsList.length > 0){
		  pointsList = [];
	  }
	},false);
	document.getElementById("close").addEventListener("click",function(){
	  if(pointsList.length > 2){
		  pointsList.push(pointsList[0]);
	  }
	},false);
	document.getElementById("saveAbsolute").addEventListener("click",function(){
	  if(pointsList.length > 0){
		  formulasZone.innerHTML = JSON.stringify(pointsList);
	  }
	},false);
	document.getElementById("saveRelative").addEventListener("click",function(){
		let relativePoints = [];
		pointsList.forEach((p) => {
			let result = {...p};
			result.x -= centralPt.x;
			result.y -= centralPt.y;
			result.x /= size / 2;
			result.y /= size / 2;
			relativePoints.push(result);
		});
		  formulasZone.innerHTML = JSON.stringify(relativePoints);

	},false);
}