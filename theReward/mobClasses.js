class Bug {
  constructor(id, rot) {
    this.id = id;
    this.rot = rot;
    this.move = 3 + Math.floor((Math.random()*4)+0.5);
    this.urgencyMove = this.move * 2;
    this.huntingMove = 0;
    this.rayNumber = rayNumber;
    this.specie = "bug";
    this.type = "prey";
    this.color = "#EBB667";
    this.size = 6;
    this.sightLength = 120;
    this.fov = Math.PI / 2;
    this.raySrc = null;
    this.rayDest = null;
    this.raysDestLeft = [];
    this.raysDestRight = [];
    this.detectMobs = [];
    this.preferedPt = null;
    this.lastDot = 0;
    this.fleeing = false;
    this.hunting = false;
    this.fleeFor = 0;
    this.rayAngle = this.fov / (rayNumber - 1);
    this.pos = {
      x: -1000,
      y: -1000
    };
    this.mobList = [];
    this.ready = false;
    if(this.move >= 9){
        this.color = "#EB8828";
    }
  }
  drawMob(){
      let d1 =  this.size*0.8;
      let d2 =  this.size*0.6;
      context.strokeStyle = "#000";
      context.fillStyle = this.fleeing ? "#1AD62F" : this.color;
      circle(this.pos.x, this.pos.y, d1);
      context.stroke();
      context.fill();
      let heading = polarToCartesian(this.rot);
      let headPoint = {x:0,y:0};
      headPoint.x = this.pos.x + heading.x * d2;
      headPoint.y = this.pos.y + heading.y * d2;
      circle(headPoint.x, headPoint.y, d2);
      if(doDrawDotProduct && this.fleeing){
        text(this.lastDot,headPoint.x+5, headPoint.y+5);
      }
      context.stroke();
      context.fill();
  }
}

class Ant extends Bug{
  constructor(id,rot){
     super(id,rot);
     this.move = 4;
     this.color = "#795548";
     this.urgencyMove = 0;
     this.huntingMove = this.move + 3;
     this.specie ="ant";
     this.type = "hunter";
     this.size = 12;
     this.sightLength = 110;
  }
  drawMob(){
      let d0 =  this.size*0.95;
      let d1 =  this.size*0.4;
      let d2 =  this.size*0.5;
      context.strokeStyle = "#000";
      context.fillStyle = this.hunting ? "#FF0000" :this.color;
      // body
      circle(this.pos.x, this.pos.y, d2);
      context.stroke();
      context.fill();
      // head
      let stopRot = this.stopFor > 0 ? (frameCount%2 == 0 ? 0.05: -0.05 ) : 0;
      let heading = polarToCartesian(this.rot+stopRot);
      let headPoint = {x:0,y:0};
      headPoint.x = this.pos.x + heading.x * d2;
      headPoint.y = this.pos.y + heading.y * d2;
      let rotAntenna = this.rot+0.3;
      let antenaPt = polarToCartesian(rotAntenna);
      antenaPt.x = headPoint.x + antenaPt.x * d0
      antenaPt.y = headPoint.y + antenaPt.y * d0;
      line(headPoint.x,headPoint.y,antenaPt.x,antenaPt.y);
      rotAntenna = this.rot-0.3;
      antenaPt = polarToCartesian(rotAntenna);
      antenaPt.x = headPoint.x + antenaPt.x * d0
      antenaPt.y = headPoint.y + antenaPt.y * d0;
      line(headPoint.x,headPoint.y,antenaPt.x,antenaPt.y);
      circle(headPoint.x, headPoint.y, d1);
      context.stroke();
      context.fill();
      // tail
      let tailPoint = {x:0,y:0};
      tailPoint.x = this.pos.x - heading.x * d2;
      tailPoint.y = this.pos.y - heading.y * d2;
      circle(tailPoint.x, tailPoint.y, d2);
      context.stroke();
      context.fill();
  }
}
