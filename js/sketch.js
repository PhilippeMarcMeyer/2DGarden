let w2, h2, w4, h4, wh2, k90degres, k60degres, k45degres, k180degres, k270degres, k360degres, k80degres, k280degres, camFov, focalW, focalH, zoom, focalAverage;
let needUpdate, saveContext, context, _camera, mode, things, debugMode, scribble;
let worldModel, gameLoaded, floor;
let keys = {
	up: false,
	down: false,
	left: false,
	right: false,
	shift: false
}
let framerate = 30;
let emiteveryNframe = 8;
let autoGardens = null;
let isAutoGardensSet = false;
const camOverPlantLimit = 32;
let playerColors = '#4e3d28,#2f1b0c,#303030,#2f4f4f,#5a5e6b,#1d4851,#132e18,#2c0020,#172b3b'.split(',');
let otherPlayersIndex = 0;
let _otherPlayers = [];
let onLine = true;
let lastOnline = new Date().getTime();
const maxLastPing = 2000;
const maxOffLine = 5000;
let playerName = "???";
let playerGeneration = 1;
let playerColor = "#ff0000";
let playerPosition = { x: 0, y: 0 };
let playerRotation = toradians(90);
let playerDotsNumber = 3;
let playerDotsColor = '#ffffff'
let socket = io();
let plantsBag = [];

function mouseClicked() {
	if (keys.shift && gameLoaded) {
		let pointClicked = {
			x: (mouseX - Math.floor(width / 2)) + worldModel.currentCenter.x ,
			y: (mouseY - Math.floor(height / 2)) + worldModel.currentCenter.y
		};
		//pointClicked = realPositionGet(pointClicked);
		console.log(pointClicked);

		let plants = things
		.filter((t) => {
			return t instanceof Plant;
		})

		let plantsClicked = plants.filter((p) => {
			return getDistance(p.position, pointClicked) < 20;
		});

		if (plantsClicked.length > 0) {
			console.log(`plant added to bag : ${plantsClicked[0].name} at ${plantsClicked[0].position.x},${plantsClicked[0].position.y}`);

				if(plantsBag.indexOf(plantsClicked[0].name) === -1){
					plantsBag.push(plantsClicked[0].name);
				}
		
		} else if (plantsBag.length > 0) {
			let plantToMove = plantsBag.shift();
			console.log(`moving plant : ${plantToMove} at ${pointClicked.x},${pointClicked.y}`);
			message({
				what: "plant-moved",
				position: pointClicked,
				target: plantToMove
			})
		}
	}
	return false;
}

function setup() {
	debugMode = false;
	gameLoaded = false;
	frameRate(framerate);
	loadJSON('/files/world1.json', result => {
		worldModel = { ...result }
		things = setNotMobs(worldModel);
		createCanvas(windowWidth, windowHeight);
		setUtilValues();
		translate(width / 2, height / 2);
		context = drawingContext;
		setKeyDown();
		setKeyUp();
		floor = new Floor(worldModel);
		gameLoaded = true;
		socket.on('news', function (msg) {
			console.log(msg)
		});
	});
}

function serverSendPlayerPosition() {
	let posNr = _camera.positionsTransmitter.length;
	if (posNr > 0) {
		message(_camera.positionsTransmitter[posNr - 1]);
		_camera.positionsTransmitter.length = 0;
	}
}

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

function draw() {
	if (!gameLoaded) return;
	if (things.length > 75) {
		framerate = 10;
	} else if (things.length > 65) {
		framerate = 15;
	} else if (things.length > 45) {
		framerate = 20;
	} else {
		framerate = 25;
	}
	if (frameCount % (framerate * 3) === 0) {
		let now = new Date().getTime();
		if (now - lastOnline > maxLastPing) {
			try {
				socket.emit("info", { what: "ping" });
			} catch (error) {
				console.log(error);
				applyConnectionState(false);
			}
		}
		if (now - lastOnline > maxOffLine) {
			applyConnectionState(false);
		}
	}
	translate(width / 2, height / 2);
	clear();
	floor.draw();
	if (_camera) {
		_camera.rotStep = framerate / 100;
		_camera.walkStep = 250 / framerate;
		_camera.setDirection();
		if ((frameCount % emiteveryNframe) === 0) {
			serverSendPlayerPosition();
		}
	}
	things
		.filter((t) => {
			return !(t instanceof Plant) || (t instanceof Plant && t.collider.dim2 < camOverPlantLimit)
		})
		.forEach(function (thing) {
			thing.draw();
		});
		if (_camera) _camera.draw();

		if (isAutoGardensSet) drawAutoGardens();

	things
		.filter((t) => {
			return (t instanceof Plant && t.collider.dim2 >= camOverPlantLimit);
		})
		.forEach(function (thing) {
			thing.draw();
		});

	drawInformations();
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
				// text(`${pt1.x}`, pt1.x, pt1.y + 30);
				// text(`,${pt1.y}`, pt1.x, pt1.y + 60);

			}
		});
	});
}

// Utilities
function drawingPositionGet(truePosition) {
	return {
		"x": worldModel && worldModel.currentCenter ? truePosition.x - worldModel.currentCenter.x : truePosition.x,
		"y": worldModel && worldModel.currentCenter ? truePosition.y - worldModel.currentCenter.y : truePosition.y
	};
}

function realPositionGet(drawingPosition) {
	return {
		"x": worldModel && worldModel.currentCenter ? drawingPosition.x + worldModel.currentCenter.x : drawingPosition.x,
		"y": worldModel && worldModel.currentCenter ? drawingPosition.y + worldModel.currentCenter.y : drawingPosition.y
	};
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	setUtilValues();
	translate(width / 2, height / 2);
	context = drawingContext;
}

function setUtilValues() {
	w2 = width / 2;
	h2 = height / 2;
	wh2 = Math.min(w2, h2);
	w4 = width / 4;
	h4 = height / 4;
	k90degres = toradians(90);
	k60degres = toradians(60);
	k45degres = toradians(45);
	k180degres = toradians(180);
	k270degres = toradians(270);
	k360degres = toradians(360);
	k80degres = toradians(80);
	k280degres = toradians(280);
	camFov = k45degres;
	focalW = w2 / Math.tan(camFov / 2);
	focalH = h2 / Math.tan(camFov / 2);
	zoom = 4;
	focalAverage = (focalW + focalH) / 2;
}

// Converts from degrees to radians.
function toradians(degrees) {
	return degrees * Math.PI / 180;
}

// Converts from radians to degrees.
function todegrees(radians) {
	return radians * 180 / Math.PI;
}

function applyConnectionState(state) {
	if (state) {
		onLine = true;
		lastOnline = new Date().getTime();

	} else {
		onLine = false;
		//_otherPlayers = [];	
	}
}

socket.on("info", (msg) => {
	applyConnectionState(true)
	if (msg.what === 'pong') {
		console.log(msg.what);
	} else if (msg.what === 'player-identity') {
		playerName = msg.name ?? "???";
		playerColor = msg.color ?? "#FF5555";
		playerGeneration = msg.generation ?? 1;
		playerPosition = msg.position ?? { x: 0, y: 0 };
		playerRotation = msg.rotation ?? toradians(90);
		playerDotsNumber = msg.dotsNumber ?? 3;
		playerDotsColor = msg.dotsColor ?? '#ffffff'
		_camera = new Kamera(framerate / 350, 350 / framerate, playerRotation, playerPosition, playerName, playerColor, playerGeneration, playerDotsNumber, playerDotsColor);
		let cookieInfos = { "name": playerName, "color": playerColor, position: playerPosition, rotation: playerRotation };
		document.cookie = "garden=" + JSON.stringify(cookieInfos);
	} else if (msg.what === 'auto-gardens') {
		autoGardens = [...msg.data];
		isAutoGardensSet = false;
	} else if (msg.what === 'player-disconnected') {
		_otherPlayers = _otherPlayers.filter((u) => {
			return u.playerId !== msg.playerId;
		});
	} else if (msg.what === 'player-connected') {
		addUpdatePlayer(msg);
	} else if (msg.what === 'player-moved') {
		addUpdatePlayer(msg);
	} else if (msg.what === 'target-shake') {
		let selectedPlants = things.filter((x) => {
			return x.name && x.name === msg.target;
		});
		if (selectedPlants.length === 1 && selectedPlants[0] instanceof Plant) {
			selectedPlants[0].shake();
		}
	} else if (msg.what === 'world-day') {
		setWorldDay(msg.day)
	}else if(msg.what === 'plant-moved'){
		updatePlants();
	}
});

function setWorldDay(day) {
	worldModel.gardenDay = day;
	updatePlants();
}

function message(info) {
	socket.emit("info", info);
}

function Floor(worldModel) {
	this.name = worldModel.name;
	this.radius = worldModel.radius;
	this.backgroundColor = worldModel.baseColor;
	this.perimeterColor = worldModel.perimeterColor;
	this.center = worldModel.currentCenter;
	this.shapes = worldModel.data && worldModel.data.floor && worldModel.data.floor.shapes ? worldModel.data.floor.shapes : [];
	this.elements = [];

	this.init = function () {
		let self = this;
		if (self.shapes.length > 0) {
			self.shapes.forEach((s) => {
				if (s.shape === "circle") {
					let cos = Math.cos(s.angleToOrigine);
					let sin = -Math.sin(s.angleToOrigine);
					let element = {};
					// the real position according to origin point
					element.center = { x: Math.floor(cos * s.distance), y: Math.floor(sin * s.distance) };
					element.shape = s.shape;
					element.color0 = s.color === "baseColor" ? worldModel.baseColor : s.color;
					let colorAmount = s.way === "up" ? 10 : -10;
					element.color1 = LightenDarkenColor(element.color0, colorAmount);
					element.color2 = LightenDarkenColor(element.color1, colorAmount);
					element.opacity = s.opacity;
					element.diameter1 = s.size[0];
					element.diameter2 = Math.floor(element.diameter1 / 2);
					self.elements.push(element);
				} else if (s.shape === "polygon") {
					let cos = Math.cos(s.angleToOrigine);
					let sin = -Math.sin(s.angleToOrigine);
					let element = {};
					// the real position according to origin point
					element.center = { x: Math.floor(cos * s.distance), y: Math.floor(sin * s.distance) };
					element.shape = s.shape;
					element.color = s.color === "baseColor" ? worldModel.baseColor : s.color;
					element.opacity = s.opacity;
					element.size = s.size[0];
					element.points = s.matrix.map((pt) => {
						return simpleRotate(pt, s.innerRotation);
					});
					element.points.forEach((pt) => {
						pt.x = element.center.x + (element.size * pt.x);
						pt.y = element.center.y + (element.size * pt.y);
					})
					if (s.colliderMode) {
						element.collider = {
							shape: "poly",
							center: element.center,
							data: [...element.points],
							dim2: null,
							mode: s.colliderMode
						}
					}
					self.elements.push(element);
				}
			});
		}
	}

	this.draw = function () {
		let self = this;
		context.save();
		context.beginPath();
		context.fillStyle = self.backgroundColor;
		context.strokeStyle = self.perimeterColor;
		context.rect(-w2, -h2, width, height);
		context.closePath();
		context.fill();
		context.stroke();
		context.restore();

		self.elements.forEach((elem) => {
			if (elem.shape === "circle") {
				context.save();
				context.beginPath();
				let centralPt = drawingPositionGet({ ...elem.center });
				context.fillStyle = elem.color1;
				context.strokeStyle = elem.color1;
				context.globalAlpha = elem.opacity;
				context.arc(centralPt.x, centralPt.y, elem.diameter1, 0, 2 * Math.PI);
				context.closePath();
				context.fill();
				context.stroke();

				context.beginPath();
				context.fillStyle = elem.color2;
				context.strokeStyle = elem.color2;
				context.globalAlpha = elem.opacity;
				context.arc(centralPt.x, centralPt.y, elem.diameter2, 0, 2 * Math.PI);
				context.closePath();
				context.fill();
				context.stroke();
				context.restore();
			} else if (elem.shape === "polygon") {
				context.save();
				context.beginPath();
				context.globalAlpha = elem.opacity;
				context.fillStyle = elem.color;
				context.strokeStyle = elem.color;
				let drawPos = drawingPositionGet(elem.points[0]);
				context.moveTo(drawPos.x, drawPos.y);
				elem.points.forEach((pt) => {
					drawPos = drawingPositionGet(pt);
					context.lineTo(drawPos.x, drawPos.y);
				})
				context.closePath();
				context.stroke();
				context.fill();
				context.restore();
			}
		});
	}

	this.init();

	return this;
}

function Kamera(rotStep, walkStep, rotation, position, playerName, playerColor, playerGeneration, playerDotsNumber, playerDotsColor) {

	let w2 = width / 2;
	let h2 = height / 2;
	let wh2 = Math.min(w2, h2);
	let w4 = width / 4;
	let h4 = height / 4;

	this.knownThings = [];
	this.rotation = rotation ? rotation : 0;
	this.position = position;
	this.distance = 0;
	this.previousLocation = { x: 0, y: 0 };
	this.antePenultLocation = { x: 0, y: 0 };
	this.isMoving = false;
	this.sightWidth = toradians(90);
	this.sightLength = 200;
	this.walkStep = walkStep;
	this.rotStep = rotStep;
	this.bodyRadius = 20;
	this.bodyInMotionDiameter1 = 18;
	this.bodyInMotionDiameter2 = 22;
	this.name = playerName;
	this.generation = playerGeneration;
	this.color = playerColor,
		this.opacity = 1;
	this.wLimit = w2 - w4;
	this.hLimit = h2 - h4;
	this.dotsNumber = playerDotsNumber;
	this.dotsColor = playerDotsColor;
	this.positionsTransmitter = [];

	if (worldModel && worldModel.currentCenter) worldModel.currentCente = { ...this.position };

	this.turn = function (amount) { // -1 or +1
		let self = this;
		this.rotation -= this.rotStep * amount;
		if (this.rotation < 0) this.rotation += k360degres;
		if (this.rotation > k360degres) this.rotation = 0;
		self.positionsTransmitter.push({
			what: "player-moved",
			position: self.position,
			rotation: self.rotation
		});
	}

	this.setDirection = function () {

		_camera.isMoving = false;

		if (keys.left) {
			_camera.turn(-1);
		}
		if (keys.right) {
			_camera.turn(1);
		}
		if (keys.up) {
			_camera.walk(1);
			_camera.isMoving = true;
		}
		if (keys.down) {
			_camera.walk(-0.45, true);
			_camera.isMoving = true;

		}
	}

	this.walk = function (amount, rnd) {// -1 or +1
		var self = this;
		// Calculate new position considering the amount, the position and the direction	
		this.savePosition();
		//amount *= self.walkStep;
		let drawPos = drawingPositionGet(self.position);
		self.distance = getDistance({ x: 0, y: 0 }, worldModel.currentCenter);
		let randomized = 0;
		if (rnd) {
			let flipCoin = Math.floor(Math.random() * 2)
			randomized = Math.random();
			randomized *= flipCoin == 1 ? -1 : 1;
		}
		let rotation = this.rotation + randomized;
		var dirx = Math.cos(rotation);
		var diry = - Math.sin(rotation);
		self.position.x = Math.floor(self.position.x + (dirx * amount * self.walkStep));
		self.position.y = Math.floor(self.position.y + (diry * amount * self.walkStep));

		self.isMoving = true;

		floor.elements
			.forEach((x) => {
				if (x.collider && x.collider.shape === "poly") {
					if (collideCirclePoly(self.position.x, self.position.y, self.bodyRadius * 2, x.collider.data)) {
						self.restorePosition();
						self.isMoving = false;
					}
				}
			});

		if (self.isMoving) {
			self.checkCollisions();
		}

		if (self.isMoving) {
			if (drawPos.x > self.wLimit) {
				worldModel.currentCenter.x += (self.position.x - self.previousLocation.x);
			} else if (drawPos.x < self.wLimit) {
				worldModel.currentCenter.x -= (self.previousLocation.x - self.position.x);
			}

			if (drawPos.y > self.hLimit) {
				worldModel.currentCenter.y += (self.position.y - self.previousLocation.y);
			} else if (drawPos.y < self.hLimit) {
				worldModel.currentCenter.y -= (self.previousLocation.y - self.position.y);
			}
			self.positionsTransmitter.push({
				what: "player-moved",
				position: self.position,
				rotation: self.rotation
			});

			if (frameCount % framerate === 1) {
				let cookieInfos = { name: self.name, color: self.color, position: self.position, rotation: self.rotation, generation: self.generation };
				document.cookie = "garden=" + JSON.stringify(cookieInfos);
			}
		}
	}

	this.draw = function () {
		var self = this;
		self.drawCross();
		self.drawCamera();
		if (_otherPlayers.length > 0) {
			_otherPlayers.forEach(function (u) {
				_camera.drawCamera.apply(u);
			});
		}
		//self.drawScanner();
	}

	this.checkCollisions = function () {
		let self = this;
		let stopped = false;
		if (autoGardens && isAutoGardensSet) {
			autoGardens.forEach((garden) => {
				if (garden.collider) {
					if (collideCirclePoly(self.position.x, self.position.y, self.bodyRadius * 2, garden.collider.data)) {
						self.restorePosition();
						self.isMoving = false;
						stopped = true;
					}
				}
			});
		}

		if (stopped) return;

		for (let i = 0; i < things.length; i++) {
			if (stopped) break;
			let x = things[i];
			if (x.collider.shape === 'poly') {
				if (collideCirclePoly(self.position.x, self.position.y, self.bodyRadius * 2, x.collider.data)) {
					self.restorePosition();
					self.isMoving = false;
					stopped = true;
				}
			} else if (x.collider.shape === 'circle') {
				if (collideCircleCircle(self.position.x, self.position.y, self.bodyRadius * 2, x.collider.center.x, x.collider.center.y, x.collider.data)) {
					x.shake();
					stopped = true;
					message({
						what: "player-collided",
						position: this.position,
						rotation: this.rotation,
						target: x.name
					})
				}
			}
		}

		if (stopped) return;
/* 
		if (_otherPlayers.length > 0 && !keys.shift) {
			for (let i = 0; i < things._otherPlayers; i++) {
				if (stopped) break;
				let u = _otherPlayers[i];
				if (collideCircleCircle(self.position.x, self.position.y, self.bodyRadius * 2, u.position.x, u.position.y, u.bodyRadius * 2)) {
					self.restorePosition();
					self.isMoving = false;
					stopped = true;
				}
			};
		} */
	}

	this.drawCross = function () {
		context.save();
		context.globalAlpha = 0.4;
		context.beginPath();
		context.strokeStyle = "green";
		context.fillStyle = "white";
		var camCos = Math.cos(k90degres);
		var camSin = -Math.sin(k90degres);

		var vectorCam = {
			x: camCos * 50,
			y: camSin * 50
		};

		var west = drawingPositionGet(simpleRotate(vectorCam, k90degres));
		var east = drawingPositionGet(simpleRotate(vectorCam, -k90degres));
		var north = drawingPositionGet(vectorCam);
		var south = drawingPositionGet(simpleRotate(vectorCam, -k180degres));

		context.beginPath();
		context.strokeStyle = "black";
		context.moveTo(west.x, west.y);
		context.lineTo(east.x, east.y);
		context.moveTo(north.x, north.y);
		context.lineTo(south.x, south.y);
		context.closePath();
		context.stroke();

		context.beginPath();
		context.fillStyle = "black";
		context.fillText("W", west.x - 5, west.y);
		context.fillText("E", east.x - 5, east.y);
		context.fillText("N", north.x - 5, north.y);
		context.fillText("S", south.x - 5, south.y);
		context.closePath();
		context.stroke();

		context.restore();
	}

	this.drawCamera = function () {
		let self = this;
		if (worldModel && worldModel.currentCenter) worldModel.currentCenter = { ...self.position };

		let drawPos = drawingPositionGet(self.position);
		let camCos = Math.cos(self.rotation + k90degres);
		let camSin = -Math.sin(self.rotation + k90degres);
		let camCos2 = Math.cos(self.rotation);
		let camSin2 = -Math.sin(self.rotation);

		let dotsPositions = [];

		if (self.dotsNumber === 2) {
			dotsPositions = [
				{ x: camCos * -9, y: camSin * -9 },
				{ x: camCos * 9, y: camSin * 9 }
			];
		} else if (self.dotsNumber === 3) {
			dotsPositions = [
				{ x: camCos * -9, y: camSin * -9 },
				{ x: camCos * 9, y: camSin * 9 },
				{ x: camCos2 * -10, y: camSin2 * -10 }
			];
		} else if (self.dotsNumber === 4) {
			dotsPositions = [
				{ x: camCos * -9, y: camSin * -9 },
				{ x: camCos * 9, y: camSin * 9 },
				{ x: camCos * -9, y: camSin * 9 },
				{ x: camCos * -9, y: camSin * 9 }
			];
		}

		camCos = Math.cos(self.rotation);
		camSin = -Math.sin(self.rotation);

		context.save();

		context.globalAlpha = self.opacity;

		context.beginPath();
		context.strokeStyle = "black";
		context.fillStyle = self.color;

		context.beginPath();
		if (self.isMoving) {
			if (frameCount % 4 === 0) {
				context.ellipse(drawPos.x, drawPos.y, self.bodyRadius, self.bodyInMotionDiameter2, self.rotation * -1, 0, 2 * Math.PI);
			} else {
				context.ellipse(drawPos.x, drawPos.y, self.bodyRadius, self.bodyInMotionDiameter1, self.rotation * -1, 0, 2 * Math.PI);
			}
		} else {
			context.ellipse(drawPos.x, drawPos.y, self.bodyRadius, self.bodyRadius * 0.9, self.rotation * -1, 0, 2 * Math.PI);
		}

		context.closePath();
		context.stroke();
		context.fill();
		//self.dotsNumber
		context.beginPath();
		context.strokeStyle = self.dotsColor;
		context.fillStyle = self.dotsColor;

		dotsPositions.forEach((d) => {
			circle(drawPos.x + d.x, drawPos.y + d.y, 6);
		});
		context.closePath();
		context.stroke();
		context.fill();

		let completeName = self.generation > 1 ? self.name + " " + self.generation : self.name;
		text(completeName, drawPos.x + 30, drawPos.y);

		// right Eye
		let eyeCos = Math.cos(self.rotation - 0.4);
		let eyeSin = -Math.sin(self.rotation - 0.4);
		let vectorEye = { x: eyeCos * 30, y: eyeSin * 30 };
		let pupilCos = Math.cos(self.rotation - 0.3);
		let pupilSin = -Math.sin(self.rotation - 0.3);
		let vectorPupil = { x: pupilCos * 30, y: pupilSin * 30 };

		context.fillStyle = "white";
		context.beginPath();
		context.arc(drawPos.x + (vectorEye.x * 0.5), drawPos.y + (vectorEye.y * 0.5), (self.bodyRadius / 4), 0, 2 * Math.PI, false);
		context.closePath();
		context.stroke();
		context.fill();

		context.fillStyle = "black";
		context.beginPath();
		context.arc(drawPos.x + (vectorPupil.x * 0.6), drawPos.y + (vectorPupil.y * 0.6), (self.bodyRadius / 8), 0, 2 * Math.PI, false);
		context.closePath();
		context.stroke();
		context.fill();

		//strokeWeight(10);
		// left Eye
		eyeCos = Math.cos(self.rotation + 0.4);
		eyeSin = -Math.sin(self.rotation + 0.4);
		vectorEye = { x: eyeCos * 30, y: eyeSin * 30 };
		pupilCos = Math.cos(self.rotation + 0.3);
		pupilSin = -Math.sin(self.rotation + 0.3);
		vectorPupil = { x: pupilCos * 30, y: pupilSin * 30 };
		context.fillStyle = "white";

		context.beginPath();
		context.arc(drawPos.x + (vectorEye.x * 0.5), drawPos.y + (vectorEye.y * 0.5), (this.bodyRadius / 4), 0, 2 * Math.PI, false);
		context.closePath();
		context.stroke();
		context.fill();

		context.fillStyle = "black";
		context.beginPath();
		context.arc(drawPos.x + (vectorPupil.x * 0.6), drawPos.y + (vectorPupil.y * 0.6), (this.bodyRadius / 8), 0, 2 * Math.PI, false);
		context.closePath();
		context.stroke();
		context.fill();


		context.restore();
	}

	this.drawScanner = function () {
		let self = this;
		context.save();
		context.globalAlpha = 0.35;
		context.beginPath();
		var rotationLeftLimit = self.rotation - this.sightWidth / 2;
		var rotationRightLimit = self.rotation + this.sightWidth / 2;

		context.strokeStyle = "rgb(255,255,0)";
		var ray;
		things.forEach(function (x) {
			x.hit = false;
			x.hitAngles.length = 0;
		});
		var relativeAngle = - this.sightWidth / 2;
		var step = 0.02;
		var rayLength = this.sightLength - this.bodyRadius;
		for (var i = rotationLeftLimit; i <= rotationRightLimit; i += step) {
			camCos = Math.cos(i);
			camSin = -Math.sin(i);

			var start = { "x": self.position.x + camCos * this.bodyRadius, "y": self.position.y + camSin * this.bodyRadius };
			context.moveTo(start.x, start.y);

			ray = { x: camCos * rayLength, y: camSin * rayLength };
			var end = { "x": start.x + ray.x, "y": start.y + ray.y };
			context.lineTo(end.x, end.y);
			things.forEach(function (x) {

				var poly = x.geometry.data2D;
				/*
					if(collideLinePoly(start.x,start.y,end.x,end.y,poly)){
						x.hit = true;
						x.hitAngles.push(relativeAngle);
					}	
					*/
			});
			relativeAngle += step;
		}
		things.forEach(function (x) {
			if (x.hit) {
				var nrHits = x.hitAngles.length;
				if (nrHits == 0) {
					x.hit = false;
				} else if (nrHits == 1) {
					x.hitMiddleAngle = x.hitAngles[0];
				} else {
					x.hitMiddleAngle = x.hitAngles[Math.floor((nrHits - 1) / 2)];
				}
			}

		});

		context.moveTo(self.position.x, self.position.y);
		camCos = Math.cos(rotationRightLimit);
		camSin = -Math.sin(rotationRightLimit);
		ray = { x: camCos * this.sightLength, y: camSin * this.sightLength };
		context.lineTo(self.position.x + ray.x, self.position.y + ray.y);
		context.closePath();
		context.stroke();

		context.beginPath();
		context.moveTo(self.position.x, self.position.y);
		context.arc(self.position.x, self.position.y, this.sightLength, -rotationRightLimit, -rotationLeftLimit, false);

		context.closePath();
		context.stroke();
		context.restore();
	}

	this.savePosition = function () {

		this.antePenultLocation.x = this.previousLocation.x;
		this.antePenultLocation.y = this.previousLocation.y;

		this.previousLocation.x = this.position.x;
		this.previousLocation.y = this.position.y;
	}

	this.restorePosition = function () {
		this.position.x = this.previousLocation.x;
		this.position.y = this.previousLocation.y;

		this.previousLocation.x = this.antePenultLocation.x;
		this.previousLocation.y = this.antePenultLocation.y;
	}

}

function updatePlants() {
	let plants;
	plantsUpdate()
		.then(function (data) {
			if ("error" in data) {
				console.log(data.error);
			} else {
				let newPlants = [];
				plants = [...data];
				things = things.filter((t) => {
					return !(t instanceof Plant)
				});
				plants.forEach((r, i) => {
					let plant = new Plant(r)
					plant.init(newPlants);
					newPlants.push(plant);
				});
				worldModel.data.plants = [...plants];
				newPlants.sort((a, b) => {
					return a.collider.dim2 - b.collider.dim2;
				});
				things = [...things, ...newPlants];
			}
		})
}

function setNotMobs(world) {
	let notMobs = [];
	world.data.rocks.forEach((r) => {
		notMobs.push(new PolyThing(r));
	});
	notMobs.forEach(function (t) {
		t.init();
	});
	let notMobsPlants = [];
	world.data.plants.forEach((r) => {
		notMobsPlants.push(new Plant(r));
	});
	notMobsPlants.forEach(function (t) {
		t.init(notMobsPlants);
	});
	notMobsPlants.sort((a, b) => {
		return a.collider.dim2 - b.collider.dim2;
	});
	notMobs = notMobs.concat(notMobsPlants);
	return notMobs;
}

function Plant(data) {
	this.birth = data.birth;
	this.today = new Date();
	this.age = worldModel.gardenDay - data.birth + 1;
	this.size = Math.min(this.age * data.size.growthPerDay + data.size.min, data.size.max);
	this.distance = data.distance;
	this.angleToOrigine = data.angleToOrigine;
	this.name = data.name;
	this.innerRotation = data.innerRotation;
	this.positionAbsolute = { x: 0, y: 0 };
	this.positionRelative = { x: 0, y: 0 };
	this.half = Math.floor(this.size / 2);
	this.shape = data.shape;
	this.hit = false;
	this.hitAngles = [];
	this.hitMiddleAngle = 0;
	this.color = data.color;
	this.petals = data.petals || null;
	this.leaves = data.leaves || null;
	this.model = data.model ? data.model : null;
	this.protectRadius = null;
	this.stage = data.stage ?? 1;
	this.isPrime = false;
	this.position = data.position ?? getPosition(this.distance, this.angleToOrigine)
	this.positionAbsolute = data.position ?? null;
	this.collider = {
		shape: "circle",
		center: null,
		data: null,
		dim2: null
	}
	this.init = function (arrOfPlants) {
		let self = this;
		let modelQueryResult = null;

		if (self.model) {
			modelQueryResult = worldModel.data.models.filter((x) => { return x.name === self.model });
		}

		if (self.petals === null) {
			if (modelQueryResult.length === 1) {
				self.petals = { ...modelQueryResult[0].petals };
			}
		}

		if (self.leaves === null) {
			if (modelQueryResult.length === 1) {
				if (modelQueryResult[0].leaves) {
					self.leaves = { ...modelQueryResult[0].leaves };
				}
			}
		}

		if (self.petals === null) {
			throw 'Not implemented plant : ' + self.name;
		}

		if (modelQueryResult.length === 1) {
			if (modelQueryResult[0].protectRadius) {
				self.protectRadius = { ...modelQueryResult[0].protectRadius };
			}
		}

		// the real position according to origin point
		if(!self.positionAbsolute){
			self.positionAbsolute = {...self.position};
/* 			let cos = Math.cos(self.angleToOrigine);
			let sin = -Math.sin(self.angleToOrigine);
			self.positionAbsolute.x = Math.floor(cos * self.distance);
			self.positionAbsolute.y = Math.floor(sin * self.distance); */
		}
		
		/*
			let minDistanceToNeighbour = 1000;
			if(arrOfPlants){
				arrOfPlants.forEach((n) => {
					let dist = getDistance(n.positionAbsolute,self.positionAbsolute);
					if(dist > 0 && dist < minDistanceToNeighbour){
						minDistanceToNeighbour = dist;
					}
				});
			}
		*/
		let spikesRadius = Math.min(self.age * self.petals.leafModel.size.growthPerDay + self.petals.leafModel.size.min, self.petals.leafModel.size.max);

		if (self.protectRadius !== null) {
			self.protectRadius.radius = Math.min((self.age * self.protectRadius.growthPerDay) + self.protectRadius.min, self.protectRadius.max);
		} else {
			self.protectRadius = { radius: 0 };
		}
		self.geometry = {};
		self.geometry.heart = { shape: self.shape, color: self.color, diameter: self.size, center: null };
		self.collider.data = self.size;

		if (self.petals === null) {
			self.geometry.crown = null;
		} else {
			self.geometry.crown = { shape: self.petals.shape, color: self.petals.leafModel.color, number: self.petals.number, radius: spikesRadius };
			if (self.geometry.crown.shape === "double-curve") {
				self.geometry.crown.borderColor = LightenDarkenColor(self.geometry.crown.color, -60)
			} else if (self.geometry.crown.shape === "double-bezier") {
				self.geometry.crown.borderColor = LightenDarkenColor(self.geometry.crown.color, 40)
			} else {
				self.geometry.crown.borderColor = LightenDarkenColor(self.geometry.crown.color, 100)
			}
			self.geometry.crown.spikes = [];
			if (self.geometry.crown.shape === "double-curve" || self.geometry.crown.shape === "double-bezier") {
				for (let i = 0; i < self.geometry.crown.number; i++) {
					let matrix = [...self.petals.leafModel.matrix];
					self.geometry.crown.spikes.push({
						curveLeft: {
							ctrlPt1: matrix[0],
							pt1: matrix[1],
							pt2: matrix[2],
							ctrlPt2: matrix[3]
						},
						curveRight: {
							ctrlPt1: matrix[4],
							pt1: matrix[5],
							pt2: matrix[6],
							ctrlPt2: matrix[7]
						}
					})
				}

				self.geometry.heart.center = { x: self.positionAbsolute.x, y: self.positionAbsolute.y };
				self.collider.center = { x: self.positionAbsolute.x, y: self.positionAbsolute.y };
				const spikeRadius = self.geometry.crown.radius;
				self.collider.dim2 = spikeRadius;
				self.geometry.crown.spikes.forEach((spike, index) => {
					for (const key in spike.curveLeft) {
						let centralPoint = { ...self.positionAbsolute };
						spike.curveLeft[key] = simpleRotate(spike.curveLeft[key], self.innerRotation + self.petals.leafModel.angles[index]);
						spike.curveLeft[key].x = Math.floor(centralPoint.x + (spike.curveLeft[key].x * spikeRadius));
						spike.curveLeft[key].y = Math.floor(centralPoint.y + (spike.curveLeft[key].y * spikeRadius));
					}
					for (const key in spike.curveRight) {
						let centralPoint = { ...self.positionAbsolute };
						spike.curveRight[key] = simpleRotate(spike.curveRight[key], self.innerRotation + self.petals.leafModel.angles[index]);
						spike.curveRight[key].x = Math.floor(centralPoint.x + (spike.curveRight[key].x * spikeRadius));
						spike.curveRight[key].y = Math.floor(centralPoint.y + (spike.curveRight[key].y * spikeRadius));
					}
				});
			} else if (self.geometry.crown.shape === "lines") {

				let centralPoint = { ...self.positionAbsolute };
				self.geometry.heart.center = { ...self.positionAbsolute };;
				self.collider.center = { ...self.positionAbsolute };

				const spikeRadius = self.geometry.crown.radius;

				self.collider.dim2 = spikeRadius;
				let aleaMax = Math.floor(spikeRadius / 8);
				for (let i = 0; i < self.geometry.crown.number; i++) {
					let pt = { x: 0, y: -1 };
					let alea = (Math.random() * aleaMax) - aleaMax;
					pt = simpleRotate(pt, self.innerRotation + self.petals.leafModel.angles[i]);

					pt.x = Math.floor(centralPoint.x + (pt.x * spikeRadius) + alea);
					pt.y = Math.floor(centralPoint.y + (pt.y * spikeRadius) + alea);
					self.geometry.crown.spikes.push(pt);
				}
			} else {
				throw 'Not implemented plant crown shape : ' + self.geometry.crown.shape;
			}
		}

		self.geometry.leaves = null;
		if (self.leaves !== null) {
			let spikesRadius = Math.min(self.age * self.leaves.leafModel.size.growthPerDay + self.leaves.leafModel.size.min, self.leaves.leafModel.size.max);

			self.geometry.leaves = { shape: self.leaves.shape, color: self.leaves.leafModel.color, number: self.leaves.number, radius: spikesRadius };
			self.geometry.leaves.borderColor = LightenDarkenColor(self.geometry.leaves.color, 40);

			self.geometry.leaves.spikes = [];
			if (self.geometry.leaves.shape === "double-curve" || self.geometry.leaves.shape === "double-bezier") {
				for (let i = 0; i < self.geometry.leaves.number; i++) {
					let matrix = [...self.leaves.leafModel.matrix];
					self.geometry.leaves.spikes.push({
						curveLeft: {
							ctrlPt1: matrix[0],
							pt1: matrix[1],
							pt2: matrix[2],
							ctrlPt2: matrix[3]
						},
						curveRight: {
							ctrlPt1: matrix[4],
							pt1: matrix[5],
							pt2: matrix[6],
							ctrlPt2: matrix[7]
						}
					})
				}

				const spikeRadius = self.geometry.leaves.radius;
				self.geometry.leaves.spikes.forEach((spike, index) => {
					for (const key in spike.curveLeft) {
						let centralPoint = { ...self.positionAbsolute };
						spike.curveLeft[key] = simpleRotate(spike.curveLeft[key], self.innerRotation + self.leaves.leafModel.angles[index]);
						spike.curveLeft[key].x = Math.floor(centralPoint.x + (spike.curveLeft[key].x * spikeRadius));
						spike.curveLeft[key].y = Math.floor(centralPoint.y + (spike.curveLeft[key].y * spikeRadius));
					}
					for (const key in spike.curveRight) {
						let centralPoint = { ...self.positionAbsolute };
						spike.curveRight[key] = simpleRotate(spike.curveRight[key], self.innerRotation + self.leaves.leafModel.angles[index]);
						spike.curveRight[key].x = Math.floor(centralPoint.x + (spike.curveRight[key].x * spikeRadius));
						spike.curveRight[key].y = Math.floor(centralPoint.y + (spike.curveRight[key].y * spikeRadius));
					}
				});
			}
		}
		
		this.shake = function () {
			var self = this;
			self.animation = [-2, 2, -2, 2, -2, 2, -2, 2, -2, 2, -2, 2, -2, 2, -2, 2, -1, 1, -3, -2, 2];
		}
		this.draw = function () {
			var self = this;
			isVisible = true;
			if (!isVisible) return;
			if (self.stage === 0) {
				context.save();
				context.strokeStyle = "#CA6A0B";
				context.fillStyle = "#CA6A0B";
				context.beginPath();
				let centralPt = drawingPositionGet(self.positionAbsolute);
				circle(centralPt.x, centralPt.y, self.geometry.heart.diameter);
				if (debugMode) {text(`${self.name} (seed)`, centralPt.x + 20, centralPt.y);text(`${self.positionAbsolute.x},${self.positionAbsolute.y}`, centralPt.x, centralPt.y + 20);};
				context.closePath();
				context.stroke();
				context.fill();
				context.restore();
				return;
			}
			if (self.protectRadius && self.protectRadius.radius > 0) {
				context.save();
				context.strokeStyle = self.protectRadius.color;
				context.fillStyle = self.protectRadius.color;
				context.globalAlpha = 0.04;
				context.beginPath();
				let centralPt = drawingPositionGet(self.positionAbsolute);
				circle(centralPt.x, centralPt.y, self.protectRadius.radius);
				context.closePath();
				context.stroke();
				context.fill();
				context.restore();
			}
			if (self.geometry && self.geometry.leaves) {
				if (self.geometry.leaves.shape === "double-curve" || self.geometry.leaves.shape === "double-bezier") {
					let color = self.geometry.leaves.color;
					let borderColor = self.geometry.leaves.borderColor;
					self.geometry.leaves.spikes.forEach((spike) => {
						let leftPts;
						let rightPts;

						leftPts = { ...spike.curveLeft };
						rightPts = { ...spike.curveRight };

						for (const key in leftPts) {
							leftPts[key] = drawingPositionGet(leftPts[key]);
						}
						for (const key in rightPts) {
							rightPts[key] = drawingPositionGet(rightPts[key]);
						}

						context.save();

						context.globalAlpha = 1;
						context.strokeStyle = borderColor;
						context.fillStyle = color;

						context.beginPath();
						if (self.geometry.leaves.shape === "double-curve") {
							curve(leftPts.ctrlPt1.x, leftPts.ctrlPt1.y, leftPts.pt1.x, leftPts.pt1.y, leftPts.pt2.x, leftPts.pt2.y, leftPts.ctrlPt2.x, leftPts.ctrlPt2.y);
							curve(rightPts.ctrlPt1.x, rightPts.ctrlPt1.y, rightPts.pt1.x, rightPts.pt1.y, rightPts.pt2.x, rightPts.pt2.y, rightPts.ctrlPt2.x, rightPts.ctrlPt2.y);
						}
						if (self.geometry.leaves.shape === "double-bezier") {
							bezier(leftPts.pt1.x, leftPts.pt1.y, leftPts.ctrlPt1.x, leftPts.ctrlPt1.y, leftPts.ctrlPt2.x, leftPts.ctrlPt2.y, leftPts.pt2.x, leftPts.pt2.y);
							bezier(rightPts.pt1.x, rightPts.pt1.y, rightPts.ctrlPt1.x, rightPts.ctrlPt1.y, rightPts.ctrlPt2.x, rightPts.ctrlPt2.y, rightPts.pt2.x, rightPts.pt2.y);
						}
						context.closePath();
						context.stroke();
						context.fill();
						context.restore();

					});
				}
			}
			if (self.geometry && self.geometry.crown) {
				if (self.geometry.crown.shape === "double-curve" || self.geometry.crown.shape === "double-bezier" || self.geometry.crown.shape === "lines") {
					let color = self.geometry.crown.color;
					let borderColor = self.geometry.crown.borderColor;
					self.geometry.crown.spikes.forEach((spike) => {
						let leftPts;
						let rightPts;
						if (self.geometry.crown.shape === "double-curve" || self.geometry.crown.shape === "double-bezier") {
							leftPts = { ...spike.curveLeft };
							rightPts = { ...spike.curveRight };

							for (const key in leftPts) {
								leftPts[key] = drawingPositionGet(leftPts[key]);
							}
							for (const key in rightPts) {
								rightPts[key] = drawingPositionGet(rightPts[key]);
							}
						}

						context.save();

						if (self.animation && self.animation.length > 0) {
							translate(self.animation[0], self.animation[0]);
							self.animation.shift();
						}

						context.globalAlpha = 1;
						context.strokeStyle = borderColor;
						context.fillStyle = color;

						context.beginPath();
						if (self.geometry.crown.shape === "double-curve") {
							curve(leftPts.ctrlPt1.x, leftPts.ctrlPt1.y, leftPts.pt1.x, leftPts.pt1.y, leftPts.pt2.x, leftPts.pt2.y, leftPts.ctrlPt2.x, leftPts.ctrlPt2.y);
							curve(rightPts.ctrlPt1.x, rightPts.ctrlPt1.y, rightPts.pt1.x, rightPts.pt1.y, rightPts.pt2.x, rightPts.pt2.y, rightPts.ctrlPt2.x, rightPts.ctrlPt2.y);
						}
						if (self.geometry.crown.shape === "double-bezier") {
							bezier(leftPts.pt1.x, leftPts.pt1.y, leftPts.ctrlPt1.x, leftPts.ctrlPt1.y, leftPts.ctrlPt2.x, leftPts.ctrlPt2.y, leftPts.pt2.x, leftPts.pt2.y);
							bezier(rightPts.pt1.x, rightPts.pt1.y, rightPts.ctrlPt1.x, rightPts.ctrlPt1.y, rightPts.ctrlPt2.x, rightPts.ctrlPt2.y, rightPts.pt2.x, rightPts.pt2.y);
						}
						if (self.geometry.crown.shape === "lines") {
							strokeWeight(3);
							let centerPos = drawingPositionGet(self.geometry.heart.center);
							self.geometry.crown.spikes.forEach((pt) => {
								context.moveTo(centerPos.x, centerPos.y);
								let drawPos = drawingPositionGet(pt);
								context.lineTo(drawPos.x, drawPos.y);
							});
						}
						context.closePath();

						context.stroke();
						context.fill();
						if (self.geometry.crown.shape === "lines") {
							context.strokeStyle = "white";
							context.fillStyle = borderColor;
							context.beginPath();
							strokeWeight(1);
							let centerPos = drawingPositionGet(self.geometry.heart.center);
							self.geometry.crown.spikes.forEach((pt) => {
								context.moveTo(centerPos.x, centerPos.y);
								let drawPos = drawingPositionGet(pt);
								context.lineTo(drawPos.x, drawPos.y);
							})
							context.closePath();

							context.stroke();
							context.fill();
						}

						context.restore();

					});
					if (self.geometry.heart.shape === 'circle') {
						context.save();
						context.strokeStyle = self.geometry.heart.color;
						context.fillStyle = self.geometry.heart.color;
						context.beginPath();
						let centralPt = drawingPositionGet({ ...self.geometry.heart.center });
						circle(centralPt.x, centralPt.y, self.geometry.heart.diameter);
						if (debugMode) {text(self.name, centralPt.x + 20, centralPt.y);text(`${self.positionAbsolute.x},${self.positionAbsolute.y}`, centralPt.x, centralPt.y + 20);};
						context.closePath();
						context.stroke();
						context.fill();
						context.restore();
					}
				}
			}
			if (self.animation && self.animation.length > 0 && !debugMode) {
				context.save();
				context.beginPath();
				context.strokeStyle = "#000";
				context.fillStyle = "#000";

				let centralPt = drawingPositionGet(self.positionAbsolute);
				text(self.name, centralPt.x + 50, centralPt.y - 50);
				context.closePath();
				context.stroke();
				context.fill();
				context.restore();
			}
		}
	}
}

	function PolyThing(data) {
		if (!data.matrix) {
			matrix = [{ x: -1, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }];
		}

		this.size = data.size;
		this.distance = data.distance;
		this.angleToOrigine = data.angleToOrigine;
		this.name = data.name;
		this.innerRotation = data.innerRotation;
		this.positionAbsolute = { x: 0, y: 0 };
		this.positionRelative = { x: 0, y: 0 };
		this.half = Math.floor(data.size / 2);
		this.geometry = { data2D: data.matrix };
		this.hit = false;
		this.hitAngles = [];
		this.hitMiddleAngle = 0;
		this.colors = data.colors.split(",");
		this.borderColor = LightenDarkenColor(this.colors[0], -20);
		this.repeat = data.repeat;
		this.collider = {
			shape: "poly",
			data: null
		}

		this.init = function () {
			let self = this;
			if (Array.isArray(self.geometry.data2D[0])) {
				self.repeat = 0;
			} else {
				let copyGeometry = [...self.geometry.data2D];
				self.geometry.data2D.length = 0;
				self.geometry.data2D.push(copyGeometry);
				if (self.repeat > 0) {
					for (let i = 0; i < self.repeat; i++) {
						let arr = [];
						self.geometry.data2D[i].forEach((position, index) => {
							if (index % 5 != 0) {
								arr.push({ x: position.x * .7, y: position.y * 0.7 });
							}
						})
						self.geometry.data2D.push(arr);
					}
				}
			}
			if (!self.colors[0]) self.colors[0] = "#ccc";
			let prevColor = self.colors[0];
			while (self.colors.length < self.geometry.data2D.length) {
				prevColor = LightenDarkenColor(prevColor, 10);
				self.colors.push(prevColor);
			}

			var cos = Math.cos(self.angleToOrigine);
			var sin = -Math.sin(self.angleToOrigine);

			// the real position according to origin point
			self.positionAbsolute.x = Math.floor(cos * self.distance);
			self.positionAbsolute.y = Math.floor(sin * self.distance);

			self.geometry.data2D.forEach((arr, index) => {
				let rotatedPoints = arr.map((pt) => {
					return simpleRotate(pt, self.innerRotation);
				});
				arr = [...rotatedPoints];
			});

			self.geometry.data2D.forEach((arr) => {
				arr.forEach((pt) => {
					pt.x = self.positionAbsolute.x + (self.half * pt.x);
					pt.y = self.positionAbsolute.y + (self.half * pt.y);
				})
			});
			self.collider.data = self.geometry.data2D[0];
		}


		this.draw = function () {
			// the _camera moves : the objects stay stationnary so the positionRelative == positionAbsolute
			var self = this;
			/*
			var isVisible = false;
			if(_camera.knownThings.indexOf(self.name) != -1){
				isVisible = true;
			}else{
				if(self.hit){
					_camera.knownThings.push(self.name);
					isVisible = true;
				}
			}
			*/
			isVisible = true;

			if (!isVisible) return;
			self.geometry.data2D.forEach((arr, index) => {
				context.save();
				context.globalAlpha = 1;
				context.fillStyle = self.colors[index];
				context.strokeStyle = index === 0 ? self.borderColor : self.colors[index];
				context.beginPath();
				let drawPos = drawingPositionGet(arr[0]);
				context.moveTo(drawPos.x, drawPos.y);
				arr.forEach((pt) => {
					drawPos = drawingPositionGet(pt);
					context.lineTo(drawPos.x, drawPos.y);
				})
				context.closePath();
				context.stroke();
				context.fill();
				context.globalAlpha = 1 - (index / 5);
				context.restore();
				if (debugMode) {text(self.name, drawPos.x + 20, drawPos.y);text(`${self.positionAbsolute.x},${self.positionAbsolute.y}`, drawPos.x, drawPos.y + 20);};

			});

		}
	}

	function simpleRotate(point, angle) {
		var cos = Math.cos(angle);
		var sin = -Math.sin(angle);
		rotatedX = point.x * cos - point.y * sin;
		rotatedY = point.y * cos + point.x * sin;
		return { "x": rotatedX, "y": rotatedY };
	}

	function simpleTranslate(point, angle, amount) {
		var cos = Math.cos(angle);
		var sin = Math.sin(angle);
		point.x += Math.floor(cos * amount);
		point.y += Math.floor(sin * amount);
		return point;
	}

	function calcAngleDegrees(x, y) { // origine : MDN docs
		return Math.atan2(y, x) * 180 / Math.PI;
	}

	function calcAngleRadians(x, y) { // origine : calcAngleDegrees
		return Math.atan2(y, x);
	}

	function keepWithInCircle(rotation) {
		if (rotation < 0) rotation += k360degres;
		if (rotation > k360degres) rotation -= k360degres;
		return rotation;
	}

	function getDistance(ptA, ptB) {
		if(!(ptA && ptA.x && ptA.y && ptB && ptB.x && ptB.y )) return -1;
		return Math.sqrt(Math.pow(ptB.x - ptA.x, 2) + Math.pow(ptB.y - ptA.y, 2));
	  }
	
	//Chris Coyier 
	function LightenDarkenColor(col, amt) {

		var usePound = false;

		if (col[0] == "#") {
			col = col.slice(1);
			usePound = true;
		}

		var num = parseInt(col, 16);

		var r = (num >> 16) + amt;

		if (r > 255) r = 255;
		else if (r < 0) r = 0;

		var b = ((num >> 8) & 0x00FF) + amt;

		if (b > 255) b = 255;
		else if (b < 0) b = 0;

		var g = (num & 0x0000FF) + amt;

		if (g > 255) g = 255;
		else if (g < 0) g = 0;

		return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
	}

	function setKeyDown() {
		document.addEventListener("keydown", function (event) {
			switch (event.code) {
				case "KeyQ":
					keys.left = true;
					break;
				case "ArrowLeft":
					keys.left = true;
					break;
				case "KeyA":
					keys.left = true;
					break;

				case "KeyE":
					keys.right = true;
					break;
				case "ArrowRight":
					keys.right = true;
					break;
				case "KeyD":
					keys.right = true;
					break;

				case "KeyW": // up
					keys.up = true;
					break;
				case "ArrowUp": // up
					keys.up = true;
					break;

				case "KeyS": // down
					keys.down = true;
					break;
				case "ArrowDown": // down
					keys.down = true;
					break;
				case "ShiftLeft":
					keys.shift = true;
					break;

			};
		});
	}

	function setKeyUp() {
		document.addEventListener("keyup", function (event) {
			switch (event.code) {
				case "KeyQ":
					keys.left = false;
					break;
				case "ArrowLeft":
					keys.left = false;
					break;
				case "KeyA":
					keys.left = false;
					break;

				case "KeyE":
					keys.right = false;
					break;
				case "ArrowRight":
					keys.right = false;
					break;
				case "KeyD":
					keys.right = false;
					break;

				case "KeyW": // up
					keys.up = false;
					break;
				case "ArrowUp": // up
					keys.up = false;
					break;

				case "KeyS": // down
					keys.down = false;
					break;
				case "ArrowDown": // down
					keys.down = false;
					break;
				case "ShiftLeft":
					keys.shift = false;
					break;
			};
		});
	}

	function shuffleColor(hexaColor, amount) {
		if (hexaColor.substring(0, 1) != "#") {
			return hexaColor;
		}
		let r = parseInt(hexaColor.substring(1, 3), 16);
		let g = parseInt(hexaColor.substring(3, 5), 16);
		let b = parseInt(hexaColor.substring(5, 7), 16);

		let whatColor = Math.random();
		let upOrDown = Math.random() <= 0.5 ? 1 : -1;
		if (whatColor <= 0.5) {
			r += (amount * upOrDown);
			if (r > 255) r = 255;
			if (r < 0) r = 0;
		} else if (whatColor <= 0.8) {
			b += (amount * upOrDown);
			if (b > 255) b = 255;
			if (b < 0) b = 0;
		} else {
			g += (amount * upOrDown);
			if (g > 255) g = 255;
			if (g < 0) g = 0;
		}
		let rHex = r < 16 ? '0' + r.toString(16) : r.toString(16);
		let gHex = g < 16 ? '0' + g.toString(16) : g.toString(16);
		let bHex = b < 16 ? '0' + b.toString(16) : b.toString(16);
		return '#' + rHex + gHex + bHex;
	}

	function drawInformations() {
		context.save();
		context.beginPath();
		context.fillStyle = '#000000';
		context.strokeStyle = '#000000';
		let lineTop = 20;
		let hOffset = 30;
		text(`Day : ${worldModel.gardenDay}`, -w2 + hOffset, -h2 + lineTop);
		lineTop += 20;
		text('Status : ' + (onLine ? "online" : "offline"), -w2 + hOffset, -h2 + lineTop);
		lineTop += 20;
		text('Player : ' + playerName, -w2 + hOffset, -h2 + lineTop);
		if (_camera) {
			lineTop += 20;
			text('Position : (' + _camera.position.x + ',' + _camera.position.y + ')', -w2 + hOffset, -h2 + lineTop);
			lineTop += 20;
			text(`framerate : ${framerate}`, -w2 + hOffset, -h2 + lineTop);
			lineTop += 20;
			text(`plants nr : ${worldModel.data.plants.length}`, -w2 + hOffset, -h2 + lineTop);
			lineTop += 20;
			if (debugMode) {
				text(`Center                   : ${worldModel.currentCenter.x},${worldModel.currentCenter.y}`, -w2 + 30, -h2 + lineTop);
				lineTop += 20;
				text(`LadyBug position :${_camera.position.x},${_camera.position.y}`, -w2 + 30, -h2 + lineTop);
				lineTop += 20;
				text(`LadyBug distance : ${_camera.distance}`, -w2 + 30, -h2 + lineTop);
				lineTop += 20;
				text(`world radius          : ${worldModel.radius}`, -w2 + 30, -h2 + lineTop);
				lineTop += 20;
			}
		}
		context.closePath();
		context.fill();
		context.stroke();
		context.restore();
	}

	function addUpdatePlayer(msg) {
		if (msg.name === playerName) return;
		let found = false;
		msg.isMoving = false;
		msg.bodyRadius = 20;
		msg.bodyInMotionDiameter1 = 18;
		msg.bodyInMotionDiameter2 = 22;
		msg.opacity = 1;
		_otherPlayers.forEach((u) => {
			if (u.name === msg.name) {
				found = true;
				for (const key in msg) {
					u[key] = msg[key];
				}
			}
		});
		if (!found) {
			otherPlayersIndex++;
			_otherPlayers.push(msg);
		}
	}

	function plantsUpdate() {
		return new Promise(function (resolve, reject) {
			var xhr = new XMLHttpRequest();
			xhr.open("GET", "plants", true);
			xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
			xhr.onload = function () {
				if (this.status >= 200 && this.status < 300) {
					try {
						let data = JSON.parse(xhr.response);
						resolve(data);
					} catch (e) {
						reject({ "error": "invalid json" });
					}
				} else {
					reject({ "error": xhr.statusText });
				}
			};
			xhr.onerror = function () {
				reject({ "error": xhr.statusText });
			};
			xhr.send();
		});
	}

	function getPosition(distance, angleToOrigine) {
		let cos = Math.cos(angleToOrigine);
		let sin = -Math.sin(angleToOrigine);
		return {
		  x: Math.floor(cos * distance),
		  y: Math.floor(sin * distance)
		}
	  }