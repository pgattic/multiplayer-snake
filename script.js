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
	advanceRate = 8; // milliseconds that pass between each frame

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
	body = [
		[[...startLocation[0]]],
		[[...startLocation[1]]],
		[[...startLocation[2]]],
		[[...startLocation[3]]],
	],
	keyQueue = [[],[],[],[]],
	direction = [...startDirection],
	score = [startScore, startScore, startScore, startScore];

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
			killPlayer(num);
		}
		active[num] = !active[num];
	}
}

function killPlayer(i) {
	body[i] = [[...startLocation[i]]];
	direction[i] = startDirection[i];
	score[i] = startScore;
}

function directPlayers() {
	for (var i = 0; i < nOfPlayers; i++) {
		if (active[i]) {
			if (keyQueue[i].length > 0) {direction[i] = keyQueue[i][0]; keyQueue[i].shift(); }
			var potential = shiftPlayer([...body[i][0]], direction[i]);
			if (potential[0] < 0 || potential[0] > dimension[0]-1 || potential[1] < 0 || potential[1] > dimension[1]-1) {
				killPlayer(i);
			} else {
				body[i].unshift(potential);
				if (body[i].length > score[i]) { body[i].pop(); }
			}
		}
	}
}

function eatFood() {
	for (var i = 0; i < nOfPlayers; i++) {
		if (body[i][0][0] == food[0] && body[i][0][1] == food[1]) {
			score[0] += foodValue;
			food[0] = Math.floor(Math.random() * dimension[0]);
			food[1] = Math.floor(Math.random() * dimension[1]);
		}
	}
}

function die() {
	for (var i = 0; i < nOfPlayers; i++) { // player dying
		for (var e = 0; e < nOfPlayers; e++) { // player being run into
			for (var t = (i==e?1:0); t < body[e].length; t++) {
				if (body[i][0][0] == body[e][t][0] && body[i][0][1] == body[e][t][1]) {
					killPlayer(i);
				}
			}
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

function drawPlayers() {
	ctx.lineCap = "round";
	ctx.lineWidth = unit - 2;
	for (var i = 0; i < nOfPlayers; i++) {
		ctx.strokeStyle = colors[i];
		if (active[i]) {
			ctx.beginPath();
			ctx.moveTo(body[i][0][0]*unit+unit/2, body[i][0][1]*unit+unit/2);
			for (var s = 0; s < body[i].length; s++) {
				ctx.lineTo(body[i][s][0]*unit+unit/2, body[i][s][1]*unit+unit/2);
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo(body[i][s][0]*unit+unit/2, body[i][s][1]*unit+unit/2);
			}
			ctx.stroke();
		}
	}
}

function draw() {
	resizeCanvas();
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	grid();
	drawFood();
	drawPlayers();
}

function main() {
	frameCounter++;
	if (frameCounter >= advanceRate && !paused) {
		calculate();
		frameCounter = 0;
	}
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

init();
