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
