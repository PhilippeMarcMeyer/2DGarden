	
// ******************************************************
// From p5.collide2d.js !!!!! as I don't use p5.js yet 
// ******************************************************
	
	
function collideLineLine(x1, y1, x2, y2, x3, y3, x4, y4) {

  // calculate the distance to intersection point
  var uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
  var uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));

  // if uA and uB are between 0-1, lines are colliding
  if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
		return true;
  }else{
	  return false;
	  }

}

function collideLineRect(x1, y1, x2, y2, rx, ry, rw, rh) {

  // check if the line has hit any of the rectangle's sides. uses the collideLineLine function above
  var left, right, top, bottom, intersection;

     left =   collideLineLine(x1,y1,x2,y2, rx,ry,rx, ry+rh);
     right =  collideLineLine(x1,y1,x2,y2, rx+rw,ry, rx+rw,ry+rh);
     top =    collideLineLine(x1,y1,x2,y2, rx,ry, rx+rw,ry);
     bottom = collideLineLine(x1,y1,x2,y2, rx,ry+rh, rx+rw,ry+rh);

  // if ANY of the above are true, the line has hit the rectangle
  if (left || right || top || bottom) {
    return true;
  }
  return false;
}

function collideLinePoly(x1, y1, x2, y2, vertices) {

  // go through each of the vertices, plus the next vertex in the list
  var next = 0;
  for (var current=0; current<vertices.length; current++) {

    // get next vertex in list if we've hit the end, wrap around to 0
    next = current+1;
    if (next == vertices.length) next = 0;

    // get the PVectors at our current position extract X/Y coordinates from each
    var x3 = vertices[current].x;
    var y3 = vertices[current].y;
    var x4 = vertices[next].x;
    var y4 = vertices[next].y;

    // do a Line/Line comparison if true, return 'true' immediately and stop testing (faster)
    var hit = collideLineLine(x1, y1, x2, y2, x3, y3, x4, y4);
    if (hit) {
      return true;
    }
  }
  // never got a hit
  return false;
}

function collideCirclePoly(cx, cy, diameter, vertices, interior) {

  if (interior == undefined){
    interior = false;
  }

  // go through each of the vertices, plus the next vertex in the list
  var next = 0;
  for (var current=0; current<vertices.length; current++) {

    // get next vertex in list if we've hit the end, wrap around to 0
    next = current+1;
    if (next == vertices.length) next = 0;

    // get the PVectors at our current position this makes our if statement a little cleaner
    var vc = vertices[current];    // c for "current"
    var vn = vertices[next];       // n for "next"

    // check for collision between the circle and a line formed between the two vertices
    var collision = collideLineCircle(vc.x,vc.y, vn.x,vn.y, cx,cy,diameter);
    if (collision) return true;
  }

  // test if the center of the circle is inside the polygon
  if(interior == true){
    var centerInside = collidePointPoly(cx,cy, vertices);
    if (centerInside) return true;
  }

  // otherwise, after all that, return false
  return false;
}

function collidePointCircle(x, y, cx, cy, d) {
	var dist = Math.sqrt((cx-x)*(cx-x) +(cy-y)*(cy-y));
if(dist <= d/2 ){
  return true;
}
return false;
};

function dist(x1,y1, x2,y2){
	 var distX = x2 - x1;
     var distY = y2 - y1;
     return Math.sqrt( (distX*distX) + (distY*distY) );
}

function collidePointLine(px,py,x1,y1,x2,y2, buffer){
  // get distance from the point to the two ends of the line
  

var d1 = dist(px,py, x1,y1);
var d2 = dist(px,py, x2,y2);

// get the length of the line
var lineLen = dist(x1,y1, x2,y2);

// since floats are so minutely accurate, add a little buffer zone that will give collision
if (buffer === undefined){ buffer = 0.1; }   // higher # = less accurate

// if the two distances are equal to the line's length, the point is on the line!
// note we use the buffer here to give a range, rather than one #
if (d1+d2 >= lineLen-buffer && d1+d2 <= lineLen+buffer) {
  return true;
}
return false;
}

function collideLineCircle( x1,  y1,  x2,  y2,  cx,  cy,  diameter) {
  // is either end INSIDE the circle?
  // if so, return true immediately
  var inside1 = collidePointCircle(x1,y1, cx,cy,diameter);
  var inside2 = collidePointCircle(x2,y2, cx,cy,diameter);
  if (inside1 || inside2) return true;

  // get length of the line
  var distX = x1 - x2;
  var distY = y1 - y2;
  var len = Math.sqrt( (distX*distX) + (distY*distY) );

  // get dot product of the line and circle
  var dot = ( ((cx-x1)*(x2-x1)) + ((cy-y1)*(y2-y1)) ) / Math.pow(len,2);

  // find the closest point on the line
  var closestX = x1 + (dot * (x2-x1));
  var closestY = y1 + (dot * (y2-y1));

  // is this point actually on the line segment?
  // if so keep going, but if not, return false
  var onSegment = collidePointLine(closestX,closestY,x1,y1,x2,y2);
  if (!onSegment) return false;

  // get distance to closest point
  distX = closestX - cx;
  distY = closestY - cy;
  var distance = Math.sqrt( (distX*distX) + (distY*distY) );

  if (distance <= diameter/2) {
    return true;
  }
  return false;
}

function collidePointPoly(px, py, vertices) {
  var collision = false;

  // go through each of the vertices, plus the next vertex in the list
  var next = 0;
  for (var current=0; current<vertices.length; current++) {

    // get next vertex in list if we've hit the end, wrap around to 0
    next = current+1;
    if (next == vertices.length) next = 0;

    // get the PVectors at our current position this makes our if statement a little cleaner
    var vc = vertices[current];    // c for "current"
    var vn = vertices[next];       // n for "next"

    // compare position, flip 'collision' variable back and forth
    if (((vc.y > py && vn.y < py) || (vc.y < py && vn.y > py)) &&
         (px < (vn.x-vc.x)*(py-vc.y) / (vn.y-vc.y)+vc.x)) {
            collision = !collision;
    }
  }
  return collision;
}
