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

	this.footstep = null;
	Assets.sounds.step1.volume = 0.05;
	Assets.sounds.step2.volume = 0.05;
	Assets.sounds.step3.volume = 0.05;
	Assets.sounds.gemGreen.volume = 0.1;
	Assets.sounds.gemBlue.volume = 0.1;
	Assets.sounds.gemRed.volume = 0.1;
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
				this.playStep();
				this.footstep.play();
			} else {
				(this.hspeed > -this.runSp) ? this.hspeed -= this.jumpAc : this.hspeed = -this.runSp;
			}
		} else if (kb.right) {
			if (this.climb) {
				this.hspeed = this.climbSp;
			} else if (this.onGround) {
				this.hspeed = this.runSp;
				this.playStep();
				this.footstep.play();
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
					Assets.sounds.land.volume = 0.3;
					Assets.sounds.land.play();
				}
			}
			//Wall
			else if (bo.slope === Infinity) {
				if (this.y + this.edge.bottom + this.vspeed >= bo.y1 && this.y + this.vspeed <= bo.y0 &&
					this.x + this.edge.left + this.hspeed <= bo.x0 && this.x + this.edge.right + this.hspeed >= bo.x0) {
					this.x = bo.x0 - ((this.hspeed > 0) ? this.edge.right + 1 : this.edge.left - 1);
					this.hspeed = 0;
					if (this.footstep) {
						this.footstep.pause();
					}
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
			Assets.sounds.jump.play();
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
	Shawn.prototype.playStep = function() {
		if (this.footstep === null || this.footstep.ended) {
			var a = Math.floor(Math.random() * 3);
			switch(a) {
				case 0:
					this.footstep = Assets.sounds.step1;
					break;
				case 1:
					this.footstep = Assets.sounds.step2;
					break;
				case 2:
					this.footstep = Assets.sounds.step3;
					break;
			}
		}
	}

function BuckFly(xIn, yIn) {
	Assets.sounds.takeoff.play();
	Assets.sounds.takeoff.volume = 0.1;

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
	Assets.sounds.leftfly.volume = 0.1;
	Assets.sounds.fowardfly.volume = 0.8;
	Assets.sounds.rightfly.volume = 0.1;

	this.timer = 0;
}
	BuckFly.prototype.draw = function() {
		if (this.injured > 0 && this.injured % 10 < 5) {
			ctx.globalAlpha = 0.5;
			this.spr.draw(this.x, this.y);
			ctx.globalAlpha = 1;
		} else {
			this.spr.draw(this.x, this.y);
		}
	}
	BuckFly.prototype.step = function() {
		if (kb.left) {
			(this.timer === 15) ? Assets.sounds.leftfly.play() : this.timer += 1;
		} else if (kb.right) {
			(this.timer === 15) ? Assets.sounds.rightfly.play() : this.timer += 1;
		} else if (kb.up) {
			(this.timer === 10) ? Assets.sounds.fowardfly.play() : this.timer += 1;
		}
		if (kb.release === "up" || kb.release === "left" || kb.release === "right") {
			this.timer = 0;
		}

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
	this.setSprite(new Sprite(Assets.sprites.buckMeditate, 124, 1500, false));
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
		Assets.sounds.morph.play();
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

	Assets.sounds.hTurn.volume = 1;
	Assets.sounds.hTurn.play();
	Assets.sounds.space.volume = 0.2;
	Assets.sounds.space.loop = true;
	Assets.sounds.space.play();

	this.setSprite(new Sprite(Assets.sprites.buckTurn, 232, 500, false));
	this.transform = true;

	this.edge = {
		left : 90,
		right: 230,
		bottom : 210,
		top : 70
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
		} else if (this.dx > -1) {
			this.dx -= this.fric;
		} else if (this.dx < -1) {	
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

function BuckDead(xIn, yIn, dxIn, dyIn) {
	this.edge = {
		left : 40,
		right: 150,
		bottom : 210,
		top : 5
	};

	this.angB = this.angS = this.angH = 0;
	this.buckSpr = new Sprite(Assets.sprites.buckDead);
	this.shawnSpr = new Sprite(Assets.sprites.shawnFall);
	this.hatSpr = new Sprite(Assets.sprites.hatDead);
	this.xB = xIn + 16 + (this.buckSpr.width / 2);
	this.yB = yIn + 84 + (this.buckSpr.height / 2);
	this.xS = xIn + 40 + (this.shawnSpr.width / 2);
	this.yS = yIn + 16 + (this.shawnSpr.height / 2);
	this.xH = xIn + 160 + (this.hatSpr.width / 2);
	this.yH = yIn + 56 + (this.hatSpr.height / 2);

	this.dx = dxIn;
	this.dy = dyIn;
	this.sound = true;

	this.damp = 1;
	this.lvlDx = 5;
	this.lvlDy = 0;
}
	BuckDead.prototype.draw = function() {
		ctx.save();
			ctx.translate(this.xB + Level.x, this.yB + Level.y);
			ctx.rotate(this.angB * Math.PI / 180);
			this.buckSpr.draw(-Level.x - (this.buckSpr.width / 2), -Level.y - (this.buckSpr.height / 2));
		ctx.restore();
		ctx.save();
			ctx.translate(this.xS + Level.x, this.yS + Level.y);
			ctx.rotate(this.angS * Math.PI / 180);
			this.shawnSpr.draw(-Level.x - (this.shawnSpr.width / 2), -Level.y - (this.shawnSpr.height / 2));
		ctx.restore();
		ctx.save();
			ctx.translate(this.xH + Level.x, this.yH + Level.y);
			ctx.rotate(this.angH * Math.PI / 180);
			this.hatSpr.draw(-Level.x - (this.hatSpr.width / 2), -Level.y - (this.hatSpr.height / 2));
		ctx.restore();
	}
	BuckDead.prototype.step = function() {
		if (this.lvlDx > 0.5) {
			this.lvlDx = (Level.x + 11740) / 120;
			Level.x -= this.lvlDx;

			this.dx -= (this.dx - 5) / 2;
			this.dy -= (this.dy) / 10;
			this.xB += this.dx * this.lvlDx / 4;
			this.yB += this.dy;
			this.xS += this.dx * this.lvlDx / 3.8;
			this.yS += this.dy;
			this.xH += this.dx * this.lvlDx / 3.6;
			this.yH += this.dy;

			this.angB += 1 * this.lvlDx / 2;
			this.angS += 2 * this.lvlDx / 2;
			this.angH -= 5 * this.lvlDx / 2;
		} else if (Level.y > 1000) {
			if (this.sound) {
				Assets.sounds.falling.volume = 0.6;
				Assets.sounds.falling.play();
				this.sound = false;
			}
			this.lvlDy += (this.lvlDy < 100) ? 1 : 0;
			Level.y -= this.lvlDy;
			this.dy = this.lvlDy

			this.yB += this.dy * 0.97;
			this.yS += this.dy * 0.98;
			this.yH += this.dy * 0.97;

			this.xB += ((-Level.x + 350) - this.xB) * (this.lvlDy / 7000);
			this.xS += ((-Level.x + 600) - this.xS) * (this.lvlDy / 7000);
			this.xH += ((-Level.x + 700) - this.xH) * (this.lvlDy / 7000);
			this.angB += 0.5 * this.lvlDy / 20;
			this.angS += 2	 * this.lvlDy / 20;
			this.angH -= 3 * this.lvlDy / 20;
		} else {
			this.lvlDy = (this.lvlDy - 6 > 0) ? this.lvlDy - 6 : 0;
			Level.y -= this.lvlDy;

			var yB2 = this.yB + (this.dy * 0.97),
				yS2 = this.yS + (this.dy * 0.98);
				yH2 = this.yH + (this.dy * 0.97);
			if (yB2 <= 402) {
				this.yB = yB2;
			} else {
				this.angB = 0;
				this.yB = 402;
				gameObjs.buck = new BuckFight(this.xB, this.yB, this.buckSpr);
			}
			if (yS2 <= 402) {
				this.yS = yS2;
				this.yH = yH2;
			} else {
				this.angS = 90;
				this.yS = 402;
				this.angH = 180;
				this.yH = 402;
				Assets.sounds.falling.pause();
				Assets.sounds.thump.volume = 0.8;
				Assets.sounds.thump.play();
				gameObjs.shawn = new ShawnDead(this.xS, this.yS, this.shawnSpr, this.xH, this.yH, this.hatSpr);
			}
		}
	}

function BuckFight(xIn, yIn, sprIn) {
	this.x = xIn - 110;
	this.y = yIn - 62;
	this.dx = 0;
	this.dy = 0;
	gameObjs.flyGems = [];
	this.timer = 0;
	this.restSpr = new Sprite(Assets.sprites.buckFight, 104, 800, false);
	this.cowarSpr = new Sprite(Assets.sprites.buckCowar, 140, 0, false);
	this.mash;
	this.setSprite = setSprite;
	this.setSprite(sprIn);
	this.alive = 0;
	this.angle = 0;
	this.rad = 0;
	this.lDy = 0;
	gameObjs.mash = new Mash();

	this.edge = {
		left : 0,
		right: 0,
		bottom : 184,
		top : 28
	};
}
	BuckFight.prototype.draw = function() {
		if (this.alive >= 2) {
			ctx.save();
				ctx.lineWidth = 2;
				ctx.strokeStyle = '#FFF';
				ctx.globalCompositeOperation = "color-dodge";
				ctx.beginPath();
					ctx.arc(this.x + Level.x + 60 + (20 * Math.cos(this.angle)),
							this.y + Level.y + 90 + (20 * Math.sin(this.angle)), this.rad, 0, 2 * Math.PI, false);
				ctx.stroke();
				ctx.fillStyle = 'rgba(232, 46, 33, 0.8)';
	  			ctx.fill();

	  			ctx.beginPath();
					ctx.arc(this.x + Level.x + 60 + (-30 * Math.cos(this.angle)),
							this.y + Level.y + 90 + (20 * Math.sin(this.angle)), this.rad, 0, 2 * Math.PI, false);
				ctx.stroke();
				ctx.fillStyle = 'rgba(33, 70, 232, 0.8)';
	  			ctx.fill();

	  			ctx.beginPath();
					ctx.arc(this.x + Level.x + 60 + (20 * Math.cos(this.angle)),
							this.y + Level.y + 90 + (-30 * Math.sin(this.angle)), this.rad, 0, 2 * Math.PI, false);
				ctx.stroke();
				ctx.fillStyle = 'rgba(33, 232, 46, 0.8)';
	  			ctx.fill();
			ctx.restore();
			this.angle += 0.1;
		}
		this.spr.draw(this.x, this.y);
	}
	BuckFight.prototype.step = function() {
		if (this.alive === 1) {
			if (this.y <= -20 && this.y >= -40 && this.dy > 0) {
				this.y = -20;
				this.dy = 0;
				this.dx = 0;
				this.spr = new Sprite(Assets.sprites.buckMeditate, 124, 1500);
				this.alive = 2;
				this.rad = 0;
			} else {
				this.spr = new Sprite(Assets.sprites.buckFinal, 104, 800, false);
				this.dy += 1;
				this.x += this.dx;
				this.y += this.dy;
			}
		} else if (this.alive === 2) {
			if (this.rad < 100) {
				this.rad += 0.5
			} else {
				gameObjs.death = new Death("sucess");
				this.alive = 3;
				this.lDy = 0.01;
			}
			gameObjs.death = new Death("sucess");
		} else if (this.alive === 3) {
			this.lDy += 0.01 + ((this.lDy) / 500);
			Level.y += this.lDy;
		}

		this.timer += 1;
		if (this.timer === 100) {
			this.x += 86;
			this.y -= 88;
			this.setSprite(new Sprite(Assets.sprites.buckUnmorph, 140, 800, function() {this.pause = true; this.frNum = 0;}, true));
			Assets.sounds.morph.play();
			Assets.sounds.transform.play();
		} else if (this.timer === 120) {
			gameObjs.bossGreen = new Boss("green", -Level.x + 750, -385);
			gameObjs.bossBlue = new Boss("blue", -Level.x + 930, -400);
			gameObjs.bossRed = new Boss("red", -Level.x + 850, -370);
		} else if (this.timer === 140) {
			this.y -= 25;
			this.x += 50;
			this.setSprite(this.restSpr);
			gameObjs.gemBar.final = true;
		} else if (this.timer === 170) {
			Assets.sounds.fight.volume = 0.6;
			Assets.sounds.fight.play();
		} else if (this.timer === 200) {
			gameObjs.bossGreen.Attack();
		} else if (this.timer === 300) {
			gameObjs.bossGreen.attack = 3;
			gameObjs.mash.stop();
		} else if (this.timer === 350) {
			if (!gameObjs.death) {
				gameObjs.bossBlue.Attack();
			}
		} else if (this.timer === 450) {
			if (!gameObjs.death) {
				gameObjs.bossBlue.attack = 3;
				gameObjs.mash.stop();
			}
		} else if (this.timer === 500) {
			if (!gameObjs.death) {
				gameObjs.bossRed.Attack();
			}
		} else if (this.timer === 600) {
			if (!gameObjs.death) {
				gameObjs.bossRed.attack = 3;
				gameObjs.mash.stop();
			}
		}
	}
	BuckFight.prototype.revive = function() {
		Assets.sounds.conJump.volume = 0.4;
		Assets.sounds.conJump.play();
		this.dy = -25;
		this.dx = 5;
		this.alive = 1;
	}

function Death(state) {
	this.restart = false;
	this.state = state;
	this.timer = 0;
	this.fade = -0.5;
	this.credit1 = new Sprite(Assets.bgs.credits1, 685, 0);
	this.credit2 = new Sprite(Assets.bgs.credits2, 685, 0);
	this.credit3 = new Sprite(Assets.bgs.credits3, 685, 0);
	this.credit4 = new Sprite(Assets.bgs.credits4, 685, 0);
	this.credit5 = new Sprite(Assets.bgs.credits5, 685, 0);
}
	Death.prototype.draw = function() {
		if (this.restart) {
			if (this.fade === 0) {
				delete gameObjs.restarter;
			} else {
				ctx.save();
					document.getElementById("buttons").style.opacity = this.fade;
					ctx.globalAlpha = this.fade;
					ctx.fillRect(-1, -1, 1300, 700);
					this.credit5.draw(-Level.x + 280, -Level.y + 80);
				ctx.restore();
			}
		} else {
			ctx.save();
				if (this.timer === 1150) {
					document.getElementById("buttons").style.pointerEvents = "auto";
					document.getElementById("buttons").style.opacity = "1";
				}
				if (this.state === "fail") {
					ctx.fillStyle = "rgba(0, 0, 0, " + this.fade + ")";
					ctx.fillRect(-1, -1, 1300, 700);
					gameObjs.buck.draw();
					gameObjs.shawn.draw();
				}
				if (this.timer > 1000) {
					ctx.save();
						ctx.globalAlpha = (this.timer - 1000) / 100;
						this.credit5.draw(-Level.x + 280, -Level.y + 80);
					ctx.restore();
				} else if (this.timer > 900) {
					ctx.save();
						ctx.globalAlpha = 1 - ((this.timer - 900) / 100);
						this.credit4.draw(-Level.x + 320, -Level.y + 130);
					ctx.restore();
				} else if (this.timer > 800) {
					ctx.save();
						ctx.globalAlpha = (this.timer - 800) / 100;
						this.credit4.draw(-Level.x + 320, -Level.y + 130);
					ctx.restore();
				} else if (this.timer > 700) {
					ctx.save();
						ctx.globalAlpha = 1 - ((this.timer - 700) / 100);
						this.credit3.draw(-Level.x + 320, -Level.y + 210);
					ctx.restore();
				} else if (this.timer > 600) {
					ctx.save();
						ctx.globalAlpha = (this.timer - 600) / 100;
						this.credit3.draw(-Level.x + 320, -Level.y + 210);
					ctx.restore();
				} else if (this.timer > 500) {
					ctx.save();
						ctx.globalAlpha = 1 - ((this.timer - 500) / 100);
						this.credit2.draw(-Level.x + 320, -Level.y + 210);
					ctx.restore();
				} else if (this.timer > 400) {
					ctx.save();
						ctx.globalAlpha = (this.timer - 400) / 100;
						this.credit2.draw(-Level.x + 320,  -Level.y + 210);
					ctx.restore();
				} else if (this.timer > 300) {
					ctx.save();
						ctx.globalAlpha = 1 - ((this.timer - 300) / 100);
						this.credit1.draw(-Level.x + 320, -Level.y + 210);
					ctx.restore();
				} else if (this.timer > 200) {
					ctx.save();
						ctx.globalAlpha = (this.timer - 200) / 100;
						this.credit1.draw(-Level.x + 320, -Level.y + 210);
					ctx.restore();
				}
			ctx.restore();
		}
	}
	Death.prototype.step = function() {
		if (this.timer > 200 && this.timer < 1000 && (kb.left || kb.right || kb.up || kb.down)) {
			this.timer = 1000;
		}
		if (this.restart) {
			(this.fade > 0) ? this.fade -= 0.01 : this.fade = 0;
		} else {
			(this.fade < 1) ? this.fade += 0.01 : this.fade = 1;
		}
		this.timer += 1;
	}
	Death.prototype.replay = function() {
		this.restart = true;
		Level.load.partOne();
		gameObjs.restarter = this;
		this.fade = 1;
		document.getElementById("buttons").style.pointerEvents = "none";
	}

function Mash() {
	this.sprLR = new Sprite(Assets.sprites.mashlr, 300, 200, false);
	this.sprUD = new Sprite(Assets.sprites.mashud, 300, 200, false);
	this.sprALL = new Sprite(Assets.sprites.mashall, 552, 200, false);
	this.spr = false;
	this.col = null;
	this.left = true;
	this.up = true;
	this.count = 0;
	this.startingG = gameObjs.gemBar.green;
	this.startingB = gameObjs.gemBar.blue
	this.startingR = gameObjs.gemBar.red;
}
	Mash.prototype.draw = function() {
		if (this.col === "red") {
			this.spr.draw(-Level.x + 366, -38);
		} else if (this.col != null) {
			this.spr.draw(-Level.x + 486, -38);
		}
	}
	Mash.prototype.step = function() {
		switch (this.col) {
			case "green":
				if (kb.left && this.left) {
					this.left = false;
					if (gameObjs.gemBar.green > -1) {
						gameObjs.flyGems.push(new FlyGem("green"));
					}
					this.snd("l");
				} else if (kb.right && !this.left) {
					this.left = true;
					this.count += this.startingG;
					this.snd("r");
					if (gameObjs.gemBar.green > -1) {
						gameObjs.flyGems.push(new FlyGem("green"));
					}
					gameObjs.gemBar.green -= 1;
				}
				break;
			case "blue":
				if (kb.up && this.up) {
					this.up = false;
					if (gameObjs.gemBar.blue > -1) {
						gameObjs.flyGems.push(new FlyGem("blue"));
					}
					this.snd("l");
				} else if (kb.down && !this.up) {
					this.up = true;
					this.snd("r");
					this.count += this.startingB;
					if (gameObjs.gemBar.green > -1) {
						gameObjs.flyGems.push(new FlyGem("blue"));
					}
					gameObjs.gemBar.blue -= 1;
				}
				break;
			case "red":
				if (kb.left && this.left && this.up) {
					this.left = false;
					this.snd("l");
					if (gameObjs.gemBar.red > -1) {
						gameObjs.flyGems.push(new FlyGem("red"));
					}
				} else if (kb.up && !this.left && this.up) {
					this.up = false;
					this.snd("r");
					this.count += this.startingR;
					if (gameObjs.gemBar.red > -1) { 
						gameObjs.flyGems.push(new FlyGem("red"));
					}
					gameObjs.gemBar.red -= 1;
				} else if (kb.right && !this.left && !this.up) {
					this.left = true;
					this.snd("l");
					if (gameObjs.gemBar.red > -1) { 
						gameObjs.flyGems.push(new FlyGem("red"));
					}
				} else if (kb.down && this.left && !this.up) {
					this.up = true;
					this.snd("r");
					this.count += this.startingR;
					if (gameObjs.gemBar.red > -1) { 
						gameObjs.flyGems.push(new FlyGem("red"));
					}
					gameObjs.gemBar.red -= 1;
				}
				break;
		}
	}
	Mash.prototype.attack = function(col) {
		this.col = col;
		switch (col) {
			case "green":
				this.spr = this.sprLR;
				break;
			case "blue":
				this.spr = this.sprUD;
				break;
			case "red":
				this.spr = this.sprALL;
				break;
		}
	}
	Mash.prototype.stop = function() {
		console.log(this.count);
		if (this.count > 100) {
			switch (this.col) {
				case "green":
						gameObjs.bossGreen.Die();
					break;
				case "blue":
						gameObjs.bossBlue.Die();
					break;
				case "red":
						gameObjs.bossRed.Die();
					break;
			}
		} else {
			Assets.sounds.lose.volume = 0.4;
			Assets.sounds.lose.play()
			gameObjs.buck.y += 80;
			gameObjs.buck.setSprite(new Sprite(Assets.sprites.buckEnd, 152, 0, false));
			gameObjs.death = new Death("fail");
		}
		this.col = null;
		this.count = 0;
	}
	Mash.prototype.snd = function(side) {
		var snd = new Audio();
		snd.src = (side === "l") ? Assets.sounds.mashl.src : Assets.sounds.mashr.src;
		snd.volume = 0.06;
		snd.play();
	}

function FlyGem(col) {
	this.x = -Level.x + 72 + (Math.random() * 60);
	this.y = -Level.y + 52 + (Math.random() * 70);
	this.setSprite = setSprite;
	this.col = col;
	this.sprites = {
		red : new Sprite(Assets.sprites.gemRed, 30, 800, false),
		green : new Sprite(Assets.sprites.gemGreen, 30, 800, false),
		blue : new Sprite(Assets.sprites.gemBlue, 30, 800, false)
	}
	switch(this.col) {
		case("green"):
			this.setSprite(this.sprites.green);
			this.dx = (this.x - gameObjs.bossGreen.x - 100) / 20;
			this.dy = (this.y - gameObjs.bossGreen.y - 120) / 20;
			break;
		case("blue"):
			this.setSprite(this.sprites.blue);
			this.dx = (this.x - gameObjs.bossBlue.x - 100) / 20;
			this.dy = (this.y - gameObjs.bossBlue.y - 120) / 20;
			break;
		case("red"):
			this.setSprite(this.sprites.red);
			this.dx = (this.x - gameObjs.bossRed.x - 100) / 20;
			this.dy = (this.y - gameObjs.bossRed.y - 120) / 20;
			break;
	}
}
	FlyGem.prototype.draw = function() {
		this.spr.draw(this.x, this.y);
	}
	FlyGem.prototype.step = function() {
		switch(this.col) {
			case("green"):
				if (this.y > gameObjs.bossGreen.y + 100) {
					deleteObject(this);
				}
				break;
			case("blue"):
				if (this.y > gameObjs.bossBlue.y + 100) {
					deleteObject(this);
				}
				break;
			case("red"):
				if (this.y > gameObjs.bossRed.y + 100) {
					deleteObject(this);
				}
				break;
		}
		this.y -= this.dy;
		this.x -= this.dx;
	}


function ShawnDead(xIn, yIn, sprIn, xHIn, yHIn, sprHIn) {
	this.x = xIn - 80;
	this.y = yIn - 90;
	this.xH = xHIn;
	this.yH = yHIn;
	this.spr = new Sprite(Assets.sprites.shawnDead, 124, 0);
	this.hatSpr = sprHIn;
	this.alive = 0;
	this.timer = 0;
}
	ShawnDead.prototype.draw = function() {
		this.spr.draw(this.x, this.y);
		ctx.save();
			ctx.translate(this.xH + Level.x, this.yH + Level.y);
			if (this.alive !== 5) {
				ctx.rotate(Math.PI);
				this.hatSpr.draw(-Level.x - (this.hatSpr.width / 2), -Level.y - (this.hatSpr.height / 2));
			}
		ctx.restore();
	}
	ShawnDead.prototype.step = function() {
		if (this.alive === 1) {
			(this.timer === 100) ? this.alive = 2 : this.timer += 1;
		} else if (this.alive === 2) {
			this.spr = new Sprite(Assets.sprites.shawnJumpR, 120),
			Assets.sounds.jump.volume = 0.6;
			Assets.sounds.jump.play();
			this.y -= 70;
			this.dy = -20;
			this.alive = 3;
		} else if (this.alive === 3) {
			if (this.y + this.dy >= 240) {
				this.dy = 0;
				this.y = 240;
				this.spr = new Sprite(Assets.sprites.shawnFinal, 120);
				gameObjs.buck.revive();
				this.alive = 4;
			} else {
				this.dy += 1;
				this.y += this.dy;
			}
		} else if (this.alive === 4) {
			this.xH -= (this.xH - (gameObjs.buck.x + 120)) / 5;
			this.yH -= (this.yH - gameObjs.buck.y) / 5;
			if ((Math.abs(this.xH - (gameObjs.buck.x + 120)) < 100) && (Math.abs(this.yH - gameObjs.buck.y) < 100)) {
				this.alive === 5;
			}
		}
	}
	ShawnDead.prototype.revive = function() {
		gameObjs.buck.spr.togglePause();
		this.alive = 1;
	}

function Boss(col, x, y) {
	this.setSprite = setSprite;
	this.col = col;
	switch(col) {
		case "green":
			this.restSpr = new Sprite(Assets.sprites.bossFinalGreen, 180, 800);
			this.attackSpr = new Sprite(Assets.sprites.attackGreen, 218, 200);
			this.setSprite(this.restSpr);
			this.spr.frNum += 1;
			break
		case "blue":
			this.restSpr = new Sprite(Assets.sprites.bossFinalBlue, 180, 800);
			this.attackSpr = new Sprite(Assets.sprites.attackBlue, 260, 200);
			this.setSprite(this.restSpr);
			break;
		case "red":
			this.restSpr = new Sprite(Assets.sprites.bossFinalRed, 180, 800);
			this.attackSpr = new Sprite(Assets.sprites.attackRed, 280, 200);
			this.setSprite(this.restSpr);
			this.spr.frNum += 2;
			break;
	}
	this.x = x;
	this.y = y;
	this.dy = 0;
	this.dx = 0;
	this.attack = 0;
	this.bounce = 0;
	this.timer = 0;
}
	Boss.prototype.draw = function() {
		if(this.flip) {
			ctx.save();
			ctx.scale(1, -1);
			ctx.translate(50, -680);
			this.spr.draw(this.x, this.y);
			ctx.restore();
		} else {
			this.spr.draw(this.x, this.y);
		}
	}
	Boss.prototype.step = function() {
		switch (this.attack) {
			case 0:
				this.dy += 1.5;
				if (this.y + this.dy > 220) {
					this.y = 220;
					this.dy = 0;
					this.dx = 0;
				}
				break;
			case 1:
				if (this.x > gameObjs.buck.x) {
					this.dx -= 2;
					this.dy += 1;
				} else {
					this.dx = 0;
					this.dy = 0;
					this.x -= 38;
					this.y -= 2;
					this.setSprite(this.attackSpr);
					gameObjs.mash.attack(this.col);
					gameObjs.buck.spr = gameObjs.buck.cowarSpr;
					Assets.sounds.gShoot.volume = 1;
					Assets.sounds.gShoot.play();
					this.attack = 2;
				}
				break;
			case 2:
				this.bounce += 1;
				this.y += Math.sin(this.bounce) * 5;
				break;
			case 3:
				this.dy = -10;
				this.dx = 10;
				this.setSprite(this.restSpr);
				if (!gameObjs.death) {
					gameObjs.buck.spr = gameObjs.buck.restSpr;
				}
				this.attack = 0;
				break;
			case 4:
				this.dy -= 2;
				if (this.y < -200) {
					deleteObject(this);
				}
				break;
			case 5:
				if (this.x > gameObjs.buck.x + 100) {
					this.dx -= 3;
					this.dy += 1;
				} else {
					this.dx = 0;
					this.dy = 0;
					this.x -= 38;
					this.y -= 2;
					this.setSprite(this.attackSpr);
					gameObjs.mash.attack(this.col);
					gameObjs.buck.spr = gameObjs.buck.cowarSpr;
					this.attack = 6;
				}
				break;
			case 6:
				this.bounce += 1;
				this.x += Math.sin(this.bounce) * 5;
				break;
			case 7:
				this.setSprite(this.attackSpr);
				gameObjs.buck.spr = gameObjs.buck.cowarSpr;
				this.bounce = 0;
				this.attack = 8;
				this.up = 8;
				gameObjs.bullets = [];
				break;
			case 8:
				this.timer += 1;
				this.timer %= 3;
				if (this.timer === 0) {
					if (Math.abs(this.bounce) >= 10) {
						this.up *= -1;
					}
					this.bounce += this.up;
					gameObjs.bullets.push(new Bullet(this.x + 36, this.y + 84, "final", this.bounce));
				}

		}
		this.y += this.dy;
		this.x += this.dx;
	}
	Boss.prototype.Attack = function() {
		if (this.col === "green") {
			this.attack = 1;
			this.dy = -17;
		} else if (this.col === "blue") {
			Assets.sounds.bShoot.play();
			this.attack = 5;
			this.dy = -11; 
		} else {
			Assets.sounds.rShoot.play();
			this.attack = 7;
			gameObjs.mash.attack(this.col);
		}
	}
	Boss.prototype.Die = function() {
		gameObjs.buck.spr = gameObjs.buck.restSpr;
		if (this.col === "red") {
			this.setSprite(new Sprite(Assets.sprites.finalDeath, 180, 1000, function() {gameObjs.shawn.revive(); delete gameObjs.bossRed}, false));
			Assets.sounds.rDeath.volume = 0.6;
			Assets.sounds.rDeath.play();
			this.attack = 10;
		} else {
			Assets.sounds.gDeath.volume = 0.6;
			Assets.sounds.bDeath.volume = 0.3;
			(this.col === "green") ? Assets.sounds.gDeath.play() : Assets.sounds.bDeath.play();
			this.setSprite(this.restSpr);
			this.flip = true;
			this.dy = 20;
			this.attack = 4;
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

function Gem(xIn, yIn, colour, final) {
	this.final = final;
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
			this.snd.volume = 0.1;
			break;
		case("green"):
			this.setSprite(this.sprites.green);
			this.snd.src = Assets.sounds.gemGreen.src;
			this.snd.volume = 0.1;
			break;
		case("blue"):
			this.setSprite(this.sprites.blue);
			this.snd.src = Assets.sounds.gemBlue.src;
			this.snd.volume = 0.1;
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
				ctx.arc(this.x + 14 + Level.x, this.y + 11 + Level.y, this.rad, 0, 2 * Math.PI, false);
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
		if (this.final === true) {
			if ((this.colour === "green" && Level.x + this.x < 600) ||
				(this.colour === "blue" && Level.x + this.x < 750) ||
				(this.colour === "red" && Level.x + this.x < 900)) {
				this.y += 5;
				this.x += 5;
			}
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
	if (dyIn > 0) {
		this.snd = new Audio();
		if (this.x < 400) {
			this.snd.src = Assets.sounds.firel.src;
		} else if (this.x > 800) {
			this.snd.src = Assets.sounds.firer.src;
		} else {
			this.snd.src = Assets.sounds.firec.src;
		}
		this.snd.volume = 0.1;
	}
	this.x = xIn;
	this.y = yIn;
	this.dy = (dyIn) ? dyIn : 0;
	this.setSprite = setSprite;
	this.sound = false;
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
		}

		if (this.dy !== 0 && this.sound === false && gameObjs.buck.y - this.y < 300) {
			this.snd.play();
			this.sound = true;
		}

		if (-Level.y + 700 < this.y) {
			deleteObject(this);
		}
	}

function GemBar() {
	this.red = -1;
	this.blue = -1;
	this.green = -1;
	this.sf = 0;
	this.final = false;
}
	GemBar.prototype.draw = function() {
		ctx.save();
		if (this.final) {	
			if (gameObjs.buck.rad === 0) {		
				ctx.scale(1 + (0.5 * this.sf), 1 + (0.5 * this.sf));
				(this.sf < 1) ? this.sf += 0.05 : this.sf = 1;
			} else {
				ctx.globalAlpha = 1 - (gameObjs.buck.rad / 100);
			}
		}

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


function Whale(xIn, yIn, dirIn, final) {
	this.final = final;
	this.x = xIn;
	this.y = yIn;
	this.dir = dirIn;
	this.sound = false;
	this.setSprite = setSprite;	
	Assets.sounds.whalel.volume = 0.4;
	Assets.sounds.whaler.volume = 0.4;

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
		if (this.final != true) {
			//Trigger move left
			if (-Level.y - this.y < 300) {
				this.x += 5 * this.dir;
				this.g1.x += 5 * this.dir;
				this.g2.x += 5 * this.dir;
				this.g3.x += 5 * this.dir;
			}

			if (this.y > -Level.y - 100 && !this.sound) {
				(this.dir) ? Assets.sounds.whalel.play() : Assets.sounds.whaler.play();
				Assets.sounds.whaler.play();
				this.sound = true;
			}

			//Collision with Buck
			if (gameObjs.buck.x + gameObjs.buck.edge.left < this.x + 450 && gameObjs.buck.x + gameObjs.buck.edge.right  > this.x + 20 &&
				gameObjs.buck.y + gameObjs.buck.edge.top  < this.y + 200 && gameObjs.buck.y + gameObjs.buck.edge.bottom > this.y + 50 ) {
					gameObjs.buck.hit(2);
			}
			
			if (-Level.y + 700 < this.y) {
				deleteObject(this);
			}
		} else {
			if (Math.abs(this.y - gameObjs.buck.x)) {
				Assets.sounds.whaler.play();
			}
		}
	}

function Monk(colIn) {
	this.setSprite = setSprite;
	this.col = colIn;
	this.shootWait = 0;
	gameObjs.bullets = [];

	switch(this.col) {
		case "green":
				var xOff = 2000,
					yOff = 0,
					sw = 218,
					strtWobble = 0; 
				this.xStrt = 1000;
				this.restSpr = new Sprite(Assets.sprites.bossGreen, sw, 400);
				this.shootSpr = new Sprite(Assets.sprites.bossGreenShoot, sw, 400, function() { gameObjs.monkG.setSprite(gameObjs.monkG.restSpr); });
				this.shootTime = function() { this.rate = 20 + Math.round(100 * Math.random()); }
				this.shootFunc = function() {
					Assets.sounds.gShoot.volume = 0.2;
					Assets.sounds.gShoot.play();
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
				break;
		case "blue":
			var xOff = 5000,
				yOff = 420,
				sw = 256,
				strtWobble = 3.2; 
			this.xStrt = 900;
			this.restSpr = new Sprite(Assets.sprites.bossBlue, sw, 400);
			this.shootSpr = new Sprite(Assets.sprites.bossBlueShoot, sw, 400, function() { gameObjs.monkB.setSprite(gameObjs.monkB.restSpr); });
			this.blueFire = 0;
			this.shootTime = function() { this.rate = 50 + Math.round(100 * Math.random()); }
			this.shootFunc = function() {
				Assets.sounds.bShoot.volume = 0.1;
				Assets.sounds.bShoot.play();
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
			var xOff = 9000,
				yOff = 190,
				sw = 228,
				strtWobble = 1.6; 
			this.xStrt = 800;
			this.restSpr = new Sprite(Assets.sprites.bossRed, sw, 400);
			this.shootSpr = new Sprite(Assets.sprites.bossRedShoot, sw, 400, function() { gameObjs.monkR.setSprite(gameObjs.monkR.restSpr); });
			this.shootTime = function() { this.rate = 50 + Math.round(100 * Math.random()); }
			this.shootFunc = function() {
				Assets.sounds.rShoot.volume = 0.1;
				Assets.sounds.rShoot.play();
				gameObjs.bullets.push(new Bullet(this.x - 5, this.y + 209, "red"));
				gameObjs.bullets.push(new Bullet(this.x - 5, this.y + 209, "red"));
				this.setSprite(this.shootSpr);
				this.shootTime();
			}
			break;
	}

	this.x =  Level.x + xOff;
	this.y = -Level.y + yOff;
	this.wobble = strtWobble;
	this.shootTime();
	this.setSprite(this.restSpr);
}
	Monk.prototype.draw = function() {
		this.spr.draw(this.x, this.y);
	}
	Monk.prototype.step = function() {
		if (Level.x > -11000) {
			if (this.x + Level.x < this.xStrt) {
				this.x += 5;
			}

			this.wobble += 0.05;
			this.y += Math.sin(this.wobble) * 10;

			if (this.x + Level.x < 1500) {
				this.shootWait += 1;
				this.shootWait %= this.rate;
				if (this.shootWait === 0) {
					this.shootFunc();
				}
			}
		} else {
			this.x -= 15;
			this.y += ((gameObjs.buck.y - this.y) / 16);
			Assets.sounds.aShoot.volume = 0.2;
			Assets.sounds.aShoot.play();
			Assets.sounds.space.pause();
			if (this.x < gameObjs.buck.x && this.col === "green") {
				gameObjs.buck = new BuckDead(gameObjs.buck.x, gameObjs.buck.y, gameObjs.buck.dx, gameObjs.buck.dy);
			}
			if (this.x + Level.x < -200) {
				deleteObject(this);
			}
		}

		//Collision with Buck
		if (gameObjs.buck.x + gameObjs.buck.edge.left < this.x + 100 && gameObjs.buck.x + gameObjs.buck.edge.right > this.x + 50 &&
			gameObjs.buck.y + gameObjs.buck.edge.top  < this.y + 190 && gameObjs.buck.y + gameObjs.buck.edge.bottom > this.y + 10 &&
			Level.x > -11000) {
				gameObjs.buck.hit(2);
		}
	}

function Bullet(xIn, yIn, col, ang) {
	this.x = xIn;
	this.y = yIn;

	switch(col) {
		case "green":
			this.col = "#21E82E";
			this.w = 15;
			this.l = 0;
			this.dx = 20;
			this.dy = 0;
			break;
		case "blue":
			this.col = "#2146E8";
			this.w = 7;
			this.l = 10;
			this.dx = 20;
			this.dy = 0;
			break;
		case "red":
			this.col = "#E82E21";
			this.w = 10;
			this.l = 25;
			this.dx = 8;
			this.dy = Math.random() * 62;
			break;
		case "final":
			this.col = "#FF5200";
			this.w = 15;
			this.l = 0;
			this.dx = 30;
			this.dy = ang;
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
		} else {
			this.y += this.dy;
		}

		if (this.x < -Level.x) {
			deleteObject(this);
		}

		//Collision with Buck
		if (gameObjs.buck.x + gameObjs.buck.edge.left < this.x + 100 && gameObjs.buck.x + gameObjs.buck.edge.right > this.x &&
			gameObjs.buck.y + gameObjs.buck.edge.top  < this.y && gameObjs.buck.y + gameObjs.buck.edge.bottom > this.y + 10 ) {
				if (this.col !== "#FF5200") {
					gameObjs.buck.hit(1);
				}
				deleteObject(this);
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