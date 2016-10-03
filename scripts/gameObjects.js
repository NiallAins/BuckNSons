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
	this.LevelDy = 5;

	//Set music
	Assets.sounds.static.pause();
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

		Level.y += this.LevelDy;

		if (Level.y > 16000) {
			this.LevelDy -= 0.2;
			if (this.LevelDy <= 0) {
				gameObjs.buck = new BuckSwim(this.x - 12, this.y);
			}
		}

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
			for (var i = 0; i < damage; i += 1) {
				if (gameObjs.gemBar.green > 1) gameObjs.gems.push(new HitGem(this.x + 90, this.y + 100, "green"));
				if (gameObjs.gemBar.blue  > 1) gameObjs.gems.push(new HitGem(this.x + 90, this.y + 100, "blue"));
				if (gameObjs.gemBar.red   > 1) gameObjs.gems.push(new HitGem(this.x + 90, this.y + 100, "red"));
			}
			//Reduce score
			gameObjs.gemBar.green = gameObjs.gemBar.green > damage ? gameObjs.gemBar.green - damage : 1;
			gameObjs.gemBar.blue = gameObjs.gemBar.blue > damage ? gameObjs.gemBar.blue - damage : 1;
			gameObjs.gemBar.red = gameObjs.gemBar.red > damage ? gameObjs.gemBar.red - damage : 1;
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
					ctx.arc(this.x + 60 + (20 * Math.cos(this.angle)),
							this.y + Level.y + 90 + (20 * Math.sin(this.angle)), 100, 0, 2 * Math.PI, false);
				ctx.stroke();
				ctx.fillStyle = 'rgba(232, 46, 33, 0.8)';
	  			ctx.fill();
			} else if (gameObjs.gemBar.red === 0) {
				if (this.redRad > 1000) {
					gameObjs.gemBar.red = 1;
				} else {
					ctx.beginPath();
						ctx.arc(this.x + 60 + (20 * Math.cos(this.angle)),
								this.y + 90 + (20 * Math.sin(this.angle)), this.redRad, 0, 2 * Math.PI, false);
					ctx.stroke();
					ctx.fillStyle = 'rgba(232, 46, 33, ' + (0.8 - (this.redRad / 1500)) + ')';
					ctx.fill();
					this.redRad += 30;
				}
			}
			if (gameObjs.gemBar.blue < 0) {
				ctx.beginPath();
					ctx.arc(this.x + 60 + (20 * Math.cos(this.angle)),
							this.y + Level.y + 90 + (-30 * Math.sin(this.angle)), 100, 0, 2 * Math.PI, false);
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
					ctx.arc(this.x + 60 + (-30 * Math.cos(this.angle)),
							this.y + Level.y + 90 + (20 * Math.sin(this.angle)), 100, 0, 2 * Math.PI, false);
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

	this.setSprite(new Sprite(Assets.sprites.buckTurn, 232, 500, false));
	this.transform = true;

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

	this.LevelDx = 0;

	this.injured = 0;

	Level.load.partThree();
}
	BuckSwim.prototype.draw = function() {
		if (this.injured > 0 && this.injured % 10 < 5) {
			ctx.globalAlpha = 0.5
			this.spr.draw(this.x, this.y);
			ctx.globalAlpha = 1
		} else {
			this.spr.draw(this.x, this.y);
		}
	}
	BuckSwim.prototype.step = function() {
		if (this.transform && this.spr.frNum > 4) {
			this.setSprite(new Sprite(Assets.sprites.buckSwim, 240, 700, false));
		}

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
		if (this.y > 530 - Level.y) {
			this.y = 530 - Level.y;
			this.dy = 0;
		} else if (this.y < -80 - Level.y) {
			this.y = -80 - Level.y;
			this.dy = 0;
		}

		this.x += this.dx;
		if (this.x > 1100 - Level.x) {
			this.x = 1100 - Level.x;
			this.dx = 5;
		} else if (this.x < -20 - Level.x) {
			this.x = -20 - Level.x;
			this.dx = 5;
		}

		Level.x += this.LevelDx;

		if (this.LevelDx > -5) {
			this.LevelDx -= 0.2;
		}

		//Invernurable after hit
		if (this.injured > 0) {
			this.injured -= 1;
		}
	}
	//Called when Buck receives damage
	BuckSwim.prototype.hit = function(damage) {
		if (this.injured === 0) {
			Assets.sounds.gemHit.load();
			Assets.sounds.gemHit.play();
			this.injured = 100;
			//Sprout gems
			for (var i = 0; i < damage; i += 1) {
				if (gameObjs.gemBar.green > 1) gameObjs.gems.push(new HitGem(this.x + 90, this.y + 100, "green"));
				if (gameObjs.gemBar.blue  > 1) gameObjs.gems.push(new HitGem(this.x + 90, this.y + 100, "blue"));
				if (gameObjs.gemBar.red   > 1) gameObjs.gems.push(new HitGem(this.x + 90, this.y + 100, "red"));
			}
			//Reduce score
			gameObjs.gemBar.green = gameObjs.gemBar.green > damage ? gameObjs.gemBar.green - damage : 1;
			gameObjs.gemBar.blue = gameObjs.gemBar.blue > damage ? gameObjs.gemBar.blue - damage : 1;
			gameObjs.gemBar.red = gameObjs.gemBar.red > damage ? gameObjs.gemBar.red - damage : 1;
		}
	}

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
		if (-Level.y + 700 < this.y) {
			deleteObject(this);
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
		this.x += this.dx;
		if (-Level.y + 700 < this.y) {
			deleteObject(this);
		}
	}

function BadGem(xIn, yIn, dyIn) {
	this.x = xIn;
	this.y = yIn;
	this.dy = (dyIn) ? dyIn : 0;
	this.setSprite = setSprite;
	(this.dy === 0) ? this.setSprite(new Sprite(Assets.sprites.badGem, 40, 800, false)) : this.setSprite(new Sprite(Assets.sprites.badGemFly, 40, 800, false));
}
	BadGem.prototype.draw = function() {
		this.spr.draw(this.x, this.y);
	}
	BadGem.prototype.step = function() {
		//Collision with Buck
		if (gameObjs.buck.x + gameObjs.buck.edge.left < this.x + 22 && gameObjs.buck.x + gameObjs.buck.edge.right  > this.x + 22 &&
			gameObjs.buck.y + gameObjs.buck.edge.top  < this.y + 29 && gameObjs.buck.y + gameObjs.buck.edge.bottom > this.y + 29 ) {
				gameObjs.buck.hit(2);
				deleteObject(this);
		}
		if (-Level.y - 100 < this.y) {
			this.y += this.dy;
		} else if (-Level.y + 700 < this.y) {
			deleteObject(this);
		}
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

function Whale(xIn, yIn, dirIn) {
	this.x = xIn;
	this.y = yIn;
	this.dir = dirIn;
	this.setSprite = setSprite;	
	if (dirIn > 0) {
		this.setSprite(new Sprite(Assets.sprites.whaleR, 500, 1200, false));
		//Trail gems behind
		this.g1 = new Gem(xIn - 50,  yIn + 130, "red");
		this.g2 = new Gem(xIn - 150,  yIn + 130, "blue");
		this.g3 = new Gem(xIn - 250, yIn + 130, "green");
	} else {
		this.setSprite(new Sprite(Assets.sprites.whaleL, 500, 1200, false));
		this.g1 = new Gem(xIn + 550,  yIn + 130, "red");
		this.g2 = new Gem(xIn + 650,  yIn + 130, "blue");
		this.g3 = new Gem(xIn + 750, yIn + 130, "green");
	}
	gameObjs.gems.push(this.g1, this.g2, this.g3);
}
	Whale.prototype.draw = function() {
		this.spr.draw(this.x, this.y);
	}
	Whale.prototype.step = function() {
		//Trigger move left
		if (-Level.y - this.y < 300) {
			this.x += 5 * this.dir;
			this.g1.x += 5 * this.dir;
			this.g2.x += 5 * this.dir;
			this.g3.x += 5 * this.dir;
		}

		//Collision with Buck
		if (gameObjs.buck.x + gameObjs.buck.edge.left < this.x + 450 && gameObjs.buck.x + gameObjs.buck.edge.right  > this.x + 20 &&
			gameObjs.buck.y + gameObjs.buck.edge.top  < this.y + 200 && gameObjs.buck.y + gameObjs.buck.edge.bottom > this.y + 50 ) {
				gameObjs.buck.hit(2);
		}
	}

function Monk(colIn) {
	this.setSprite = setSprite;
	this.col = colIn;
	this.shootWait = 0;
	gameObjs.bullets = [];

	switch(this.col) {
		case "green":
			this.x = Level.x + 1400;
			this.y = -Level.y;
			this.wobble = 0;
			this.restSpr = new Sprite(Assets.sprites.bossGreen, 218, 400);
			this.shootSpr = new Sprite(Assets.sprites.bossGreenShoot, 218, 400, function()	 { gameObjs.monkG.setSprite(gameObjs.monkG.restSpr); });
			this.shootTime = function() { this.rate = 20 + Math.round(100 * Math.random()); }
			this.shootFunc = function() {
				this.greenFire += 1;
				if (this.greenFire === 1) {
					this.setSprite(this.shootSpr);
					this.shootTime();
					this.shootWait = -1;
				} else if (this.greenFire < 15) {
					this.shootWait = -1;
				} else {
					gameObjs.bullets.push(new Bullet(this.x, this.y + 40, "green"));
					this.greenFire = 0;
				}
			}
			this.rate = 150;
			break;
		case "blue":
			this.y = -Level.y + 420;
			this.wobble = 3.2;
			this.x = Level.x + 5400;
			this.restSpr = new Sprite(Assets.sprites.bossBlue, 256, 400);
			this.shootSpr = new Sprite(Assets.sprites.bossBlueShoot, 256, 400, function() { gameObjs.monkB.setSprite(gameObjs.monkB.restSpr); });
			this.blueFire = 0;
			this.shootTime = function() { this.rate = 50 + Math.round(100 * Math.random()); }
			this.shootFunc = function() {
				this.blueFire += 1;
				this.blueFire %= 50;
				if (this.blueFire === 0) {
					this.shootTime();
				} else {
					if (this.blueFire % 5 === 0) {
						gameObjs.bullets.push(new Bullet(this.x - 10, this.y + 68, "blue"));
					}
					this.shootWait = -1; 
					this.setSprite(this.shootSpr);
					this.spr.frNum = 0;
				}
			}
			break;
		case "red":
			this.y = -Level.y + 190;
			this.wobble = 1.6;
			this.x = Level.x + 9400;
			this.restSpr = new Sprite(Assets.sprites.bossRed, 228, 400);
			this.shootSpr = new Sprite(Assets.sprites.bossRedShoot, 228, 400, function() { gameObjs.monkR.setSprite(gameObjs.monkR.restSpr); });
			this.shootTime = function() { this.rate = 50 + Math.round(100 * Math.random()); }
			this.shootFunc = function() {
				gameObjs.bullets.push(new Bullet(this.x - 5, this.y + 209, "red"));
				gameObjs.bullets.push(new Bullet(this.x - 5, this.y + 209, "red"));
				this.setSprite(this.shootSpr);
				this.shootTime();
			}
			break;
	}
	this.shootTime();
	this.setSprite(this.restSpr);
}
	Monk.prototype.draw = function() {
		this.spr.draw(this.x, this.y);
	}
	Monk.prototype.step = function() {
		this.wobble += 0.05;

		if ((this.col === 'green' && this.x + Level.x < 1000) ||
			(this.col === 'blue' && this.x + Level.x < 900) ||
			(this.col === 'red' && this.x + Level.x < 800)) {
			this.x += 5;
		}
		this.y += Math.sin(this.wobble) * 10;

		if (this.x + Level.x < 1500) {
			this.shootWait += 1;
			this.shootWait %= this.rate;
			if (this.shootWait === 0) {
				this.shootFunc();
			}
		}
	}

function Bullet(xIn, yIn, col) {
	this.x = xIn;
	this.y = yIn;

	switch(col) {
		case "green":
			this.col = "#21E82E";
			this.w = 15;
			this.l = 0;
			this.dx = 20;
			break;
		case "blue":
			this.col = "#2146E8";
			this.w = 7;
			this.l = 10;
			this.dx = 20;
			break;
		case "red":
			this.col = "#E82E21";
			this.w = 10;
			this.l = 25;
			this.dx = 8;
			this.dy = Math.random() * 62;
			break;
	}
}
	Bullet.prototype.draw = function() {
		ctx.save();
			ctx.lineWidth = this.w;
			ctx.lineCap = "round";
			ctx.strokeStyle = this.col;
			ctx.beginPath();
				ctx.moveTo(this.x + Level.x, this.y + Level.y);
				ctx.lineTo(this.x + Level.x + this.l, this.y + Level.y);
			ctx.stroke();
		ctx.restore();
	}
	Bullet.prototype.step = function() {
		this.x -= this.dx;

		if (this.col === "#E82E21") {
			this.dy += 1;
			this.y += Math.sin(this.dy / 10) * 15;
		}

		if (this.x < -Level.x) {
			deleteObject(this);
		}

		//Collision with Buck
		if (gameObjs.buck.x + gameObjs.buck.edge.left < this.x + 100 && gameObjs.buck.x + gameObjs.buck.edge.right > this.x - 100 &&
			gameObjs.buck.y + gameObjs.buck.edge.top  < this.y && gameObjs.buck.y + gameObjs.buck.edge.bottom > this.y + 10 ) {
				gameObjs.buck.hit(2);
		}
	}

function Menu() {
	this.title1 = new Sprite(Assets.bgs.title1);
	this.title2 = new Sprite(Assets.bgs.title2);
	this.timer = 0;

	Assets.sounds.static.loop = true;
	Assets.sounds.static.play();
}
	Menu.prototype.draw = function() {
		//Timers for title display and fades
		if (this.timer < 120) {
			this.title1.draw(280, -1120);
		} else if (this.timer < 150) {
			ctx.globalAlpha = ((150 - this.timer) / 30);
				this.title1.draw(280, -1120);
			ctx.globalAlpha = 1;
		} else if (this.timer < 210) {
			if (this.timer > 180) {
				ctx.globalAlpha = 1 - ((210 - this.timer) / 30);
					this.title2.draw(280, -1150);
				ctx.globalAlpha = 1;
			}
		} else if (this.timer < 330) {
			this.title2.draw(280, -1150);
		} else if (this.timer < 380){
			ctx.globalAlpha = ((380 - this.timer) / 50);
				this.title2.draw(280, -1150);
			ctx.globalAlpha = 1;
		}
	}
	Menu.prototype.step = function() {
		this.timer += 1;

		//Pan downwards
		if (Level.y > 0) {
			if (this.timer > 380) {
				Level.y -= 5;
				if (Level.y < 600) {
					gameObjs.buck.y += 5;
				}
			}
		} else {
			//Add level objects
			Level.load.partTwo();
			delete gameObjs.menu;
		}
	}

function Logo() {
	this.ani = new Sprite(Assets.sprites.logo, 560, 300);
	this.ani.togglePause();
	this.timer = 0;
	this.rt = false;
}
	Logo.prototype.draw = function() {
		this.ani.draw(200, -1000);
	}
	Logo.prototype.step = function() {
		if (this.timer === 30) {
			this.ani.togglePause();
		}
		this.timer += 1;
		if (this.ani.frNum > 11 && this.rt === false) {
			this.ani.togglePause();
			this.ani.frNum = 12;
			this.rt = true;
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