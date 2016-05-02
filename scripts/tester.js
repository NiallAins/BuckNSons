var can = document.getElementById('mainCanvas');
var ctx = can.getContext('2d');
var canD = (Math.sqrt(can.width * can.width * 2) - can.width) / 2;

function Side(xIn, bgIn, stateIn) {
	this.wrlX = xIn;
	this.x = xIn;
	this.y = 0;
	this.rotState= stateIn;
	this.bg = bgIn;
	this.width = (this.state === 'opened') ? can.width : 0;
	this.height = can.height;
	this.out = true;

Side.prototype.draw = function() {
	if (this.rotState != 'close') {
		ctx.drawImage(this.bg, this.x, this.y, this.width, this.height);
		if (this.rotState != 'open') {
			ctx.fillStyle = 'rgba(0, 0, 0, ' + (1 - this.width / can.width) + ')';
			ctx.fillRect(this.x, this.y, this.width, this.height);
		}
	};
};

Side.prototype.step = function() {
	if (this.rotState === 'trans') {
		this.rotateLevel(can.width / 2, true);
	}
};

Side.prototype.rotateLevel = function(axis, clockwise) {
	
}

window.onkeyup = function(e) {
	var key = e.keyCode ? e.keyCode : e.which;

	if (key === 39) {
   		if (sides[0].state === 'opened') {
	   		sides[0].state = 'closing';
	   		sides[1].state = 'opening';
	   	 } else if (sides[0].state === 'closed') {
	   	 	sides[0].state = 'opening';
	   	 	sides[1].state = 'closing';
	   	};
   	}
}


function mainLoop() {
	ctx.clearRect(0, 0, can.width, can.height);
	for (var i = 0; i < sides.length; i += 1) {
		sides[i].step();
	}
	for (var i = 0; i < sides.length; i += 1) {
		sides[i].draw();
	}

	window.requestAnimationFrame(mainLoop);
}

var load = false;
var sides = [];

var bg1 = new Image();
bg1.src = "testWall1.png";
bg1.onload = function() {
	sides.push(new Side(0, bg1, 'opened'));
	if (load) {
		mainLoop();
	} else {
		load = true;
	}
}

var bg2 = new Image();
bg2.src = "testWall2.png";
bg2.onload = function() {
	sides.push(new Side(can.width, bg2, 'closed'));
	if (load) {
		mainLoop();
	} else {
		load = true;
	}

}