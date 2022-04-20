function Square(size, distance, angleToOrigine, innerRotation, name) {
    this.size = size;
    this.distance = distance;
    this.angleToOrigine = angleToOrigine;
    this.name = name;
    this.innerRotation = innerRotation;
    this.positionAbsolute = { x: 0, y: 0 };
    this.positionRelative = { x: 0, y: 0 };
    this.half = Math.floor(size / 2);
    this.geometry = new Cube(); // only for 3D
    this.hit = false;
    this.hitAngles = [];
    this.hitMiddleAngle = 0;


    var cos = Math.cos(this.angleToOrigine);
    var sin = -Math.sin(this.angleToOrigine);
    this.topLeft = { "x": 0, "y": 0 };
    this.topRight = { "x": 0, "y": 0 };
    this.bottomLeft = { "x": 0, "y": 0 };
    this.bottomRight = { "x": 0, "y": 0 };

    // the real position according to origin point
    this.positionAbsolute.x = Math.floor(cos * distance);
    this.positionAbsolute.y = Math.floor(sin * distance);

    this.left = this.positionAbsolute.x - this.size / 2;
    this.top = this.positionAbsolute.y - this.size / 2;
    var geometry = this.geometry.data2D;

    this.topLeft = { "x": geometry.topLeft.x, "y": geometry.topLeft.y };
    this.topRight = { "x": geometry.topRight.x, "y": geometry.topRight.y };
    this.bottomLeft = { "x": geometry.bottomLeft.x, "y": geometry.bottomLeft.y };
    this.bottomRight = { "x": geometry.bottomRight.x, "y": geometry.bottomRight.y };

    this.topLeft = simpleRotate(this.topLeft, this.innerRotation);
    this.topRight = simpleRotate(this.topRight, this.innerRotation);
    this.bottomLeft = simpleRotate(this.bottomLeft, this.innerRotation);
    this.bottomRight = simpleRotate(this.bottomRight, this.innerRotation);

    this.topLeft.x = this.topLeft.x * this.half + this.positionAbsolute.x;
    this.topLeft.y = this.topLeft.y * this.half + this.positionAbsolute.y;

    this.topRight.x = this.topRight.x * this.half + this.positionAbsolute.x;
    this.topRight.y = this.topRight.y * this.half + this.positionAbsolute.y;

    this.bottomLeft.x = this.bottomLeft.x * this.half + this.positionAbsolute.x;
    this.bottomLeft.y = this.bottomLeft.y * this.half + this.positionAbsolute.y;

    this.bottomRight.x = this.bottomRight.x * this.half + this.positionAbsolute.x;
    this.bottomRight.y = this.bottomRight.y * this.half + this.positionAbsolute.y;

    this.geometry.normals2D[0] = simpleRotate(this.geometry.normals2D[0], this.innerRotation);
    this.geometry.normals2D[1] = simpleRotate(this.geometry.normals2D[1], this.innerRotation);
    this.geometry.normals2D[2] = simpleRotate(this.geometry.normals2D[2], this.innerRotation);
    this.geometry.normals2D[3] = simpleRotate(this.geometry.normals2D[3], this.innerRotation);


    this.draw = function () {
        this.drawStatic();
    }

    this.drawStatic = function () {
        // the camera moves : the objects stay stationnary so the positionRelative == positionAbsolute
        var self = this;
        context.save();
        context.strokeStyle = "black";
        context.strokeStyle = "white";
        var saveFill = context.fillStyle;
        var saveStroke = context.strokeStyle;

        // drawing normals :
        context.globalAlpha = 0.4;
        context.strokeStyle = "black";
        context.beginPath();

        context.moveTo(self.positionAbsolute.x, self.positionAbsolute.y);
        context.lineTo(self.positionAbsolute.x + self.geometry.normals2D[0].x * self.size, self.positionAbsolute.y + self.geometry.normals2D[0].y * self.size);

        context.moveTo(self.positionAbsolute.x, self.positionAbsolute.y);
        context.lineTo(self.positionAbsolute.x + self.geometry.normals2D[1].x * self.size, self.positionAbsolute.y + self.geometry.normals2D[1].y * self.size);

        context.moveTo(self.positionAbsolute.x, self.positionAbsolute.y);
        context.lineTo(self.positionAbsolute.x + self.geometry.normals2D[2].x * self.size, self.positionAbsolute.y + self.geometry.normals2D[2].y * self.size);

        context.moveTo(self.positionAbsolute.x, self.positionAbsolute.y);
        context.lineTo(self.positionAbsolute.x + self.geometry.normals2D[3].x * self.size, self.positionAbsolute.y + self.geometry.normals2D[3].y * self.size);

        context.stroke();
        context.closePath();

        context.globalAlpha = 0.8;
        context.strokeStyle = "black";
        context.fillStyle = "rgb(20,230,160)";
        context.beginPath();
        // Drawing the square
        context.moveTo(self.topLeft.x, self.topLeft.y);
        context.lineTo(self.topRight.x, self.topRight.y);
        context.lineTo(self.bottomRight.x, self.bottomRight.y);
        context.lineTo(self.bottomLeft.x, self.bottomLeft.y);
        context.lineTo(self.topLeft.x, self.topLeft.y);

        context.closePath();
        context.stroke();
        if (self.hit) {
            context.fillStyle = "red";
            context.fill();
            context.fillStyle = "black";
            context.fillText(Math.floor(todegrees(self.hitMiddleAngle)) + " °", self.topRight.x + 2, self.topRight.y - 2);
        }
        context.fillStyle = "black";
        context.beginPath();
        context.strokeStyle = saveStroke;
        context.fillText(self.name, self.positionAbsolute.x - 2, self.positionAbsolute.y + 2);
        context.closePath();
        context.globalAlpha = 1;
        context.restore();
    }

}

function drawArrow(context,x1,y1,x2,y2){
	var branchLentgh = 10;
	var diffX = x2-x1;
	var diffY = y1-y2;
	var dist =  Math.sqrt(diffX*diffX+diffY*diffY);
	if(dist !=0){
		branchLentgh = Math.floor(dist/3);
		diffX = diffX /dist;
		diffY = diffY /dist;
		// calculation angle given 2 points, just to practise : don't use cam rotation !
		var rotation = calcAngleRadians(diffX,diffY);
		var leftBranch = keepWithInCircle(rotation + k45degres);
		var rightBranch = keepWithInCircle(rotation - k45degres);
		context.moveTo(x1, y1);
		context.lineTo(x2, y2);
		
		context.moveTo(x2, y2);
		context.lineTo(x2-Math.cos(leftBranch)*branchLentgh, y2+Math.sin(leftBranch)*branchLentgh);
		
		context.moveTo(x2, y2);
		context.lineTo(x2, y2);
		context.lineTo(x2-Math.cos(rightBranch)*branchLentgh, y2+Math.sin(rightBranch)*branchLentgh);

	}
}

function Cube() {
    this.data2D = {
        "topLeft": { "x": -1, "y": -1 },
        "topRight": { "x": 1, "y": -1 },
        "bottomLeft": { "x": -1, "y": 1 },
        "bottomRight": { "x": 1, "y": 1 }
    }
    this.data = [
        [-1, -1, -1], // left, bottom, back
        [1, -1, -1], // right, bottom, back
        [1, 1, -1], // right, top, back
        [-1, 1, -1], // left, top, back
        [1, -1, 1], // right, bottom, front
        [-1, -1, 1], // left, bottom, front
        [-1, 1, 1],// left, top, front
        [1, 1, 1] // right, top, front
    ];
    this.poly = [];
    this.poly[0] = [0, 1, 2, 3]; // Back side
    this.poly[1] = [1, 4, 7, 2]; // Right side
    this.poly[2] = [4, 5, 6, 7]; // front side
    this.poly[3] = [5, 0, 3, 6]; // left side
    this.poly[4] = [5, 4, 1, 0]; // bottom side
    this.poly[5] = [3, 2, 7, 6]; // top side

    this.normals = [
        { "x": 0, "y": 0, "z": -1 },
        { "x": 1, "y": 0, "z": 0 },
        { "x": 0, "y": 0, "z": 1 },
        { "x": -1, "y": 0, "z": 0 },
        { "x": 0, "y": -1, "z": 0 },
        { "x": 0, "y": 1, "z": 0 },
    ];
    this.normals2D = [
        { "x": 0, "y": -1, "dot": 0 },
        { "x": 1, "y": 0, "dot": 0 },
        { "x": 0, "y": 1, "dot": 0 },
        { "x": -1, "y": 0, "dot": 0 }
    ];

    this.colors = [
        "DarkOrchid",
        "FireBrick",
        "GoldenRod",
        "HotPink",
        "OrangeRed",
        "MidnightBlue"
    ]
}

function simpleRotate(point,angle){
    var cos = Math.cos(angle);
    var sin = -Math.sin(angle);
    rotatedX = point.x * cos - point.y * sin;
    rotatedY = point.y * cos + point.x * sin;
    return { "x": rotatedX, "y": rotatedY }
}

function calcAngleDegrees(x, y) { // origine : MDN docs
    return Math.atan2(y, x) * 180 / Math.PI;
}

function calcAngleRadians(x, y) { // origine : calcAngleDegrees
    return Math.atan2(y, x);
}