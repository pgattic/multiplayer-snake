"use strict";

const
	$=x=>{return document.querySelector(x)},
	canvas = $("#canvas"),
	ctx = canvas.getContext("2d"),
	
	colors = ["blue", "red", "green", "orange"],
	controls = [
		["w", "a", "s", "d"],
		["t", "f", "g", "h"],
		["i", "j", "k", "l"],
		["arrowup","arrowleft","arrowdown","arrowright"]
	],
	shiftPlayer = (p, d) => {	// send coords of head [x, y] and direction and this gives the next location
		//var temp = [...p];
		switch (d) {
			case 0:		// up
				p[1]--;
				break;
			case 1:		// left
				p[0]--;
				break;
			case 2:		// down
				p[1]++;
				break;
			case 3:		// right
				p[0]++;
				break;
		}
		return p;
	},
	startScore = 5,
	foodValue = 5,
	advanceRate = 4; // milliseconds that pass between each frame

var
	unit = 24,
	dimension = [0,0],
	food = [],
	paused = false,
	nOfPlayers = 4,
	frameCounter = 0,

	startLocation = [
		[0,0],
		[dimension[0]-1, 0],
		[0, dimension[1]-1],
		[dimension[0]-1, dimension[1]-1],
	],
	startDirection = [3, 1, 3, 1],
	active = [false, false, false, false],
	deathRow = [false, false, false, false],
	body = [
		[[...startLocation[0]]],
		[[...startLocation[1]]],
		[[...startLocation[2]]],
		[[...startLocation[3]]],
	],
	deadPlayers = [],
	keyQueue = [[],[],[],[]],
	direction = [...startDirection],
	score = [startScore, startScore, startScore, startScore],
	highscore = [...score];

document.onkeydown = (e) => {
	var key = e.key.toLowerCase();
	for (var p = 0; p < controls.length; p++) {
		if (active[p]) {
			for (var c = 0; c < controls[p].length; c++) {
				if (key == controls[p][c] && c%2 != (keyQueue[p].length?keyQueue[p][keyQueue[p].length-1]:direction[p])%2) {
					keyQueue[p].push(c);
				}
			}
		}
	}
	if (key == "escape") {
		paused = !paused;
	}
	var num = Number(key)-1;
	if (num < 4 && num >= 0) { // spawn players
		if (active[num]) {
			deathRow[num] = true;
		}
		active[num] = !active[num];
	}
}

function directPlayers() {
	for (var i = 0; i < nOfPlayers; i++) {
		if (active[i]) {
			if (keyQueue[i].length > 0) {direction[i] = keyQueue[i][0]; keyQueue[i].shift(); }
			var potential = shiftPlayer([...body[i][0]], direction[i]);
			if (potential[0] < 0 || potential[0] > dimension[0]-1 || potential[1] < 0 || potential[1] > dimension[1]-1) {
				deathRow[i] = true;
			} else {
				body[i].unshift(potential);
				if (body[i].length > score[i]) { body[i].pop(); }
			}
		}
	}
}

function generateFood() {
	var foodCheck = true;
	var foodX, foodY;
	var loopCounter = 0;
	do {
		foodCheck = true;
		foodX = Math.floor(Math.random() * dimension[0]);
		foodY = Math.floor(Math.random() * dimension[1]);
		loopCounter++;
		for (var i = 0; i < nOfPlayers; i++) {
			for (var e = 0; e < body[i].length; e++) {
				if (body[i][e][0] == foodX && body[i][e][1] == foodY) {
					foodCheck = false;
				}
			}
		}
	} while (!foodCheck);
	food = [foodX, foodY];
}


function eatFood() {
	for (var i = 0; i < nOfPlayers; i++) {
		if (body[i][0][0] == food[0] && body[i][0][1] == food[1]) {
			score[i] += foodValue;
			if (score[i] > highscore[i]) {highscore[i] = score[i];}
			generateFood();
		}
	}
}

function die() {
	for (var i = 0; i < nOfPlayers; i++) { // player dying
		if (active[i]) {
			for (var e = 0; e < nOfPlayers; e++) { // player being run into
				if (active[e]) {
					for (var t = (i==e?1:0); t < body[e].length; t++) {
						if (body[i][0][0] == body[e][t][0] && body[i][0][1] == body[e][t][1]) {
							deathRow[i] = true;
						}
					}
				}
			}
		}
	}
}

function killPlayers() {
	for (var i = 0; i < nOfPlayers; i++) {
		if (deathRow[i]) {
			deadPlayers.unshift([[...body[i]], colors[i]]);
			body[i] = [[...startLocation[i]]];
			direction[i] = startDirection[i];
			score[i] = startScore;
			deathRow[i] = false;
		}
	}
}

function calculate() {
	directPlayers();
	eatFood();
	die();
}

function resizeCanvas() {
	dimension[0] = Math.floor(innerWidth / unit);
	dimension[1] = Math.floor(innerHeight / unit);	
	canvas.width  = dimension[0] * unit;
	canvas.height = dimension[1] * unit;
	startLocation = [
		[0,0],
		[dimension[0]-1, 0],
		[0, dimension[1]-1],
		[dimension[0]-1, dimension[1]-1],
	];
	if (food[0] > dimension[0] - 1 || food[1] > dimension[1] - 1) {
		generateFood();
	}
}

function grid() {
	ctx.strokeStyle = "gray";
	for (var i = 0; i < dimension[0]+1; i++) {
		ctx.beginPath();
		ctx.moveTo(i * unit, 0);
		ctx.lineTo(i * unit, canvas.height);
		ctx.stroke();
	}
	for (var i = 0; i < dimension[1]+1; i++) {
		ctx.beginPath();
		ctx.moveTo(0, i * unit);
		ctx.lineTo(canvas.width, i * unit);
		ctx.stroke();
	}
}

function drawFood() {
	ctx.beginPath();
	ctx.arc(food[0]*unit + unit/2, food[1]*unit + unit/2, unit/2, 0, Math.PI*2);
	ctx.fillStyle = "purple";
	ctx.fill();
}

function drawBody(b) {
	ctx.beginPath();
	ctx.moveTo(b[0][0]*unit+unit/2, b[0][1]*unit+unit/2);
	for (var s = 1; s < b.length; s++) {
		if (s == b.length - 1 || !(b[s-1][0] == b[s+1][0] || b[s-1][1] == b[s+1][1])) {
			ctx.lineTo(b[s][0]*unit+unit/2, b[s][1]*unit+unit/2);
		}
	}
	ctx.stroke();
}

function drawPlayers() {
	ctx.lineCap = "square";
	ctx.lineWidth = unit - 2;
	ctx.globalAlpha = 0.3;
	for (var i = 0; i < deadPlayers.length; i++) {
		ctx.strokeStyle = deadPlayers[i][1];
		drawBody(deadPlayers[i][0]);
	}
	for (var i = 0; i < deadPlayers.length; i++) {
		deadPlayers[i][0].pop();
		if (deadPlayers[i][0].length < 1) {
			deadPlayers.splice(i, 1);
		}
	}
	ctx.globalAlpha = 1;
	for (var i = 0; i < nOfPlayers; i++) {
		if (active[i]) {
			ctx.strokeStyle = colors[i];
			drawBody(body[i]);
		}
	}
}

function spawnPoints() {
	for (var i = 0; i < nOfPlayers; i++) {
		var x = (startLocation[i][0] + 0.5) * unit;
		var y = (startLocation[i][1] + 0.5) * unit;
		var gradient = ctx.createRadialGradient(x, y, 0, x, y, 128);
		gradient.addColorStop(0, colors[i]);
		gradient.addColorStop(1, "rgba(0,0,0,0)");
		ctx.beginPath();
		ctx.globalAlpha = 0.4;
		ctx.fillStyle = gradient;
		ctx.arc(x, y, 128, 0, Math.PI*2);
		ctx.fill();
		ctx.globalAlpha = 1;
	}
}

function scoreBoards() {
	var TBLoc = [
		[8, 20, "left"],
		[canvas.width - 8, 20, "right"],
		[8, canvas.height - 24, "left"],
		[canvas.width - 8, canvas.height - 24, "right"],
	]
	ctx.font = "bold 16px Arial"
	ctx.fillStyle = bgColor[Math.abs(darkMode-1)];
	ctx.beginPath();
	for (var i = 0; i < nOfPlayers; i++) {
		ctx.textAlign =  TBLoc[i][2];
		if (active[i]) {
			ctx.fillText(`Score: ${score[i]}`, TBLoc[i][0], TBLoc[i][1]);
			ctx.fillText(`Highscore: ${highscore[i]}`, TBLoc[i][0], TBLoc[i][1] + 16);
		} else {
			ctx.fillText((`Join with the "${i+1}" key!`), TBLoc[i][0], TBLoc[i][1]);
			var controlKeys = (controls[i][0]+controls[i][1]+controls[i][2]+controls[i][3]).toUpperCase();
			if (controlKeys.length > 4) {controlKeys = "the arrow keys"}
			ctx.fillText(`Control with ${controlKeys}!`, TBLoc[i][0], TBLoc[i][1] + 16);
		}
	}
}

function draw() {
	resizeCanvas();
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	grid();
	drawFood();
	drawPlayers();
	spawnPoints();
	scoreBoards();
}

function main() {
	frameCounter++;
	if (frameCounter >= advanceRate && !paused) {
		calculate();
		frameCounter = 0;
	}
	killPlayers();
	draw();
	requestAnimationFrame(main);
}

function init() {
	resizeCanvas();
	food[0] = Math.floor(Math.random() * dimension[0]);
	food[1] = Math.floor(Math.random() * dimension[1]);
	body = [
		[[...startLocation[0]]],
		[[...startLocation[1]]],
		[[...startLocation[2]]],
		[[...startLocation[3]]],
	];
	requestAnimationFrame(main);
}


				/* Dark Mode Code */
 
const
	rootColors = $(":root").style,
	cScheme = ["light", "dark"],
	bgColor = ["#fff","#111"];

var darkMode = Number(localStorage.getItem("darkMode")) || 0; // 0 for light mode, 1 for dark mode

function refreshColors() {
	var i = Number(darkMode);
	$(":root").style="color-scheme: " + cScheme[i];
	rootColors.setProperty("--bg-color", bgColor[i]);
}

refreshColors();

init();
