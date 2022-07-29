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