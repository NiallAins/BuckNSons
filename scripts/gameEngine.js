/*****************\
  EVENT LISTENERS
\*****************/

//Stores state of keyboard
var kb = {
	space : false,
	left : false,
	right : false,
	up : false,
	down : false,
	w : false,
	a : false,
	s : false,
	d : false,
	z : false,
	shift : false,
	press : null
} 

window.onkeydown = function(e) {
	var key = e.keyCode ? e.keyCode : e.which;

   	if (key === 39) {
   		if (!kb.right) {
   			kb.press = "right";
   		}
    	kb.right = true;
   	} else if (key === 37) {
   		if (!kb.left) {
   			kb.press = "left";
   		}
       kb.left = true;
   	} else if (key === 38) {
   		if (!kb.up) {
   			kb.press = "up";
   		}
       kb.up = true;
   	} else if (key === 40) {
   		if (!kb.down) {
   			kb.press = "down";
   		}
       kb.down = true;
   	} else if (key === 32) {
   		if (!kb.space) {
   			kb.press = "space";
   		}
       kb.space = true;
   	} else if (key === 87) {
   		if (!kb.w) {
   			kb.press = "w";
   		}
       kb.w = true;
   	} else if (key === 65) {
   		if (!kb.a) {
   			kb.press = "a";
   		}
       kb.a = true;
   	} else if (key === 83) {
   		if (!kb.s) {
   			kb.press = "s";
   		}
       kb.s = true;
   	} else if (key === 68) {
   		if (!kb.d) {
   			kb.press = "d";
   		}
       kb.d = true;
   	} else if (key === 90) {
   		if (!kb.z) {
   			kb.press = "z";
   		}
       kb.z = true;
   	} else if (key === 16) {
   		if (!kb.shift) {
   			kb.press = "shift";
   			can.webkitRequestFullscreen();
   		}
       kb.shift = true;
   	}
}

window.onkeyup = function(e) {
   	var key = e.keyCode ? e.keyCode : e.which;

   	if (key === 39) {
       kb.right = false;
       kb.release = "right";
   	} else if (key === 37) {
       kb.left = false;
       kb.release = "left";
   	} else if (key === 38) {
       kb.up = false;
       kb.release = "up";
   	} else if (key === 40) {
       kb.down = false;
       kb.release = "down";
   	} else if (key === 32) {
       kb.space = false;
       kb.release = "space";
   	} else if (key === 87) {
       kb.w = false;
       kb.release = "w";
   	} else if (key === 65) {
       kb.a = false;
       kb.release = "a";
   	} else if (key === 83) {
       kb.s = false;
       kb.release = "s";
   	} else if (key === 68) {
       kb.d = false;
       kb.release = "d";
   	} else if (key === 90) {
       kb.z = false;
       kb.release = "z";
   	} else if (key === 16) {
       kb.shift = false;
       kb.release = "shift";
   	}
}


/********************\
  GAMEPLAY FUNCTIONS
\********************/

//Controls object sprite animation (sprite image source, width of single frame, duration of animation [in milliseconds])
function Sprite(sprite, frWidth, duration, reverse) {
	this.backward = false;
	if (reverse) {
		this.reverse();
	}
	this.frNum = 0;
	this.frDur = (duration) ? duration : 0;
	this.height = sprite.height;
	this.length = 0;
	this.spr = sprite;
	this.width = (frWidth) ? frWidth : sprite.width;
	this.length = sprite.width / this.width;
	this.frDur /= this.length;
	this.pause = false;
}
	Sprite.prototype.draw = function(xIn, yIn) {
		xIn += Level.x;
		yIn += Level.y;
		ctx.drawImage(this.spr, Math.floor(this.frNum) * this.width, 0, this.width, this.spr.height, xIn, yIn, this.width, this.spr.height);
		if (!this.pause && this.frDur !== 0) {
			if (!this.backward) {
				this.frNum += dt / this.frDur;
				if (this.frNum >= this.length) {
					this.frNum = 0;
				}
			} else {
				this.frNum -= dt / this.frDur;
				if (this.frNum <= -1) {
					this.frNum = this.length - 1;
				}
			}
		}
	}
	Sprite.prototype.togglePause = function() {
		this.pause = !this.pause;
	}
	Sprite.prototype.reverse = function() {
		this.backward = !this.backward;
	}

var setSprite = function(sprIn) {
	this.spr = sprIn;
}

//Get Collision point between any two lines
function getCollPoint(x00, y00, x01, y01, x10, y10, x11, y11) {
    var sx1 = x01 - x00,
        sy1 = y01 - y00,
    	sx2 = x11 - x10,
    	sy2 = y11 - y10;

    var s = (-sy1 * (x00 - x10) + sx1 * (y00 - y10)) / (-sx2 * sy1 + sx1 * sy2);
    var t = ( sx2 * (y00 - y10) - sy2 * (x00 - x10)) / (-sx2 * sy1 + sx1 * sy2);

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
        // Collision detected
        var ix = x00 + (t * sx1);
        var iy = y00 + (t * sy1);

        return {x : ix, y : iy};
    } else {
    	//No Collision detected
    	return {x : -1};
    }
}

//Translate Level View (x translation, y translation, absolute position or relatve movement)
function moveLvl(dx, dy, abs) {
	Level.x += dx;
	Level.y += dy;
	can.style.backgroundPosition = Level.x + 'px ' + Level.y + 'px';
}

/**********************************\
  ENGINE FUNCTIONS & INITALISATION
\**********************************/

//Canvas Initalization
var can = document.getElementById('mainCanvas');
var ctx = can.getContext('2d');

//Stores all game objects
var gameObjs = [];

//Stores all game assest; first as roots, then as loaded objects 
var Assets = {
	sprites : {
		shawnStandL : "sprites/shawnStandL.png",
		shawnStandR : "sprites/shawnStandR.png",
		shawnRunL : "sprites/shawnRunL.png",
		shawnRunR : "sprites/shawnRunR.png",
		shawnFallR : "sprites/shawnFallR.png",
		shawnFallL : "sprites/shawnFallL.png",
		shawnJumpR : "sprites/shawnJumpR.png",
		shawnJumpL : "sprites/shawnJumpL.png",
		buckMeditate : "sprites/buckMeditate.png",
		buckSwim : "sprites/buckSwim.png",
		buckFly : "sprites/buckFly.png",
		bigGemGreen: "sprites/bigGemGreen.png",
		bigGemRed: "sprites/bigGemRed.png",
		bigGemBlue: "sprites/bigGemBlue.png",
		gemGreen: "sprites/gemGreen.png",
		gemRed: "sprites/gemRed.png",
		gemBlue: "sprites/gemBlue.png",
		morph: "sprites/morph.png",
		whaleR : "sprites/whaleR.png",
		whaleL : "sprites/whaleL.png",
		badGem : "sprites/badGem.png"
	},
	bgs : {
		levelOneBg : "backgrounds/lvlOneBg.png",
		levelOne : "backgrounds/lvlOne.png",
		title1 : "backgrounds/title1.png",
		title2 : "backgrounds/title2.png"
	},
	sounds : {
		soundtrack : "sounds/pancake.mp3",
		gemRed : "sounds/coin3.ogg",
		gemBlue : "sounds/coin2.ogg",
		gemGreen : "sounds/coin1.ogg",
		gemHit : "sounds/coinBad.ogg",
		transform : "sounds/splat.wav"
	}
};

//Ensures all game assets are loaded before starting game
var loadAssets = function() {
	var loading = 0;

	//Start game after all assets are loaded
	var finishLoading = function() {
		loading -=1;
		if (loading === 0) {
			Level.load.onlyLevel();
			mainLoop();
		}
	}

	//Load sprites; converting root address to actual object in Assets
	for (var element in Assets.sprites) {
		loading += 1;
		var spr = new Image();
		spr.src = Assets.sprites[element];
		Assets.sprites[element] = spr;

		spr.onload = finishLoading;
	}

	//Load tiles; converting root address to actual object in Assets
	for (var element in Assets.bgs) {
		loading += 1;
		var bg = new Image();
		bg.src = Assets.bgs[element];
		Assets.bgs[element] = bg;

		bg.onload = finishLoading;
	}

	//Load sounds; converting root address to actual object in Assets
	for (var element in Assets.sounds) {
		loading += 1;
		var sound = new Audio();
		sound.src = Assets.sounds[element];
		Assets.sounds[element] = sound;

		//sound.load();
		sound.oncanplaythrough = finishLoading;
	}
}

//Frame timing variables
var time = 0, oldTime = new Date().getTime(), dt = 1;

//For debuging
var debugMode = false, stopLoop = false;


//Animation and Gameplay loop
function mainLoop() {

	//Frame Timing (dt clamped at ~30 FPS)
	time = new Date().getTime();
	dt = (time - oldTime);
	while (dt < 25) {
		time = new Date().getTime();
		dt = (time - oldTime);
	}
	oldTime = time;

	//Refresh and draw frame
	ctx.clearRect(0, 0, can.width, can.height);
	if (!stopLoop || kb.press === "down") {
		for (obj in gameObjs) {
			if (Array.isArray(gameObjs[obj])) {
				for (var i = 0; i < gameObjs[obj].length; i += 1) {
					gameObjs[obj][i].step();
				}
			} else {
				gameObjs[obj].step();
			}
		}
	}
	for (var i = 0; i < Level.bgs.length; i += 1) {
		if (Level.bgs[i].z < 0) {
			ctx.drawImage(Level.bgs[i].src, (Level.x + Level.bgs[i].x) * Level.bgs[i].plX, (Level.y + Level.bgs[i].y) * Level.bgs[i].plY);
		}
	}
	for (obj in gameObjs) {
		if (Array.isArray(gameObjs[obj])) {
			for (var i = 0; i < gameObjs[obj].length; i += 1) {
				gameObjs[obj][i].draw();
			}
		} else {
			gameObjs[obj].draw();
		}
	}
	for (var i = 0; i < Level.bgs.length; i += 1) {
		if (Level.bgs[i].z > 0) {
			ctx.drawImage(Level.bgs[i].src, (Level.x + Level.bgs[i].x) * Level.bgs[i].plX, (Level.y + Level.bgs[i].y) * Level.bgs[i].plY);
		}
	}

	//DEBUG
	/*ctx.strokeStyle = "blue";
	ctx.lineWidth = 10;
	ctx.lineCap = "round";
	ctx.beginPath();
	for (var i = 0; i < Level.boundarys.length; i += 1) {
		ctx.moveTo(Level.boundarys[i].x0, Level.boundarys[i].y0 + 5);
		ctx.lineTo(Level.boundarys[i].x1, Level.boundarys[i].y1 + 5);
	}
	ctx.stroke();*/

	//Reset Keyboard listener
	kb.press = null;
	kb.release = null;

	//Get next frame
	window.requestAnimationFrame(mainLoop);
}

//Load game assets before starting main game loop
window.onload = loadAssets();