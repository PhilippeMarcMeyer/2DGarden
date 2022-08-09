/*
Philippe MEYER 
DATE : 2018-10-02
*/


var globals = {
	mainHeight : 740,
	mainWidth : 640,
	mode : "P2D",
	baseUnit:100,
	strokeWeight :1,
	strokeColor :  {r:0,g:0,b:0},
	backgroundColor:{r:255,g:255,b:255},
    curveType : "curve",
	saves : [],
	savesRel : [],
	state:"design"
};
let debut = { x: 320,    y: 600  };
let cp1 =   { x: 400,   y: 20  };
let cp2 =   { x: 240,   y: 20  };
let fin =   { x: 320,   y: 600 };
let ctx;
var CrtlPt1,CrtlPt2,ptA,ptB;
var arrObjects = [];

function setup() {
    var mode = (globals.mode == "WEBGL") ? WEBGL : P2D;
	var cnv = createCanvas(globals.mainWidth,globals.mainHeight,mode);
    cnv.parent('canvasZone');
	
	ctx = drawingContext;
	
	document.getElementById(globals.curveType).checked = true;
	
	updateUI();

	setListeners();
	
	ptA = {x:320,y:600,isDragged:false,radius:10,name:"A",color:"#00ff00",shape:"rect"};
	ptB = {x:320,y:600,isDragged:false,radius:10,name:"B",color:"#ee0000",shape:"rect"};
		
	CrtlPt1 = {x:400,y:20,isDragged:false,radius:10,name:"1",color:"#0000ff",shape:"ellipse"};
	CrtlPt2 = {x:240,y:20,isDragged:false,radius:10,name:"2",color:"#0000ff",shape:"ellipse"};
	arrObjects = [CrtlPt1,CrtlPt2,ptA,ptB];
}

function updateUI(){
	var toggler = document.getElementById("toggleState");
	if(globals.state == "design"){
		toggler.value = "Play";
	}else{
		toggler.value = "Design";
	}
}

function setFormulasInUI(alt){
	var zoneId = "formulas";
	var arr = globals.saves;
	if(alt){
		zoneId = "formulasRel";
	   arr = globals.savesRel;
		
	} 
	var html = "";
	if(arr.length >0){
		arr.forEach(function(x){
			html+=x;
		});
		html=html.replace(/[;]/g, ';<br/>');
	}
	document.getElementById(zoneId).innerHTML=html;
}

function setListeners(){
	var curveElements = document.getElementsByName("curveType");
	curveElements.forEach(function(x){
			x.addEventListener("click",function(){
			globals.curveType = this.value;
		},false);
	});
	
	document.getElementById("save").addEventListener("click",function(){
		var formula = null;
		if(globals.curveType=="bezier"){
			formula = "bezier("+ptA.x+","+ptA.y+","+CrtlPt1.x+","+CrtlPt1.y+","+CrtlPt2.x+","+CrtlPt2.y+","+ptB.x+","+ptB.y+");"
			
		}
		if(globals.curveType=="curve"){
			formula = "curve("+CrtlPt1.x+","+CrtlPt1.y+","+ptA.x+","+ptA.y+","+ptB.x+","+ptB.y+","+CrtlPt2.x+","+CrtlPt2.y+");"
		}
		
		if(formula!=null){
			if(globals.saves.indexOf(formula)==-1){
				globals.saves.push(formula);
				setFormulasInUI();
			}
		}
		
	},false);
	
	document.getElementById("saveRelative").addEventListener("click",function(){
		var formula = null;
		var relative = {};
		
		relative.ptA = {x:(ptA.x-320)/640,y:(ptA.y-600)/740};
		relative.CrtlPt1 =  {x:(CrtlPt1.x-320)/640,y:(CrtlPt1.y-600)/740};
		relative.CrtlPt2 = {x:(CrtlPt2.x-320)/640,y:(CrtlPt2.y-600)/740};
		relative.ptB = {x:(ptB.x-320)/640,y:(ptB.y-600)/740};
		
		var result = [];
		
		if(globals.curveType=="bezier"){
			result.push(relative.ptA);
			result.push(relative.CrtlPt1);
			result.push(relative.CrtlPt2);
			result.push(relative.ptB);
		}
		
		if(globals.curveType=="curve"){
						
			result.push(relative.CrtlPt1);
			result.push(relative.ptA);
			result.push(relative.ptB);
			result.push(relative.CrtlPt2);

		}
		formula = JSON.stringify(result);
		if(formula!=null){
			if(globals.savesRel.indexOf(formula)==-1){
				globals.savesRel.push(formula);
				setFormulasInUI(true);
			}
		}
		
	},false);
	
		
	document.getElementById("toggleState").addEventListener("click",function(){
			globals.state = globals.state == "design" ? "play" : "design";
			updateUI();
		},false);
		
	document.getElementById("eraseLast").addEventListener("click",function(){
			if(globals.saves.length >0){
				globals.saves.pop();
				setFormulasInUI();
			}
		},false);
		
	document.getElementById("eraseAll").addEventListener("click",function(){
			if(globals.saves.length >0){
				globals.saves.length = 0;
				setFormulasInUI();
			}
			if(globals.savesRel.length >0){
				globals.savesRel.length = 0;
				setFormulasInUI();
			}
		},false);
}

function draw() {
	background(globals.backgroundColor.r,globals.backgroundColor.g,globals.backgroundColor.b);
	stroke(globals.strokeColor.r,globals.strokeColor.g,globals.strokeColor.b);
	noFill();
	strokeWeight(getStokeWeight());

	if( globals.state == "design" ){
		if(globals.curveType=="bezier"){
			push();
				stroke(0,0,0);
				bezier(ptA.x,ptA.y,CrtlPt1.x,CrtlPt1.y,CrtlPt2.x,CrtlPt2.y,ptB.x,ptB.y);
			pop();
		}
		if(globals.curveType=="curve"){
			push();
				stroke(0,0,0);
				curve(CrtlPt1.x,CrtlPt1.y,ptA.x,ptA.y,ptB.x,ptB.y,CrtlPt2.x,CrtlPt2.y);
			pop();
		}

		push();
			noFill();
			stroke("#999");
			playCurves()
		pop();
		
		arrObjects.forEach(function(pt){
			drawObject(pt);
		});
	}else{
		playCurves()

	}
	
	 // two beziers with common point P



// Courbe de Bézier cubique
ctx.beginPath();
ctx.moveTo(debut.x, debut.y);
ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, fin.x, fin.y);
//ctx.bezierCurveTo(cp3.x, cp3.y, cp4.x, cp4.y, debut.x, debut.y);

ctx.stroke();
}

function playCurves(){
	var instructions = "";
	if(globals.saves.length >0){
		instructions = globals.saves.join(" ");
	var fct= new Function (instructions);
	fct();
	}
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

function mouseDragged() {
  var x = mouseX;
  var y = mouseY;
  	arrObjects.forEach(function(pt){
		 if(pt.isDragged ){
			 pt.x = x;
			 pt.y = y;
		}
	});
  return false;
}

function mousePressed() {
  var x = mouseX;
  var y = mouseY;
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

function mouseReleased() {
	
  var x = mouseX;
  var y = mouseY;
  

  
   arrObjects.forEach(function(pt){
	if(pt.isDragged ){
		pt = stayInside(pt,x,y);
	 }
	 pt.isDragged = false;
   });
  
}

function stayInside(pt,x,y){
 if(x < 0){
	  x = pt.radius;
  }
    if(y < 0){
	  y = pt.radius;
  }
    if(x > globals.mainWidth){
	  x = globals.mainWidth - pt.radius;
  }
    if(y > globals.mainHeight){
	  y = globals.mainHeight - pt.radius;
  }
  pt.x = round(x);
  pt.y = round(y);
  return pt;
}

function getStokeWeight(){
	var strokeWht = globals.strokeWeight;
	if (globals.baseUnit  < 100){
		strokeWht = round(globals.baseUnit  / 20);
		if(strokeWht < 1) strokeWht = 1;
	}
	return strokeWht;
}
