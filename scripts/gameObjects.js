/************************\
  CONTROLLABLE CHARACTER
\************************/

function Shawn(xIn, yIn) {
	this.x = xIn;
	this.y = yIn;
	this.setSprite = setSprite;
	this.sprites = {
		standL : new Sprite(Assets.sprites.shawnStandL, 120, 1, false),
		standR : new Sprite(Assets.sprites.shawnStandR, 120, 1, false),
		runL : new Sprite(Assets.sprites.shawnRunL, 120, 400, false),
		runR : new Sprite(Assets.sprites.shawnRunR, 120, 400, false),
		fallR : new Sprite(Assets.sprites.shawnFallR, 120, 1, false),
		fallL : new Sprite(Assets.sprites.shawnFallL, 120, 1, false),
		jumpR : new Sprite(Assets.sprites.shawnJumpR, 120, 1, false),
		jumpL : new Sprite(Assets.sprites.shawnJumpL, 120, 1, false)
	}
	this.setSprite(this.sprites.standR);

	// Bounding box co-ordinates
	this.edge = {
		left : 14,
		right: 108,
		bottom : 172,
		mid : 60
	};

	//Movement parameters
	this.hspeed = 0; 
	this.vspeed = 0;
	this.runSp = 25;
	this.runAc = 15;
	this.jumpAc = 2;
	this.fric = 100;
	this.jumpHeight = 35;
	this.slopeSnap = 14;
	this.grav = 2.5;

	//States
	this.rightFacing = true;
	this.onGround = true;
	this.climb = false;
	this.paused = false;
}
	Shawn.prototype.draw = function() {
		this.spr.draw(this.x, this.y);
	}
	Shawn.prototype.step = function() {
		if (!this.paused) {

		//Check if on ground
		this.onGround = false;
		for (var i = 0; i < Level.boundarys.length; i += 1) {
			var bo = Level.boundarys[i];
			var groundSlope = Math.abs((bo.y0 - bo.y1) / (bo.x1 - bo.x0));
			if (groundSlope <= 2) {
				var adj = groundSlope * (this.edge.right - this.edge.left);
				var xOff = this.edge.mid;
				if (getCollPoint( 	this.x + xOff, this.y + this.edge.bottom, this.x + xOff, this.y + this.edge.bottom + 1 + adj,
								 	bo.x0, 					bo.y0, 					   bo.x1, 		  bo.y1).x !== -1) {
					this.onGround = true;
				}
			}
		}

		//Check if climbing
		if (this.climb || kb.press === 'up' || kb.press === 'down') {
			this.climb = false;
			for (var i = 0; i < Level.ladders.length; i += 1) {
				if (this.x + this.edge.right > Level.ladders[i].left && this.x + this.edge.left < Level.ladders[i].right &&
					this.y < Level.ladders[i].bottom && this.y + this.edge.bottom > Level.ladders[i].top) {
					this.climb = true;
					break;
				}
			}
		}

		//Face correct direction
		if (kb.press === "right") {
			this.rightFacing = true;
		} else if (kb.press === "left") {
			this.rightFacing = false;
		}

		//Move horizontally
		if (kb.left) {
			if (this.climb) {
				this.hspeed = -this.climbSp;
			} else if (this.onGround) {
				this.hspeed = -this.runSp;
			} else {
				(this.hspeed > -this.runSp) ? this.hspeed -= this.jumpAc : this.hspeed = -this.runSp;
			}
		} else if (kb.right) {
			if (this.climb) {
				this.hspeed = this.climbSp;
			} else if (this.onGround) {
				this.hspeed = this.runSp;
			} else {
				(this.hspeed < this.runSp) ? this.hspeed += this.jumpAc : this.hspeed = this.runSp;
			}
		} else if (this.climb) {
			this.hspeed = 0;
		} else if (this.onGround) {
			if (this.hspeed > 0) {
				this.hspeed = 0;
			} else if (this.hspeed < 0) {
				this.hspeed = 0;
			}
		}

		//Gravity
		if (!this.onGround && !this.climb) {
			this.vspeed += this.grav;
		}

		//Collision detection
		for (var i = 0; i < Level.boundarys.length; i += 1) {
			var bo = Level.boundarys[i];

			//Flat Ground
			if (bo.slope === 0) {
				if ((bo.type !== 'platform' || (!this.climb && (this.y + this.edge.bottom) <= bo.y0)) &&
				    (this.y + this.edge.bottom + this.vspeed >= bo.y0 && this.y + this.vspeed <= bo.y0 &&
				     this.x + this.edge.right >= bo.x0 && this.x + this.edge.left <= bo.x1)) {
					this.y = bo.y0 + ((this.vspeed > 0) ? -this.edge.bottom - 1 : 1);
					this.vspeed = 0;
					this.onGround = true;
				}
			}
			//Wall
			else if (bo.slope === Infinity) {
				if (this.y + this.edge.bottom + this.vspeed >= bo.y1 && this.y + this.vspeed <= bo.y0 &&
					this.x + this.edge.left + this.hspeed <= bo.x0 && this.x + this.edge.right + this.hspeed >= bo.x0) {
					this.x = bo.x0 - ((this.hspeed > 0) ? this.edge.right + 1 : this.edge.left - 1);
					this.hspeed = 0;
				}
			}
			//Slope
			else {
				var hPt = this.x + this.edge.mid;
				var colPt = getCollPoint(bo.x0, bo.y0, bo.x1, bo.y1, hPt + this.hspeed, this.y + this.vspeed,
										 hPt + this.hspeed, this.y + this.edge.bottom + this.vspeed + this.slopeSnap);
				if (colPt.x !== -1 && (bo.type !== 'platform' || (!this.climb && this.y + this.edge.bottom <= colPt.y + 1 + (this.hspeed * bo.slope)))) {
					this.y = (colPt.y - (this.hspeed * -bo.slope)) - this.edge.bottom - 1;
					this.vspeed = (this.hspeed * -bo.slope);
					this.onGround = true;
				}
			}
		}

		//Gem Collision
		if (typeof(gameObjs.bigGemRed) !== 'undefined' &&
			this.x + this.edge.left < gameObjs.bigGemRed.x + 20 && this.x + this.edge.right > gameObjs.bigGemRed.x + 20 &&
			this.y < gameObjs.bigGemRed.y + 27                  && this.y + this.edge.bottom > gameObjs.bigGemRed.y + 27 ) {
				Assets.sounds.gemRed.play();
				gameObjs.gemBar.red += 1;
				delete gameObjs.bigGemRed;
		}
		if (typeof(gameObjs.bigGemBlue) !== 'undefined' &&
			this.x + this.edge.left < gameObjs.bigGemBlue.x + 20 && this.x + this.edge.right > gameObjs.bigGemBlue.x + 20 &&
			this.y < gameObjs.bigGemBlue.y + 27                  && this.y + this.edge.bottom > gameObjs.bigGemBlue.y + 27 ) {
				Assets.sounds.gemBlue.play();
				gameObjs.gemBar.blue += 1;
				delete gameObjs.bigGemBlue;
		}
		if (typeof(gameObjs.bigGemGreen) !== 'undefined' &&
			this.x + this.edge.left < gameObjs.bigGemGreen.x + 20 && this.x + this.edge.right > gameObjs.bigGemGreen.x + 20 &&
			this.y < gameObjs.bigGemGreen.y + 27                  && this.y + this.edge.bottom > gameObjs.bigGemGreen.y + 27 ) {
				Assets.sounds.gemGreen.play();
				gameObjs.gemBar.green += 1;
				delete gameObjs.bigGemGreen;
		}

		//Jumping and Climbing
		this.spr.pause = false;
		if (kb.up && this.climb) {
			this.vspeed = -this.climbSp;
		} else if (kb.press === 'up' && this.onGround) {
			this.vspeed = -this.jumpHeight;
		} else if (kb.down && this.climb) {
			this.vspeed = this.climbSp;
			if (this.onGround) {
				this.spr.pause = true;
			}
		} else if (this.climb) {
			this.vspeed = 0;
			this.spr.pause = true;
		}

		//Implement Movement
			this.x += this.hspeed;
			this.y += this.vspeed;

		//Set sprites
		if (this.climb) {
			this.setSprite(this.sprites.climb);
		} else if (this.onGround) {
			this.setSprite((this.hspeed === 0) ?	((this.rightFacing) ? this.sprites.standR : this.sprites.standL) :
												 	((this.rightFacing) ? this.sprites.runR : this.sprites.runL));
		} else {
			this.setSprite((this.vspeed < 0) ?	((this.rightFacing) ? this.sprites.jumpR : this.sprites.jumpL) :
												((this.rightFacing) ? this.sprites.fallR : this.sprites.fallL));
		}

		} //end Paused
	}

function BuckFly(xIn, yIn) {
	this.x = xIn;
	this.y = yIn;
	this.setSprite = setSprite;	
	this.setSprite(new Sprite(Assets.sprites.buckFly, 192, 1400, false));

	this.edge = {
		left : 40,
		right: 150,
		bottom : 210,
		top : 5
	};

	this.ac = 2;
	this.max = 20;
	this.fric = 1;
	this.dx = 0;
	this.dy = -30;

	this.injured = 0;

	//Initiate timed events
	Assets.sounds.soundtrack.play();
}
	BuckFly.prototype.draw = function() {
		if (this.injured > 0 && this.injured % 10 < 5) {
			ctx.globalAlpha = 0.5
			this.spr.draw(this.x, this.y);
			ctx.globalAlpha = 1
		} else {
			this.spr.draw(this.x, this.y);
		}
	}
	BuckFly.prototype.step = function() {
		//Vertical Movement
		if (kb.up && this.dy >= -this.max) {
			this.dy -= this.ac;
		} else if (kb.down && this.dy <= this.max) {
			this.dy += this.ac;
		} else if (this.dy > -1) {
			this.dy -= this.fric;
		} else if (this.dy < -1) {	
			this.dy += this.fric;
		}

		//Horizontal Movement
		if (kb.left && this.dx >= -this.max) {
			this.dx -= this.ac;
		} else if (kb.right && this.dx <= this.max) {
			this.dx += this.ac;
		} else if (this.dx > 0) {
			this.dx -= this.fric;
		} else if (this.dx < 0) {	
			this.dx += this.fric;
		}

		//Edge Collision check, then move
		this.y += this.dy;
		if (this.y > 530 - Level.y) {
			this.y = 530 - Level.y;
			this.dy = -5;
		} else if (this.y < -80 - Level.y) {
			this.y = -80 - Level.y;
			this.dy = -	5;
		}

		this.x += this.dx;
		if (this.x > 1200) {
			this.x = 1200;
			this.dx = 0;
		} else if (this.x < -40) {
			this.x = -40;
			this.dx = 0;
		}

		Level.y += 5;

		//Invernurable after hit
		if (this.injured > 0) {
			this.injured -= 1;
		}
	}
	//Called when Buck receives damage
	BuckFly.prototype.hit = function(damage) {
		if (this.injured === 0) {
			Assets.sounds.gemHit.load();
			Assets.sounds.gemHit.play();
			this.injured = 100;
			//Sprout gems
			gameObjs.gems.push(new HitGem(this.x + 90, this.y + 100, "red"),
							   new HitGem(this.x + 90, this.y + 100, "red"),
							   new HitGem(this.x + 90, this.y + 100, "green"),
							   new HitGem(this.x + 90, this.y + 100, "green"),
							   new HitGem(this.x + 90, this.y + 100, "blue"),
							   new HitGem(this.x + 90, this.y + 100, "blue"));
			//Reduce score
			gameObjs.gemBar.green = gameObjs.gemBar.green > damage ? gameObjs.gemBar.green - damage : 0;
			gameObjs.gemBar.blue = gameObjs.gemBar.blue > damage ? gameObjs.gemBar.blue - damage : 0;
			gameObjs.gemBar.red = gameObjs.gemBar.red > damage ? gameObjs.gemBar.red - damage : 0;
		}
	}

function Buck(xIn, yIn) {
	this.x = xIn;
	this.y = yIn;
	this.setSprite = setSprite;
	this.setSprite(new Sprite(Assets.sprites.buckMeditate, 120, 1500, false));
	this.angle = 0;
	this.redRad = 100;
	this.blueRad = 100;
	this.greenRad = 100;
	this.morphing = false;
	this.edge = {
		left : 0,
		right : 0,
		bottom : 0,
		top : 0
	}
}
	Buck.prototype.draw = function() {
		this.spr.draw(this.x, this.y);
		ctx.save();
			ctx.lineWidth = 2;
			ctx.strokeStyle = '#FFF';
			ctx.globalCompositeOperation = "color-dodge";
			if (gameObjs.gemBar.red < 0) {
				ctx.beginPath();
					ctx.arc(this.x + 60 + (20 * Math.cos(this.angle)), this.y + 90 + (20 * Math.sin(this.angle)), 100, 0, 2 * Math.PI, false);
				ctx.stroke();
				ctx.fillStyle = 'rgba(232, 46, 33, 0.8)';
	  			ctx.fill();
			} else if (gameObjs.gemBar.red === 0) {
				if (this.redRad > 1000) {
					gameObjs.gemBar.red = 1;
				} else {
					ctx.beginPath();
						ctx.arc(this.x + 60 + (20 * Math.cos(this.angle)), this.y + 90 + (20 * Math.sin(this.angle)), this.redRad, 0, 2 * Math.PI, false);
					ctx.stroke();
					ctx.fillStyle = 'rgba(232, 46, 33, ' + (0.8 - (this.redRad / 1500)) + ')';
					ctx.fill();
					this.redRad += 30;
				}
			}
			if (gameObjs.gemBar.blue < 0) {
				ctx.beginPath();
					ctx.arc(this.x + 60 + (20 * Math.cos(this.angle)), this.y + 90 + (-30 * Math.sin(this.angle)), 100, 0, 2 * Math.PI, false);
				ctx.stroke();
	  			ctx.fillStyle = 'rgba(33, 70, 232, 0.8)';
	  			ctx.fill();
			} else if (gameObjs.gemBar.blue === 0) {
				if (this.blueRad > 1000) {
					gameObjs.gemBar.blue = 1;
				} else {
					ctx.beginPath();
						ctx.arc(this.x + 60 + (20 * Math.cos(this.angle)), this.y + 90 + (20 * Math.sin(this.angle)), this.blueRad, 0, 2 * Math.PI, false);
					ctx.stroke();
					ctx.fillStyle = 'rgba(33, 70, 232, ' + (0.8 - (this.blueRad / 1500)) + ')';
					ctx.fill();
					this.blueRad += 30;
				}
			}
			if (gameObjs.gemBar.green < 0) {
				ctx.beginPath();
					ctx.arc(this.x + 60 + (-30 * Math.cos(this.angle)), this.y + 90 + (20 * Math.sin(this.angle)), 100, 0, 2 * Math.PI, false);
				ctx.stroke();
				ctx.fillStyle = 'rgba(33, 232, 46, 0.8)';
	  			ctx.fill();
			} else if (gameObjs.gemBar.green === 0) {
				if (this.greenRad > 1000) {
					gameObjs.gemBar.green = 1;
				} else {
					ctx.beginPath();
						ctx.arc(this.x + 60 + (20 * Math.cos(this.angle)), this.y + 90 + (20 * Math.sin(this.angle)), this.greenRad, 0, 2 * Math.PI, false);
					ctx.stroke();
					ctx.fillStyle = 'rgba(33,232, 46, ' + (0.8 - (this.greenRad / 1500)) + ')';
					ctx.fill();
					this.greenRad += 30;
				}
			}
		ctx.restore();
		this.angle += 0.1;
	}
	Buck.prototype.step = function() {
		if (this.morphing) {
			if (Math.round(this.spr.frNum) === 13) {
				gameObjs.buck = new BuckFly(this.x, this.y - 30);
				delete gameObjs.shawn;
			}
		}
		//Float to ground after gems are collected
		else if (this.redRad + this.blueRad + this.greenRad > 3000) {
			if (this.y > 418) {
				this.spr.pause = true;
				//Transform into frog if jumped on
				var s = gameObjs.shawn;
				if (!this.morphing && s.vspeed > 0 &&
					getCollPoint(s.x + s.edge.mid, s.y + s.edge.bottom, s.x + s.edge.mid + s.hspeed, s.y + s.edge.bottom + s.vspeed,
								 this.x, this.y + 40, this.x + 120, this.y + 40).x > 0) {
					this.morph();
				}
			} else {
				this.y += 2;
			}
		}
	}
	Buck.prototype.morph = function() {
		Assets.sounds.transform.play();
		console.log("hey");
		this.morphing = true;
		this.y += 5;
		this.x -= 10;
		this.setSprite(new Sprite(Assets.sprites.morph, 140, 1000, false));
		gameObjs.shawn.paused = true;
		gameObjs.shawn.x = Math.floor(gameObjs.shawn.x);
		gameObjs.shawn.y = Math.floor(gameObjs.shawn.y);
	}

function BuckSwim(xIn, yIn) {
	this.x = xIn;
	this.y = yIn;
	this.setSprite = setSprite;
	this.setSprite(new Sprite(Assets.sprites.buckSwim, 240, 700, false));

	this.edge = {
		left : 15,
		right: 132,
		bottom : 205,
		top : 80
	};

	this.ac = 2;
	this.max = 20;
	this.fric = 1;
	this.dx = 0;
	this.dy = 0;

	this.injured = 0;
}
	BuckSwim.prototype.draw = function() {
		this.spr.draw(this.x, this.y);
	}
	BuckSwim.prototype.step = function() {
		//Vertical Movement
		if (kb.up && this.dy >= -this.max) {
			this.dy -= this.ac;
		} else if (kb.down && this.dy <= this.max) {
			this.dy += this.ac;
		} else if (this.dy > 0) {
			this.dy -= this.fric;
		} else if (this.dy < 0) {	
			this.dy += this.fric;
		}

		//Horizontal Movement
		if (kb.left && this.dx >= -this.max) {
			this.dx -= this.ac;
		} else if (kb.right && this.dx <= this.max) {
			this.dx += this.ac;
		} else if (this.dx > -4) {
			this.dx -= this.fric;
		} else if (this.dx < -4) {	
			this.dx += this.fric;
		}

		//Edge Collision check, then move
		this.y += this.dy;
		if (this.y > 530) {
			this.y = 530;
			this.dy = 0;
		} else if (this.y < -80) {
			this.y = -80;
			this.dy = 0;
		}

		this.x += this.dx;
		if (this.x > 1100) {
			this.x = 1100;
			this.dx = 0;
		} else if (this.x < -80) {
			this.x = -80;
			this.dx = 0;
		}

		//Invernurable after hit
		if (this.injured > 0) {
			this.injured -= 1;
		}
	}
	BuckSwim.prototype.hit = BuckFly.hit;

function BigGem(xIn, yIn, colour) {
	this.x = xIn;
	this.y = yIn;
	this.setSprite = setSprite;
	this.sprites = {
		red : new Sprite(Assets.sprites.bigGemRed, 40, 800, false),
		green : new Sprite(Assets.sprites.bigGemGreen, 40, 800, false),
		blue : new Sprite(Assets.sprites.bigGemBlue, 40, 800, false)
	}
	switch(colour) {
		case("red"):
			this.setSprite(this.sprites.red);
			break;
		case("green"):
			this.setSprite(this.sprites.green);
			break;
		case("blue"):
			this.setSprite(this.sprites.blue);
			break;
	}
}
	BigGem.prototype.draw = function() {
		this.spr.draw(this.x, this.y);
	}
	BigGem.prototype.step = function() {

	}

function Gem(xIn, yIn, colour) {
	this.snd = new Audio();
	this.x = xIn;
	this.y = yIn;
	this.setSprite = setSprite;
	this.colour = colour;
	this.rad = 5;
	this.explode = false;
	this.sprites = {
		red : new Sprite(Assets.sprites.gemRed, 30, 800, false),
		green : new Sprite(Assets.sprites.gemGreen, 30, 800, false),
		blue : new Sprite(Assets.sprites.gemBlue, 30, 800, false)
	}
	switch(colour) {
		case("red"):
			this.setSprite(this.sprites.red);
			this.snd.src = Assets.sounds.gemRed.src;
			break;
		case("green"):
			this.setSprite(this.sprites.green);
			this.snd.src = Assets.sounds.gemGreen.src;
			break;
		case("blue"):
			this.setSprite(this.sprites.blue);
			this.snd.src = Assets.sounds.gemBlue.src;
			break;
	}
}
	Gem.prototype.draw = function() {
		if (!this.explode) {
			this.spr.draw(this.x, this.y);
		} else {

			ctx.strokeStyle = '#FFF';
			ctx.fillStyle = 'rgba(' + ((this.colour === 'red') ? 255 : 0) + ', ' +
									  ((this.colour === 'green') ? 255 : 0) + ', ' +
									  ((this.colour === 'blue') ? 255 : 0) + ', ' +
									  (0.6 - (this.rad / 1500)) + ')';
			ctx.beginPath();
				ctx.arc(this.x + 14, this.y + 11 + Level.y, this.rad, 0, 2 * Math.PI, false);
			ctx.stroke();
			ctx.fill();
			this.rad += 60;	
			if (this.rad > 1000) {
				delete this;
			}
		}
	}
	Gem.prototype.step = function() {
		if (!this.explode &&
			gameObjs.buck.x + gameObjs.buck.edge.left < this.x + 14 && gameObjs.buck.x + gameObjs.buck.edge.right  > this.x + 14 &&
			gameObjs.buck.y + gameObjs.buck.edge.top  < this.y + 11 && gameObjs.buck.y + gameObjs.buck.edge.bottom > this.y + 11 ) {
				this.snd.play();
				this.explode = true;	
				(this.colour === 'red') ? gameObjs.gemBar.red += 1 : (this.colour === 'blue') ? gameObjs.gemBar.blue += 1 : gameObjs.gemBar.green += 1;
		}
	}

function HitGem(xIn, yIn, colour) {
	this.x = xIn;
	this.y = yIn;
	this.dx = (Math.random() * 20) - 5;
	this.dy = -35 + (Math.random() * 10);
	this.setSprite = setSprite;
	this.colour = colour;
	this.sprites = {
		red : new Sprite(Assets.sprites.gemRed, 30, 800, false),
		green : new Sprite(Assets.sprites.gemGreen, 30, 800, false),
		blue : new Sprite(Assets.sprites.gemBlue, 30, 800, false)
	}
	switch(colour) {
		case("red"):
			this.setSprite(this.sprites.red);
			break;
		case("green"):
			this.setSprite(this.sprites.green);
			break;
		case("blue"):
			this.setSprite(this.sprites.blue);
			break;
	}
}
	HitGem.prototype.draw = function() {
		this.spr.draw(this.x, this.y);
	}
	HitGem.prototype.step = function() {
		this.dy += 1.5;
		this.y += this.dy;
		this.x += this.dx
	}

function GemBar() {
	this.red = -1;
	this.blue = -1;
	this.green = -1;
}
	GemBar.prototype.draw = function() {
		ctx.save();
		if (this.red + this.blue + this.green > -2) {
			ctx.beginPath();
				ctx.arc(68, 58, 30, 0, 2 * Math.PI, false);
				ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
				ctx.lineWidth = 3;
			ctx.stroke();
			ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; 
			ctx.fill();
			ctx.lineCap = 'round';
			ctx.setLineDash([2, 10]);
		}
		ctx.lineWidth = 8;
		if (this.red > 0) {
			ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
			ctx.beginPath();
				ctx.moveTo(70, 35);
				ctx.lineTo(90 + (this.red * 12), 35);
			ctx.stroke();
			ctx.drawImage(Assets.sprites.bigGemRed, 0, 0, 40, 56, 38, 10, 40, 56);
		}
		if (this.green > 0) {
			ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
			ctx.beginPath();
				ctx.moveTo(70, 81);
				ctx.lineTo(90 + (this.green * 12), 81);
			ctx.stroke();
			ctx.drawImage(Assets.sprites.bigGemGreen, 0, 0, 40, 56, 38, 45, 40, 56);
		}
		if (this.blue > 0) {
			ctx.strokeStyle = 'rgba(0, 0,255, 0.5)';;
			ctx.beginPath();
				ctx.moveTo(85, 58);
				ctx.lineTo(90 + (this.blue * 12), 58);
			ctx.stroke();
			ctx.drawImage(Assets.sprites.bigGemBlue, 0, 0, 40, 56, 58, 30, 40, 56);
		}
		ctx.restore();
	}
	GemBar.prototype.step = function() {
	
	}

function Whale(xIn, yIn) {
	this.x = xIn;
	this.y = yIn;
	this.setSprite = setSprite;	
	this.setSprite(new Sprite(Assets.sprites.whale, 500, 1200, false));
	//Trail gems behind
	this.g1 = new Gem(xIn - 20,  yIn + 130, "red");
	this.g2 = new Gem(xIn - 120,  yIn + 130, "blue");
	this.g3 = new Gem(xIn - 220, yIn + 130, "green");
	gameObjs.gems.push(this.g1, this.g2, this.g3);
}
	Whale.prototype.draw = function() {
		this.spr.draw(this.x, this.y);
	}
	Whale.prototype.step = function() {
		//Trigger move left
		if (gameObjs.buck.y - this.y < 600) {
			this.x += 5;
			this.g1.x += 5;
			this.g2.x += 5;
			this.g3.x += 5;
		}

		//Collision with Buck
		if (gameObjs.buck.x + gameObjs.buck.edge.left < this.x + 450 && gameObjs.buck.x + gameObjs.buck.edge.right  > this.x + 20 &&
			gameObjs.buck.y + gameObjs.buck.edge.top  < this.y + 200 && gameObjs.buck.y + gameObjs.buck.edge.bottom > this.y + 50 ) {
				gameObjs.buck.hit(2);
		}
	}

/*****************\
  VIEW CONTROLLER
\*****************/
function ViewControl() {
}
	ViewControl.prototype.step = function() {
		
	}
	ViewControl.prototype.draw = function() {

	}