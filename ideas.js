//  var centerInside = this.collidePointPoly(cx,cy, vertices); : check if the flower is over a rock to limit its growth


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


  /*
    "mobs": {
      "ladybug": {
        "size": 20,
        "colors": [
          "#9ACD32",
          "#556B2F",
          "#6B8E23",
          "#7CFC00",
          "#7FFF00",
          "#ADFF2F",
          "#006400",
          "#008000",
          "#228B22",
          "#00FF00",
          "#32CD32",
          "#90EE90",
          "#98FB98",
          "#8FBC8F",
          "#00FA9A",
          "#00FF7F",
          "#2E8B57",
          "#66CDAA",
          "#3CB371",
          "#20B2AA",
          "#2F4F4F",
          "#008080",
          "#008B8B",
          "#00FFFF",
          "#E0FFFF",
          "#00CED1",
          "#40E0D0",
          "#48D1CC",
          "#AFEEEE",
          "#7FFFD4",
          "#B0E0E6",
          "#5F9EA0",
          "#4682B4",
          "#6495ED",
          "#00BFFF",
          "#1E90FF",
          "#ADD8E6",
          "#87CEEB",
          "#87CEFA",
          "#191970",
          "#000080",
          "#00008B",
          "#0000CD",
          "#0000FF",
          "#4169E1",
          "#8A2BE2",
          "#4B0082",
          "#483D8B",
          "#6A5ACD",
          "#7B68EE",
          "#9370DB",
          "#8B008B",
          "#9400D3"
        ],
        "matrix": [
          [
            {
              "x": 0.253,
              "y": -0.387
            },
            {
              "x": 0.243,
              "y": -0.073
            },
            {
              "x": 0.247,
              "y": 0.65
            },
            {
              "x": 0.283,
              "y": 0.683
            },
            {
              "x": 0.303,
              "y": 0.687
            },
            {
              "x": 0.347,
              "y": 0.673
            },
            {
              "x": 0.387,
              "y": 0.643
            },
            {
              "x": 0.457,
              "y": 0.627
            },
            {
              "x": 0.547,
              "y": 0.587
            },
            {
              "x": 0.627,
              "y": 0.533
            },
            {
              "x": 0.693,
              "y": 0.483
            },
            {
              "x": 0.747,
              "y": 0.42
            },
            {
              "x": 0.803,
              "y": 0.35
            },
            {
              "x": 0.843,
              "y": 0.263
            },
            {
              "x": 0.857,
              "y": 0.16
            },
            {
              "x": 0.857,
              "y": 0.123
            },
            {
              "x": 0.867,
              "y": 0.043
            },
            {
              "x": 0.853,
              "y": -0.063
            },
            {
              "x": 0.833,
              "y": -0.147
            },
            {
              "x": 0.787,
              "y": -0.26
            },
            {
              "x": 0.75,
              "y": -0.327
            },
            {
              "x": 0.74,
              "y": -0.373
            },
            {
              "x": 0.707,
              "y": -0.42
            },
            {
              "x": 0.677,
              "y": -0.447
            },
            {
              "x": 0.63,
              "y": -0.467
            },
            {
              "x": 0.54,
              "y": -0.467
            },
            {
              "x": 0.447,
              "y": -0.45
            },
            {
              "x": 0.353,
              "y": -0.427
            },
            {
              "x": 0.29,
              "y": -0.407
            },
            {
              "x": 0.253,
              "y": -0.407
            },
            {
              "x": 0.253,
              "y": -0.387
            }
          ],
          [
            {
              "x": 0.257,
              "y": -0.413
            },
            {
              "x": 0.237,
              "y": -0.083
            },
            {
              "x": 0.247,
              "y": 0.63
            },
            {
              "x": 0.233,
              "y": 0.66
            },
            {
              "x": 0.2,
              "y": 0.67
            },
            {
              "x": 0.167,
              "y": 0.68
            },
            {
              "x": 0.087,
              "y": 0.64
            },
            {
              "x": -0.007,
              "y": 0.6
            },
            {
              "x": -0.087,
              "y": 0.563
            },
            {
              "x": -0.15,
              "y": 0.51
            },
            {
              "x": -0.213,
              "y": 0.433
            },
            {
              "x": -0.257,
              "y": 0.347
            },
            {
              "x": -0.297,
              "y": 0.283
            },
            {
              "x": -0.327,
              "y": 0.193
            },
            {
              "x": -0.34,
              "y": 0.12
            },
            {
              "x": -0.343,
              "y": 0.053
            },
            {
              "x": -0.343,
              "y": -0.043
            },
            {
              "x": -0.327,
              "y": -0.12
            },
            {
              "x": -0.3,
              "y": -0.197
            },
            {
              "x": -0.26,
              "y": -0.283
            },
            {
              "x": -0.23,
              "y": -0.353
            },
            {
              "x": -0.183,
              "y": -0.423
            },
            {
              "x": -0.133,
              "y": -0.467
            },
            {
              "x": -0.077,
              "y": -0.453
            },
            {
              "x": -0.01,
              "y": -0.453
            },
            {
              "x": 0.077,
              "y": -0.44
            },
            {
              "x": 0.167,
              "y": -0.43
            },
            {
              "x": 0.22,
              "y": -0.413
            },
            {
              "x": 0.257,
              "y": -0.413
            }
          ],
          [
            {
              "x": 0.243,
              "y": -0.42
            },
            {
              "x": 0.16,
              "y": -0.433
            },
            {
              "x": 0.063,
              "y": -0.45
            },
            {
              "x": -0.013,
              "y": -0.46
            },
            {
              "x": -0.087,
              "y": -0.46
            },
            {
              "x": -0.143,
              "y": -0.463
            },
            {
              "x": -0.087,
              "y": -0.533
            },
            {
              "x": -0.043,
              "y": -0.61
            },
            {
              "x": -0.023,
              "y": -0.59
            },
            {
              "x": 0.013,
              "y": -0.59
            },
            {
              "x": 0.043,
              "y": -0.6
            },
            {
              "x": 0.07,
              "y": -0.583
            },
            {
              "x": 0.107,
              "y": -0.6
            },
            {
              "x": 0.113,
              "y": -0.637
            },
            {
              "x": 0.133,
              "y": -0.663
            },
            {
              "x": 0.11,
              "y": -0.687
            },
            {
              "x": 0.127,
              "y": -0.71
            },
            {
              "x": 0.16,
              "y": -0.723
            },
            {
              "x": 0.157,
              "y": -0.75
            },
            {
              "x": 0.133,
              "y": -0.767
            },
            {
              "x": 0.107,
              "y": -0.777
            },
            {
              "x": 0.07,
              "y": -0.793
            },
            {
              "x": 0.067,
              "y": -0.83
            },
            {
              "x": 0.087,
              "y": -0.847
            },
            {
              "x": 0.083,
              "y": -0.81
            },
            {
              "x": 0.1,
              "y": -0.797
            },
            {
              "x": 0.117,
              "y": -0.793
            },
            {
              "x": 0.15,
              "y": -0.787
            },
            {
              "x": 0.163,
              "y": -0.81
            },
            {
              "x": 0.193,
              "y": -0.81
            },
            {
              "x": 0.197,
              "y": -0.777
            },
            {
              "x": 0.207,
              "y": -0.757
            },
            {
              "x": 0.223,
              "y": -0.757
            },
            {
              "x": 0.27,
              "y": -0.76
            },
            {
              "x": 0.31,
              "y": -0.763
            },
            {
              "x": 0.327,
              "y": -0.75
            },
            {
              "x": 0.357,
              "y": -0.757
            },
            {
              "x": 0.373,
              "y": -0.777
            },
            {
              "x": 0.393,
              "y": -0.807
            },
            {
              "x": 0.413,
              "y": -0.797
            },
            {
              "x": 0.4,
              "y": -0.773
            },
            {
              "x": 0.42,
              "y": -0.78
            },
            {
              "x": 0.443,
              "y": -0.793
            },
            {
              "x": 0.45,
              "y": -0.863
            },
            {
              "x": 0.5,
              "y": -0.863
            },
            {
              "x": 0.49,
              "y": -0.823
            },
            {
              "x": 0.46,
              "y": -0.783
            },
            {
              "x": 0.41,
              "y": -0.77
            },
            {
              "x": 0.407,
              "y": -0.75
            },
            {
              "x": 0.413,
              "y": -0.717
            },
            {
              "x": 0.43,
              "y": -0.697
            },
            {
              "x": 0.4,
              "y": -0.66
            },
            {
              "x": 0.41,
              "y": -0.623
            },
            {
              "x": 0.43,
              "y": -0.59
            },
            {
              "x": 0.5,
              "y": -0.577
            },
            {
              "x": 0.543,
              "y": -0.583
            },
            {
              "x": 0.573,
              "y": -0.577
            },
            {
              "x": 0.563,
              "y": -0.527
            },
            {
              "x": 0.607,
              "y": -0.493
            },
            {
              "x": 0.533,
              "y": -0.493
            },
            {
              "x": 0.433,
              "y": -0.453
            },
            {
              "x": 0.367,
              "y": -0.443
            },
            {
              "x": 0.303,
              "y": -0.417
            },
            {
              "x": 0.243,
              "y": -0.42
            }
          ],
          [
            {
              "x": 0.617,
              "y": -0.523
            },
            {
              "x": 0.623,
              "y": -0.48
            },
            {
              "x": 0.66,
              "y": -0.47
            },
            {
              "x": 0.7,
              "y": -0.52
            },
            {
              "x": 0.677,
              "y": -0.533
            },
            {
              "x": 0.647,
              "y": -0.517
            },
            {
              "x": 0.617,
              "y": -0.523
            }
          ],
          [
            {
              "x": 0.7,
              "y": -0.527
            },
            {
              "x": 0.713,
              "y": -0.567
            },
            {
              "x": 0.673,
              "y": -0.673
            },
            {
              "x": 0.617,
              "y": -0.72
            },
            {
              "x": 0.717,
              "y": -0.757
            },
            {
              "x": 0.77,
              "y": -0.77
            },
            {
              "x": 0.83,
              "y": -0.807
            },
            {
              "x": 0.853,
              "y": -0.82
            },
            {
              "x": 0.83,
              "y": -0.823
            },
            {
              "x": 0.8,
              "y": -0.85
            },
            {
              "x": 0.813,
              "y": -0.82
            },
            {
              "x": 0.767,
              "y": -0.787
            },
            {
              "x": 0.737,
              "y": -0.803
            },
            {
              "x": 0.693,
              "y": -0.783
            },
            {
              "x": 0.61,
              "y": -0.753
            },
            {
              "x": 0.573,
              "y": -0.737
            },
            {
              "x": 0.6,
              "y": -0.67
            },
            {
              "x": 0.633,
              "y": -0.627
            },
            {
              "x": 0.7,
              "y": -0.527
            }
          ],
          [
            {
              "x": -0.147,
              "y": -0.467
            },
            {
              "x": -0.103,
              "y": -0.483
            },
            {
              "x": -0.1,
              "y": -0.52
            },
            {
              "x": -0.143,
              "y": -0.53
            },
            {
              "x": -0.15,
              "y": -0.55
            },
            {
              "x": -0.18,
              "y": -0.557
            },
            {
              "x": -0.173,
              "y": -0.53
            },
            {
              "x": -0.167,
              "y": -0.5
            },
            {
              "x": -0.147,
              "y": -0.467
            }
          ],
          [
            {
              "x": -0.153,
              "y": -0.55
            },
            {
              "x": -0.18,
              "y": -0.567
            },
            {
              "x": -0.137,
              "y": -0.637
            },
            {
              "x": -0.087,
              "y": -0.69
            },
            {
              "x": -0.037,
              "y": -0.757
            },
            {
              "x": -0.13,
              "y": -0.787
            },
            {
              "x": -0.163,
              "y": -0.793
            },
            {
              "x": -0.22,
              "y": -0.807
            },
            {
              "x": -0.243,
              "y": -0.837
            },
            {
              "x": -0.277,
              "y": -0.843
            },
            {
              "x": -0.223,
              "y": -0.843
            },
            {
              "x": -0.207,
              "y": -0.863
            },
            {
              "x": -0.207,
              "y": -0.833
            },
            {
              "x": -0.183,
              "y": -0.8
            },
            {
              "x": -0.147,
              "y": -0.817
            },
            {
              "x": -0.11,
              "y": -0.807
            },
            {
              "x": -0.077,
              "y": -0.807
            },
            {
              "x": -0.003,
              "y": -0.753
            },
            {
              "x": -0.033,
              "y": -0.693
            },
            {
              "x": -0.063,
              "y": -0.653
            },
            {
              "x": -0.09,
              "y": -0.607
            },
            {
              "x": -0.15,
              "y": -0.557
            },
            {
              "x": -0.153,
              "y": -0.55
            }
          ],
          [
            {
              "x": -0.043,
              "y": -0.613
            },
            {
              "x": -0.007,
              "y": -0.66
            },
            {
              "x": 0.033,
              "y": -0.687
            },
            {
              "x": 0.073,
              "y": -0.707
            },
            {
              "x": 0.09,
              "y": -0.683
            },
            {
              "x": 0.12,
              "y": -0.663
            },
            {
              "x": 0.113,
              "y": -0.627
            },
            {
              "x": 0.1,
              "y": -0.597
            },
            {
              "x": 0.113,
              "y": -0.603
            },
            {
              "x": 0.073,
              "y": -0.597
            },
            {
              "x": 0.037,
              "y": -0.6
            },
            {
              "x": 0.003,
              "y": -0.593
            },
            {
              "x": -0.033,
              "y": -0.593
            },
            {
              "x": -0.043,
              "y": -0.613
            }
          ],
          [
            {
              "x": 0.593,
              "y": -0.537
            },
            {
              "x": 0.563,
              "y": -0.587
            },
            {
              "x": 0.537,
              "y": -0.587
            },
            {
              "x": 0.43,
              "y": -0.577
            },
            {
              "x": 0.43,
              "y": -0.593
            },
            {
              "x": 0.407,
              "y": -0.633
            },
            {
              "x": 0.407,
              "y": -0.663
            },
            {
              "x": 0.433,
              "y": -0.693
            },
            {
              "x": 0.47,
              "y": -0.697
            },
            {
              "x": 0.523,
              "y": -0.673
            },
            {
              "x": 0.553,
              "y": -0.63
            },
            {
              "x": 0.593,
              "y": -0.597
            },
            {
              "x": 0.593,
              "y": -0.537
            }
          ],
          [
            {
              "x": -0.213,
              "y": -0.393
            },
            {
              "x": -0.143,
              "y": -0.457
            },
            {
              "x": -0.21,
              "y": -0.453
            },
            {
              "x": -0.26,
              "y": -0.43
            },
            {
              "x": -0.243,
              "y": -0.43
            },
            {
              "x": -0.217,
              "y": -0.393
            },
            {
              "x": -0.213,
              "y": -0.393
            }
          ],
          [
            {
              "x": -0.23,
              "y": -0.423
            },
            {
              "x": -0.263,
              "y": -0.433
            },
            {
              "x": -0.36,
              "y": -0.343
            },
            {
              "x": -0.417,
              "y": -0.247
            },
            {
              "x": -0.423,
              "y": -0.22
            },
            {
              "x": -0.467,
              "y": -0.19
            },
            {
              "x": -0.533,
              "y": -0.177
            },
            {
              "x": -0.56,
              "y": -0.16
            },
            {
              "x": -0.62,
              "y": -0.147
            },
            {
              "x": -0.62,
              "y": -0.103
            },
            {
              "x": -0.577,
              "y": -0.073
            },
            {
              "x": -0.603,
              "y": -0.127
            },
            {
              "x": -0.553,
              "y": -0.147
            },
            {
              "x": -0.517,
              "y": -0.143
            },
            {
              "x": -0.457,
              "y": -0.167
            },
            {
              "x": -0.393,
              "y": -0.207
            },
            {
              "x": -0.32,
              "y": -0.277
            },
            {
              "x": -0.283,
              "y": -0.34
            },
            {
              "x": -0.23,
              "y": -0.423
            }
          ],
          [
            {
              "x": 0.743,
              "y": -0.37
            },
            {
              "x": 0.753,
              "y": -0.397
            },
            {
              "x": 0.78,
              "y": -0.41
            },
            {
              "x": 0.773,
              "y": -0.437
            },
            {
              "x": 0.71,
              "y": -0.447
            },
            {
              "x": 0.67,
              "y": -0.453
            },
            {
              "x": 0.707,
              "y": -0.423
            },
            {
              "x": 0.743,
              "y": -0.37
            }
          ],
          [
            {
              "x": 0.767,
              "y": -0.4
            },
            {
              "x": 0.81,
              "y": -0.357
            },
            {
              "x": 0.83,
              "y": -0.287
            },
            {
              "x": 0.867,
              "y": -0.2
            },
            {
              "x": 0.893,
              "y": -0.17
            },
            {
              "x": 0.92,
              "y": -0.157
            },
            {
              "x": 0.983,
              "y": -0.12
            },
            {
              "x": 1.033,
              "y": -0.103
            },
            {
              "x": 1.07,
              "y": -0.113
            },
            {
              "x": 1.103,
              "y": -0.103
            },
            {
              "x": 1.117,
              "y": -0.08
            },
            {
              "x": 1.117,
              "y": -0.043
            },
            {
              "x": 1.137,
              "y": -0.077
            },
            {
              "x": 1.117,
              "y": -0.103
            },
            {
              "x": 1.087,
              "y": -0.127
            },
            {
              "x": 1.047,
              "y": -0.137
            },
            {
              "x": 0.997,
              "y": -0.133
            },
            {
              "x": 0.917,
              "y": -0.173
            },
            {
              "x": 0.897,
              "y": -0.273
            },
            {
              "x": 0.86,
              "y": -0.347
            },
            {
              "x": 0.823,
              "y": -0.4
            },
            {
              "x": 0.793,
              "y": -0.433
            },
            {
              "x": 0.767,
              "y": -0.4
            }
          ],
          [
            {
              "x": -0.35,
              "y": 0.04
            },
            {
              "x": -0.38,
              "y": 0.077
            },
            {
              "x": -0.38,
              "y": 0.117
            },
            {
              "x": -0.34,
              "y": 0.133
            },
            {
              "x": -0.35,
              "y": 0.04
            }
          ],
          [
            {
              "x": -0.37,
              "y": 0.09
            },
            {
              "x": -0.39,
              "y": 0.113
            },
            {
              "x": -0.42,
              "y": 0.143
            },
            {
              "x": -0.417,
              "y": 0.21
            },
            {
              "x": -0.417,
              "y": 0.29
            },
            {
              "x": -0.39,
              "y": 0.353
            },
            {
              "x": -0.36,
              "y": 0.41
            },
            {
              "x": -0.317,
              "y": 0.447
            },
            {
              "x": -0.29,
              "y": 0.447
            },
            {
              "x": -0.35,
              "y": 0.5
            },
            {
              "x": -0.36,
              "y": 0.523
            },
            {
              "x": -0.407,
              "y": 0.56
            },
            {
              "x": -0.453,
              "y": 0.607
            },
            {
              "x": -0.467,
              "y": 0.653
            },
            {
              "x": -0.447,
              "y": 0.68
            },
            {
              "x": -0.457,
              "y": 0.643
            },
            {
              "x": -0.44,
              "y": 0.61
            },
            {
              "x": -0.437,
              "y": 0.663
            },
            {
              "x": -0.427,
              "y": 0.63
            },
            {
              "x": -0.413,
              "y": 0.59
            },
            {
              "x": -0.38,
              "y": 0.56
            },
            {
              "x": -0.347,
              "y": 0.56
            },
            {
              "x": -0.303,
              "y": 0.523
            },
            {
              "x": -0.277,
              "y": 0.467
            },
            {
              "x": -0.263,
              "y": 0.48
            },
            {
              "x": -0.287,
              "y": 0.413
            },
            {
              "x": -0.317,
              "y": 0.34
            },
            {
              "x": -0.353,
              "y": 0.263
            },
            {
              "x": -0.383,
              "y": 0.2
            },
            {
              "x": -0.387,
              "y": 0.14
            },
            {
              "x": -0.37,
              "y": 0.09
            }
          ],
          [
            {
              "x": 0.863,
              "y": 0.137
            },
            {
              "x": 0.9,
              "y": 0.107
            },
            {
              "x": 0.903,
              "y": 0.06
            },
            {
              "x": 0.873,
              "y": 0.037
            },
            {
              "x": 0.863,
              "y": 0.137
            },
            {
              "x": 0.897,
              "y": 0.073
            },
            {
              "x": 0.933,
              "y": 0.127
            },
            {
              "x": 0.927,
              "y": 0.183
            },
            {
              "x": 0.923,
              "y": 0.243
            },
            {
              "x": 0.907,
              "y": 0.313
            },
            {
              "x": 0.87,
              "y": 0.383
            },
            {
              "x": 0.83,
              "y": 0.423
            },
            {
              "x": 0.843,
              "y": 0.467
            },
            {
              "x": 0.873,
              "y": 0.5
            },
            {
              "x": 0.9,
              "y": 0.523
            },
            {
              "x": 0.933,
              "y": 0.557
            },
            {
              "x": 0.96,
              "y": 0.603
            },
            {
              "x": 0.967,
              "y": 0.64
            },
            {
              "x": 0.927,
              "y": 0.653
            },
            {
              "x": 0.947,
              "y": 0.623
            },
            {
              "x": 0.94,
              "y": 0.587
            },
            {
              "x": 0.89,
              "y": 0.577
            },
            {
              "x": 0.893,
              "y": 0.55
            },
            {
              "x": 0.86,
              "y": 0.543
            },
            {
              "x": 0.847,
              "y": 0.513
            },
            {
              "x": 0.813,
              "y": 0.467
            },
            {
              "x": 0.8,
              "y": 0.427
            },
            {
              "x": 0.81,
              "y": 0.37
            },
            {
              "x": 0.837,
              "y": 0.297
            },
            {
              "x": 0.87,
              "y": 0.223
            },
            {
              "x": 0.913,
              "y": 0.147
            },
            {
              "x": 0.9,
              "y": 0.107
            },
            {
              "x": 0.863,
              "y": 0.137
            }
          ],
          [
            {
              "x": 0.193,
              "y": -0.737
            },
            {
              "x": 0.183,
              "y": -0.717
            },
            {
              "x": 0.173,
              "y": -0.68
            },
            {
              "x": 0.21,
              "y": -0.677
            },
            {
              "x": 0.23,
              "y": -0.713
            },
            {
              "x": 0.23,
              "y": -0.74
            },
            {
              "x": 0.193,
              "y": -0.737
            }
          ],
          [
            {
              "x": 0.323,
              "y": -0.727
            },
            {
              "x": 0.333,
              "y": -0.687
            },
            {
              "x": 0.363,
              "y": -0.673
            },
            {
              "x": 0.383,
              "y": -0.7
            },
            {
              "x": 0.353,
              "y": -0.73
            },
            {
              "x": 0.323,
              "y": -0.727
            }
          ],
          [
            {
              "x": 0.227,
              "y": -0.417
            },
            {
              "x": 0.307,
              "y": -0.417
            },
            {
              "x": 0.3,
              "y": -0.363
            },
            {
              "x": 0.353,
              "y": -0.343
            },
            {
              "x": 0.413,
              "y": -0.333
            },
            {
              "x": 0.417,
              "y": -0.28
            },
            {
              "x": 0.423,
              "y": -0.223
            },
            {
              "x": 0.387,
              "y": -0.187
            },
            {
              "x": 0.323,
              "y": -0.147
            },
            {
              "x": 0.297,
              "y": -0.153
            },
            {
              "x": 0.273,
              "y": -0.183
            },
            {
              "x": 0.233,
              "y": -0.187
            },
            {
              "x": 0.207,
              "y": -0.173
            },
            {
              "x": 0.16,
              "y": -0.193
            },
            {
              "x": 0.11,
              "y": -0.213
            },
            {
              "x": 0.11,
              "y": -0.253
            },
            {
              "x": 0.113,
              "y": -0.32
            },
            {
              "x": 0.157,
              "y": -0.35
            },
            {
              "x": 0.203,
              "y": -0.37
            },
            {
              "x": 0.223,
              "y": -0.397
            },
            {
              "x": 0.227,
              "y": -0.417
            }
          ],
          [
            {
              "x": 0.627,
              "y": 0.353
            },
            {
              "x": 0.597,
              "y": 0.393
            },
            {
              "x": 0.59,
              "y": 0.437
            },
            {
              "x": 0.617,
              "y": 0.467
            },
            {
              "x": 0.68,
              "y": 0.47
            },
            {
              "x": 0.713,
              "y": 0.42
            },
            {
              "x": 0.74,
              "y": 0.373
            },
            {
              "x": 0.697,
              "y": 0.343
            },
            {
              "x": 0.627,
              "y": 0.353
            }
          ],
          [
            {
              "x": -0.163,
              "y": 0.337
            },
            {
              "x": -0.13,
              "y": 0.357
            },
            {
              "x": -0.093,
              "y": 0.383
            },
            {
              "x": -0.08,
              "y": 0.417
            },
            {
              "x": -0.11,
              "y": 0.45
            },
            {
              "x": -0.147,
              "y": 0.453
            },
            {
              "x": -0.19,
              "y": 0.417
            },
            {
              "x": -0.233,
              "y": 0.393
            },
            {
              "x": -0.21,
              "y": 0.357
            },
            {
              "x": -0.163,
              "y": 0.337
            },
            {
              "x": -0.163,
              "y": 0.337
            }
          ],
          [
            {
              "x": -0.257,
              "y": -0.177
            },
            {
              "x": -0.213,
              "y": -0.173
            },
            {
              "x": -0.187,
              "y": -0.207
            },
            {
              "x": -0.19,
              "y": -0.257
            },
            {
              "x": -0.22,
              "y": -0.27
            },
            {
              "x": -0.243,
              "y": -0.237
            },
            {
              "x": -0.257,
              "y": -0.177
            }
          ],
          [
            {
              "x": 0.797,
              "y": -0.24
            },
            {
              "x": 0.757,
              "y": -0.21
            },
            {
              "x": 0.72,
              "y": -0.173
            },
            {
              "x": 0.737,
              "y": -0.137
            },
            {
              "x": 0.767,
              "y": -0.117
            },
            {
              "x": 0.82,
              "y": -0.127
            },
            {
              "x": 0.83,
              "y": -0.143
            },
            {
              "x": 0.82,
              "y": -0.2
            },
            {
              "x": 0.797,
              "y": -0.24
            }
          ],
          [
            {
              "x": 0.42,
              "y": -0.037
            },
            {
              "x": 0.417,
              "y": 0.003
            },
            {
              "x": 0.41,
              "y": 0.053
            },
            {
              "x": 0.473,
              "y": 0.07
            },
            {
              "x": 0.54,
              "y": 0.07
            },
            {
              "x": 0.573,
              "y": 0.033
            },
            {
              "x": 0.583,
              "y": -0.017
            },
            {
              "x": 0.55,
              "y": -0.047
            },
            {
              "x": 0.49,
              "y": -0.053
            },
            {
              "x": 0.42,
              "y": -0.037
            }
          ],
          [
            {
              "x": -0.047,
              "y": -0.033
            },
            {
              "x": -0.06,
              "y": 0.01
            },
            {
              "x": -0.047,
              "y": 0.04
            },
            {
              "x": 0.017,
              "y": 0.057
            },
            {
              "x": 0.06,
              "y": 0.023
            },
            {
              "x": 0.04,
              "y": -0.023
            },
            {
              "x": 0.02,
              "y": -0.053
            },
            {
              "x": -0.047,
              "y": -0.033
            },
            {
              "x": -0.047,
              "y": -0.033
            }
          ]
        ]
      }
    }
  */

	/*
    "robotModels": [
      {
        "name": "gardener",
        "matrix": [
          {
            "x": 0.9,
            "y": -0.00335
          },
          {
            "x": 0.8134,
            "y": -0.006667
          },
          {
            "x": 0.7134,
            "y": -0.09666
          },
          {
            "x": 0.6067,
            "y": -0.2
          },
          {
            "x": 0.51,
            "y": -0.20667
          },
          {
            "x": 0.4167,
            "y": -0.2034
          },
          {
            "x": 0.32,
            "y": -0.29
          },
          {
            "x": 0.21,
            "y": -0.4
          },
          {
            "x": 0.21335,
            "y": -0.2034
          },
          {
            "x": 0.11,
            "y": -0.20667
          },
          {
            "x": 0.1067,
            "y": -0.49665
          },
          {
            "x": 0.61,
            "y": -0.5033
          },
          {
            "x": 0.6566,
            "y": -0.5433
          },
          {
            "x": 0.66,
            "y": -0.5967
          },
          {
            "x": 0.61,
            "y": -0.6533
          },
          {
            "x": 0.11333,
            "y": -0.6533
          },
          {
            "x": 0.11,
            "y": -0.6967
          },
          {
            "x": 0.013334,
            "y": -0.6967
          },
          {
            "x": 0.013334,
            "y": -0.6633
          },
          {
            "x": -0.29,
            "y": -0.66
          },
          {
            "x": -0.29,
            "y": -0.7034
          },
          {
            "x": -0.39,
            "y": -0.7
          },
          {
            "x": -0.39,
            "y": -0.6566
          },
          {
            "x": -0.79,
            "y": -0.66
          },
          {
            "x": -0.83,
            "y": -0.6067
          },
          {
            "x": -0.8334,
            "y": -0.5466
          },
          {
            "x": -0.7833,
            "y": -0.5033
          },
          {
            "x": -0.3967,
            "y": -0.49665
          },
          {
            "x": -0.3933,
            "y": -0.20667
          },
          {
            "x": -0.6967,
            "y": -0.2034
          },
          {
            "x": -0.8833,
            "y": -0.3933
          },
          {
            "x": -0.8833,
            "y": 0.00335
          },
          {
            "x": -0.9,
            "y": 0.39
          },
          {
            "x": -0.6967,
            "y": 0.2034
          },
          {
            "x": -0.3933,
            "y": 0.2034
          },
          {
            "x": -0.3933,
            "y": 0.49665
          },
          {
            "x": -0.7866,
            "y": 0.5
          },
          {
            "x": -0.8367,
            "y": 0.55
          },
          {
            "x": -0.8434,
            "y": 0.6
          },
          {
            "x": -0.7866,
            "y": 0.6466
          },
          {
            "x": -0.3933,
            "y": 0.6466
          },
          {
            "x": -0.3933,
            "y": 0.6967
          },
          {
            "x": -0.29,
            "y": 0.6967
          },
          {
            "x": -0.2867,
            "y": 0.64
          },
          {
            "x": 0.01,
            "y": 0.64
          },
          {
            "x": 0.006667,
            "y": 0.6934
          },
          {
            "x": 0.11,
            "y": 0.7034
          },
          {
            "x": 0.11333,
            "y": 0.6367
          },
          {
            "x": 0.6133,
            "y": 0.6333
          },
          {
            "x": 0.66,
            "y": 0.58
          },
          {
            "x": 0.6533,
            "y": 0.54
          },
          {
            "x": 0.62,
            "y": 0.5067
          },
          {
            "x": 0.11,
            "y": 0.49
          },
          {
            "x": 0.11,
            "y": 0.2
          },
          {
            "x": 0.21335,
            "y": 0.19333
          },
          {
            "x": 0.21667,
            "y": 0.4034
          },
          {
            "x": 0.4067,
            "y": 0.2
          },
          {
            "x": 0.6034,
            "y": 0.19
          },
          {
            "x": 0.81,
            "y": -0.01
          }
        ]
      }
    ],
	*/

	// -- agents
function manageGardens (floorZones){
	let gardenZones = floorZones.filter((floorZone) => {
		 return floorZone.specific && floorZone.specific === "auto-garden";
	});
  
	let gardenManagers = [];
  
	 gardenZones.forEach(zone => {
		 gardenManagers.push(new gardenFactory(zone))
	 });
	 return gardenManagers;
  }
  
  function gardenFactory(zone) {
	this.name = zone.name;
	this.circlesOfPlants = zone.circlesOfPlants;
	this.workerOuterSize = zone.workerOuterSize;
	this.workerInnerSize = zone.workerInnerSize;
	this.position = { ...zone.position };
	this.radius = zone.size[0];
	this.workers = [];
	this.nrWorkers = zone.nrWorkers ?? Math.floor(Math.cbrt(this.zone.size[0]) + 0.5);
	this.buildingInfos = {
	  width: this.workerOuterSize * this.nrWorkers,
	  height: this.workerOuterSize,
	  topLeft: {
		x: this.position.x - Math.floor((this.workerOuterSize * this.nrWorkers) / 2),
		y: this.position.y + this.radius + 10
	  },
	  boxes: this.nrWorkers,
	  orientation: zone.orientation ?? toradians(90)
	};
	let data = { ...this };
	for (let i = 0; i < this.nrWorkers; i++) {
	  let workerPosition = {... this.buildingInfos.topLeft};
	  workerPosition.x += (this.workerOuterSize * i);
	  let worker = new gardenWorker(data, i + 1, workerPosition);
	  this.workers.push(worker);
	}
  }
  
  function gardenWorker(data, index, pos) {
	this.outerSize = data.workerOuterSize;
	this.innerSize = data.workerInnerSize;
	this.model = 'gardener';
	this.rank = index;
	this.autoGarden = data.name;
	this.name = `Worker ${index}`;
	this.refillPosition = { ...pos };
	let multiplier = this.innerSize * 0.6;
  
	this.refillPosition.y += multiplier + 2;
	this.refillPosition.x += this.outerSize / 2;
	this.refillPosition.x = Math.floor(this.refillPosition.x);
	this.refillPosition.y = Math.floor(this.refillPosition.y); 
	this.currentPosition = { ...this.refillPosition };
	this.refillOrientation = toradians(270);
	this.currentOrientation = this.refillOrientation;
	this.speed = 50; // millisec per pixel
	this.spots = [null, null, null, null, null]; // "pockets" to carry seeds
	this.battery = { capacity: 200, current: 200, costPer100Pixels: 1, chargingTimePerUnit: 5000 };
	this.pixelsSpent = 0;
	this.action = {
	  status : "powering",
	  missionType : null,
	  objective : null,
	  objectiveType : null
	}
  }
  
  function tidyGarden(){
    console.log('tidy garden');
    worldModel.data.rocks.forEach((rock) => {
      let radius = Math.floor(rock.size);
      console.log(radius);
      worldModel.data.plants = worldModel.data.plants.filter((p) => {
        return getDistance(rock.position, p.position) > radius;
      });
    });

    let findLake = worldModel.data.floor.shapes.filter((x) => {
      return x.name && x.name === "south-lake";
    });
    if (findLake.length === 1) {
      let lakePosition = findLake[0].position;
      let lakeRadius = Math.floor(findLake[0].size[0]);
      console.log(`Lake radius ${lakeRadius}`);
      console.log(worldModel.data.plants.length);

      worldModel.data.plants = worldModel.data.plants.filter((p) => {
        let dist = getDistance(lakePosition, p.position);
        console.log(dist);
        return dist > lakeRadius;
      });
      console.log(worldModel.data.plants.length);

    }
    saveWorld();
  }
