let angle = 0;

function setup() {
  createCanvas(710, 400);
  background(102);
  noStroke();
  fill(0, 102);
}

function draw() {
  // Draw only when mouse is pressed
  if (mouseIsPressed === true) {
    angle += 5;
    let val = cos(radians(angle)) * 12.0;
    for (let a = 0; a < 360; a += 75) {
      let xoff = cos(radians(a)) * val;
      let yoff = sin(radians(a)) * val;
      fill(0);
      ellipse(mouseX + xoff, mouseY + yoff, val, val);
    }
    fill(255);
    ellipse(mouseX, mouseY, 2, 2);
  }
}


if(isPopulationHigh){
  let plantsSpeciesStatus = worldModel.data.models.map((x)=>{
    return {model:x.name,population:0};
  });
  plantsSpeciesStatus.forEach((x) => {
    x.population = getModelExpansion(x.model);
  });
  plantsSpeciesStatus.sort((a,b)=>{
      return b.population - a.population;
  });
  worldModel.data.plants =  worldModel.data.plants.filter((x)=>{
    let test = Math.random();
    return (test < 0.7 && x.model === plantsSpeciesStatus[0].model) || x.model !== plantsSpeciesStatus[0].model;
  });
  let plants2stop = worldModel.data.plants.length - maxPlants
  if(plants2stop > 0){
    worldModel.data.plants =  worldModel.data.plants.filter((x)=>{
      let test = Math.random();
      return (test < 0.8 && x.model === plantsSpeciesStatus[1].model) || x.model !== plantsSpeciesStatus[1].model;
    });
  }
  plants2stop = worldModel.data.plants.length - maxPlants
  if(plants2stop > 0){
    worldModel.data.plants =  worldModel.data.plants.filter((x)=>{
      let test = Math.random();
      return (test < 0.9 && x.model === plantsSpeciesStatus[2].model) || x.model !== plantsSpeciesStatus[2].model;
    });
  }
}

function generateTerrain(floorInst,radius){
	let self = floorInst;
	let diameter = radius*2;
	let terrainCanvas = document.getElementById("bg");
	terrainCanvas.setAttribute("width",radius * 2);
	terrainCanvas.setAttribute("height",radius * 2);

	buffer = terrainCanvas.getContext('2d');

	buffer.translate(radius,radius);
	buffer.save();
	buffer.beginPath();
	buffer.fillStyle = self.backgroundColor;
	buffer.strokeStyle = self.perimeterColor;
	buffer.rect(-radius, -radius, radius, radius);
	buffer.closePath();
	buffer.fill();
	buffer.stroke();
	buffer.restore();

	self.elements.forEach((elem) => {
		if (elem.shape === "circle") {
/* 			buffer.save();
			buffer.beginPath();
			let centralPt = { ...elem.center };
			buffer.fillStyle = elem.color;
			buffer.strokeStyle = elem.color;
			buffer.globalAlpha = elem.opacity;
			buffer.arc(centralPt.x, centralPt.y, elem.diameter, 0, 2 * Math.PI);
			buffer.closePath();
		    buffer.fill();
			buffer.stroke();
			buffer.restore(); */
		} else if (elem.shape === "polygon") {
			buffer.save();
			buffer.beginPath();
			buffer.globalAlpha = elem.opacity;
			buffer.fillStyle = elem.color;
			buffer.strokeStyle = elem.color;
			let drawPos = {...elem.points[0]};
			buffer.moveTo(drawPos.x, drawPos.y);
			elem.points.forEach((pt) => {
				drawPos = {...pt};
				buffer.lineTo(drawPos.x, drawPos.y);
			})
			buffer.closePath();
			buffer.stroke();
			buffer.fill();
			buffer.restore();
		}
	});
/*    pixels = buffer.getImageData(0,0,diameter,diameter)

  let inc = 0.01;

  let yoff = 0;
  for (let y = 0; y < diameter; y++) {
    let xoff = 0;
    for (let x = 0; x < diameter; x++) {
      let index = (x + y * diameter) * 4;
      let r = noise(xoff, yoff) * 255;
	  let g = noise(xoff, yoff) * 255;
	  let b = noise(xoff, yoff) * 255;

      pixels[index + 0] = r;
      pixels[index + 1] = g;
      pixels[index + 2] = b;
      pixels[index + 3] = 255;

      xoff += inc;
    }
    yoff += inc;
  }
  buffer.putImageData(pixels,0,0,diameter,diameter) */
  bufferIsReady = true;
}
doubl.forEach((arr) => { 
  arr.forEach((pt) => { pt.x *= 1.3; pt.y *= 1.3; })
})

const randomColors = ["#9ACD32","#556B2F","#6B8E23","#7CFC00","#7FFF00","#ADFF2F","#006400","#008000","#228B22","#00FF00","#32CD32","#90EE90","#98FB98","#8FBC8F","#00FA9A","#00FF7F","#2E8B57","#66CDAA","#3CB371","#20B2AA","#2F4F4F","#008080","#008B8B","#00FFFF","#E0FFFF","#00CED1","#40E0D0","#48D1CC","#AFEEEE","#7FFFD4","#B0E0E6","#5F9EA0","#4682B4","#6495ED","#00BFFF","#1E90FF","#ADD8E6","#87CEEB","#87CEFA","#191970","#000080","#00008B","#0000CD","#0000FF","#4169E1","#8A2BE2","#4B0082","#483D8B","#6A5ACD","#7B68EE","#9370DB","#8B008B","#9400D3"]




function setAutoGardens(){
	autoGardens.forEach((garden) => {
		garden.collider = {};
		garden.collider.shape = 'poly';
		let w = garden.buildingInfos.width;
		let h = garden.buildingInfos.height;
		let topLeft = { ...garden.buildingInfos.topLeft };
		let topRight = {
			x: topLeft.x + w,
			y: topLeft.y
		};
		let bottomLeft = {
			x: topLeft.x,
			y: topLeft.y + h
		};
		let bottomRight = {
			x: topLeft.x + w,
			y: topLeft.y + h
		};
		garden.collider.data = [topLeft, topRight, bottomRight, bottomLeft, topLeft];
		garden.workers.forEach((w) => {
			let models = worldModel.data.robotModels.filter((x) => {
				return x.name === w.model;
			});
			if (models.length === 1) {
				w.matrix = [...models[0].matrix];
			} else {
				w.matrix = null;
			}
		})
	});
	isAutoGardensSet = true;
}

function drawAutoGardens() {
	autoGardens.forEach((garden) => {
		// Building with charging stations
		let topLeft = drawingPositionGet(garden.buildingInfos.topLeft);
		let buildingHeight = garden.buildingInfos.height;
		let buildingWidth = garden.buildingInfos.width;
		context.beginPath();
		context.strokeStyle = "silver";
		strokeWeight(3);
		line(topLeft.x, topLeft.y + buildingHeight, topLeft.x, topLeft.y);
		line(topLeft.x, topLeft.y, topLeft.x + buildingWidth, topLeft.y);
		line(topLeft.x + buildingWidth, topLeft.y, topLeft.x + buildingWidth, topLeft.y + buildingHeight);
		strokeWeight(1);
		let interBoxesWidth = buildingWidth / (garden.buildingInfos.boxes)
		for (let i = 1; i <= garden.buildingInfos.boxes; i++) {
			line(topLeft.x + (interBoxesWidth * i), topLeft.y, topLeft.x + (interBoxesWidth * i), topLeft.y + buildingHeight);
		}
		context.closePath();
		context.stroke();
		// text(`${topLeft.x}`, topLeft.x, topLeft.y + 30);
		// text(`,${topLeft.y}`, topLeft.x, topLeft.y + 60);
		// Robots
		garden.workers.forEach((w, index) => {
			if (w.matrix) {
				let multiplier = w.innerSize * 0.6;
				let center = drawingPositionGet(w.currentPosition);
				let pts = [];
				pts = w.matrix.map((pt) => {
					return simpleRotate(pt, w.currentOrientation);
				});

				pts.forEach((pt) => {
					pt.x = center.x + (multiplier * pt.x);
					pt.y = center.y + (multiplier * pt.y);
				});

				//context.save();
				context.beginPath();
				context.strokeStyle = "#333";
				context.fillStyle = playerColors[index % (playerColors.length)];
				context.moveTo(pts[0].x, pts[0].y);
				pts.forEach((pt) => {
					context.lineTo(pt.x, pt.y);
				})
				context.closePath();
				context.fill();
				context.stroke();
			}
		});
	});
}

/* "colors": [
	"#244F02",
	"#987AF3",
	"#AA90FD",
	"#B9A1F9",
	"#6D3ED7",
	"#8457EA",
	"#FBDB0E"
  ] */