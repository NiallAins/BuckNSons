var lightEngine = function(outputCan, outputCtx, bgShade) {

	/*******************\
	  PRIVATE VARIABLES 
	\*******************/

	//Initiate main canvas element for drawing shadows and light
	var can0 = document.createElement('canvas');
	var ctx0 = can0.getContext('2d');

	//Initiate working canvas one, for combining light from all sources
	var can1 = document.createElement('canvas');
	var ctx1 = can1.getContext('2d');

	//Initiate working canvas two, for drawing light from a single source
	var can2 = document.createElement('canvas');
	var ctx2 = can2.getContext('2d');

	can0.width = can1.width = can2.width = outputCan.width;
	can0.height = can1.height = can2.height = outputCan.height;


	/******************\
	  Public VARIABLES 
	\******************/

	//All light sources
	S = [];

	//All light blockers
	B = [];

	//All area onwhich no shadows can be cast
	Nc = []


	/*******************\
	  PRIVATE FUNCTIONS 
	\*******************/

	//General Math Functions
	function dist(x0, y0, x1, y1) {
		return Math.sqrt(((x1 - x0) * (x1 - x0)) + ((y1 - y0) * (y1 - y0)));
	}
	function angDiff (a0, a1) {
		var a = a0 - a1;
		a += (a > Math.PI) ? -2 * Math.PI : (a < -Math.PI) ? 2 * Math.PI : 0;
		return a;
	}

	//Light emitting object (x position, y position, brightness [radius of light reach], shade [colour of light in rgb(a)]
	function Source(xIn, yIn, bIn, sIn) {
		this.x = xIn;
		this.y = yIn;
		this.b = bIn;
		this.shade = sIn;
	}
		//Draw light and shadows from source
		Source.prototype.drawLight = function() {
			//corners of blocks which cast shadows
			var c = [];

			for (var i = 0; i < B.length; i++) {
				if (B[i].active) {
					if (B[i].shape === "rect") {
						//Find shadow casting corners of rectangle
						var side = 0;
						if (this.x > B[i].x) {
							side += 1;
						}
						if (this.x > B[i].x + B[i].w) {
							side += 1;
						}
						if (this.y > B[i].y) {
							side += 3;
						}
						if (this.y > B[i].y + B[i].h) {
							side += 3;
						}

						if (side === 1 || side === 2 || side === 3 || side === 6) {
							c.push({x : B[i].x, y : B[i].y});
						}
						if (side === 0 || side === 1 || side === 5 || side === 8) {
							c.push({x : B[i].x + B[i].w, y : B[i].y});
						}
						if (side === 0 || side === 3 || side === 7 || side === 8) {
							c.push({x : B[i].x, y : B[i].y + B[i].h});
						}
						if (side === 2 || side === 5 || side === 6 || side === 7) {
							c.push({x : B[i].x + B[i].w, y : B[i].y + B[i].h});
						}
						//No shaodw if source is inside square
						if (side !== 4) {
							//Add mid point for correct shadow rendering later
							c.push({x : c[c.length - 1].x, y : c[c.length - 1].y});
							c[c.length - 2] = {x : B[i].x + (B[i].w / 2), y : B[i].y + (B[i].h / 2)};
						}
					}
					else {
						//Convert sprite mask to Uint8ClampedArray [R0, G0, B0, A0, ... , Rn, Gn Bn An]
						if (B[i].shape === "anim") {
							ctx2.drawImage(B[i].mask, Math.floor(B[i].frNum) * B[i].w, 0, B[i].w, B[i].h, 0, 0, B[i].w, B[i].h);
						} else {
							ctx2.drawImage(B[i].mask, 0, 0);
						}
						var imgData = ctx2.getImageData(0, 0, B[i].w, B[i].h).data;

						//Get angle between center of object and lihgt source for comparison later
						var normal = Math.atan2(this.y - (B[i].y + (B[i].h / 2)), this.x - (B[i].x + (B[i].w / 2)));

						//No shadow if light source is inside object
						var pixel = (((Math.floor(this.y) - B[i].y) * B[i].w) + (Math.floor(this.x) - B[i].x)) * 4;
						if (this.x - B[i].x < B[i].w && this.x - B[i].x > -1 && pixel > -1 && pixel < imgData.length && imgData[pixel + 3] > 120) {

						} else {
							//Scan all opaque pixels to find largest and smallest angle with source relative to the normal definded above
							var max = -Infinity, min = Infinity, ang = 0, maxP = { x : 0, y : 0 }, minP = { x : 0, y : 0 };
							for(var j = 3, x = 0, y = 0; j < imgData.length; j += 4, x += 1) {
								//Reset x after each row scan
								if (x === B[i].w) {
									x = 0, y += 1;
								}
								//Only consider non-transparent pixels
								if (imgData[j] > 120) {
									ang = angDiff(normal, Math.atan2(this.y - (B[i].y + y), this.x - (B[i].x + x)));
									if (ang > max) {
										max = ang, maxP.x = x + B[i].x, maxP.y = y + B[i].y;
									} else if (ang < min) {
										min = ang, minP.x = x + B[i].x, minP.y = y + B[i].y;
									}
								}
							}
							c.push(minP);
							c.push({x : B[i].x + (B[i].w / 2), y: B[i].y + (B[i].h / 2)});
							c.push(maxP);
							ctx2.clearRect(0, 0, B[i].w + 1, B[i].h + 1);
						}
					}
					if (c.length > 0) {
						//Calculate where shadow edges meet boundary of light
						var ang = Math.atan2(c[c.length - 1].y - this.y, c[c.length - 1].x - this.x);
						c.push({x : this.x + (this.b * 1.1 * Math.cos(ang)), y : this.y + (this.b * 1.1 * Math.sin(ang))});
						ang = Math.atan2(c[c.length - 4].y - this.y, c[c.length - 4].x - this.x);
						c.push({x : this.x + this.b * 1.1 * Math.cos(ang), y : this.y + this.b * 1.1 * Math.sin(ang)});
					}
				}
			}

			if (c.length > 0) {
				//Calcualte the shape of light on working canvas
				//Draw shadows
				ctx2.fillStyle = 'rgba(0, 0, 0, 1)';
				ctx2.beginPath();
					for (var i = 0, ang0, ang1, diff; i < c.length; i += 5) {
						ctx2.moveTo(c[i].x, c[i].y);
						ctx2.lineTo(c[i + 1].x, c[i + 1].y);
						ctx2.lineTo(c[i + 2].x, c[i + 2].y);
						ctx2.lineTo(c[i + 3].x, c[i + 3].y);
						ang0 = Math.atan2(c[i + 3].y - this.y, c[i + 3].x - this.x);
						ang1 = Math.atan2(c[i + 4].y - this.y, c[i + 4].x - this.x);
						ctx2.arc(this.x, this.y, this.b, ang0, ang1, (angDiff(ang0, ang1) > 0) ? true : false);
						ctx2.lineTo(c[i].x, c[i].y);
					}
				ctx2.fill();

				//Subtract block shapes from shadow
				ctx2.globalCompositeOperation = 'destination-out';
				for (var i = 0; i < B.length; i++) {
					if (B[i].active) {
						B[i].subBlock();
					}
				}
				//Subtract no-cast regions from shadow
				for (var i = 0; i < Nc.length; i++) {
					Nc[i].subRegion();
				}
			}

			//Draw Light emitting from source in circuler gradient, subtracting shadows
			ctx2.globalCompositeOperation = 'source-out';
			var grd = ctx2.createRadialGradient(this.x, this.y, 0, this.x , this.y, this.b);
				grd.addColorStop(0, this.shade);
				grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
			ctx2.fillStyle = grd;
			ctx2.fillRect(this.x - this.b, this.y - this.b, this.b * 2, this.b * 2);

			//Add light to light from other sources
			ctx1.drawImage(can2, 0, 0);

			//Reset working canvas
			ctx2.globalCompositeOperation = "source-over";
			ctx2.clearRect(0, 0, can2.width, can2.height);
		}

	//Light blocking object (xIn = x position, yIn = y position, shapeIn = object shape :"rect"/"anim"/"mask";
	//						 if shapeIn = "rect" [p1 = width, p2 = height, p3 = opacity]
	//						 if shapeIn = "anim" [p1 = mask, p2 = frame width, p3 = frame duration, p4 = opacity]
	//						 else				 [p1 = opacity] )
	function Block(xIn, yIn, shapeIn, p1, p2, p3, p4) {
		this.x = xIn;
		this.y = yIn;
		this.active = true;
		this.shape = shapeIn;
		if (shapeIn === "rect") {
			this.w = p1;
			this.h = p2;
			this.o = p3;
		} else if (shapeIn === "anim") {
			this.frNum = 0;
			this.frDur = p3;
			this.length = 0;
			this.mask = p2;
			this.w = p1;
			this.length = p2.width / this.w;
			this.frDur /= this.length;
			this.h = p2.height
			this.o = p4;
			this.backward = false;
			this.pause = false;
		} else {
			this.o = p2;
			this.mask = p1;
			this.w = p1.width;
			this.h = p1.height;
		}
	}
		//Subtract block shape from shadow
		Block.prototype.subBlock = function() {
			if (this.shape === "rect") {
				ctx2.fillRect(this.x, this.y, this.w, this.h);
			} else if (this.shape === "anim") {
				ctx2.drawImage(this.mask, Math.floor(this.frNum) * this.w, 0, this.w, this.h, this.x, this.y, this.w, this.h);
				if (!this.pause) {
					if (!this.backward) {
						this.frNum += dt / this.frDur;
						if (this.frNum >= this.length) {
							this.frNum = 0;
						}
					} else {
						this.frNum -= dt / this.frDur;
						if (this.frNum < 0) {
							this.frNum = this.length - 1;
						}
					}
				}
			} else {
				ctx2.drawImage(this.mask, this.x, this.y);
			}
		}

	function NoCast(xIn, yIn, shapeIn, d1, d2) {
		this.x = xIn;
		this.y = yIn;
		this.shape = shapeIn;
		if (shapeIn === "circ") {
			this.r = d1;
		} else if (shapeIn === "rect") {
			this.w = d1;
			this.h = d2;
		} else {
			this.w = shapeIn.width;
			this.h = shapeIn.height;
		}
	}
		//Subtract region shape from shadow
		NoCast.prototype.subRegion = function() {
			if (this.shape === "rect") {
				ctx2.fillRect(this.x, this.y, this.w, this.h);
			} else {
				ctx2.drawImage(this.shape, this.x, this.y);
			}
		}

	/******************\
	  PUBLIC FUNCTIONS 
	\******************/

	//Add light source to canvas (x position, y position, brightness [radius of light reach], shade [colour of light in rgb(a)]) -> source handle
	this.addSource = function(x, y, b, s) {
		x += Level.x;
		y += Level.y;
		b = typeof b !== 'undefined' ? b : 150;
		s = typeof s !== 'undefined' ? s : 'rgba(0, 0, 0, 1)';
		S.push(new Source(x, y, b, s));

		return S[S.length - 1];
	}

	//Add light blocker to canvas (x position, y position, object shape :"rect"/"anim"/"mask",
	//						 	   rect width/mask opacity, rect height, rect opacity) -> block handle
	this.addBlock = function(x, y, s, p1, p2, p3) {
		x += Level.x;
		y += Level.y;
		if (s === "rect") {
			var h, o;
			if (typeof p3 === 'undefined') {
				if (typeof p2 === 'undefined') {
					h = p1, o = 1;
				} else {
					if (p2 < 1) {
						h = p1, o = p2;
					} else {
						h = p2, o = 1;
					}
				}
			} else {
				h = p2, o = p3;
			}
			B.push(new Block(x, y, s, p1, h, o));
		} else if (s === "anim") {
			var o = typeof p4 !== 'undefined' ? p4 : 1;
			B.push(new Block(x, y, s, p1, p2, p3, o));
	    } else {
	    	var mask = new Image();
	    	mask.src = p1;
	    	var o = typeof p2 !== 'undefined' ? p2 : 1;
	    	mask.onload = function() {
				B.push(new Block(x, y, s, mask, o));
			}
		}

		return B[B.length - 1];
	}

	//Add region to canvas on which no shadows can be cast(x position, y position, region shape :"rect"/mask,
	//						 							   rect width, rect height) -> no-cast handle
	this.addNoCast = function(x, y, s, d1, d2) {
		x += Level.x;
		y += Level.y;
		if (s === "rect") {
			if (typeof d2 === 'undefined') {
				Nc.push(new NoCast(x, y, s, d1, d1));
			} else {
				Nc.push(new NoCast(x, y, s, d1, d2));
			}
		} else {
			Nc.push(new NoCast(x, y, s));
		}

		return Nc[Nc.length - 1];
	}

	//Call draw function of all objects
	this.draw = function() {
		//Clear previous frame
		ctx0.clearRect(0, 0, can.width, can.height);
		ctx1.clearRect(0, 0, can1.width, can1.height);

		//Draw background darkness
		ctx0.fillStyle = bgShade;
		ctx0.fillRect(0, 0, can.width, can.height);

		//Calculate light and shadows for each source and combine
		for (var i = 0; i < S.length; i++) {
			S[i].drawLight();
		}

		//Subtract all light from backgorund darkness
		ctx0.globalCompositeOperation = 'destination-out';
			ctx0.drawImage(can1, 0, 0);
		ctx0.globalCompositeOperation = 'source-over';

		outputCtx.drawImage(can0, 0, 0);
	}

	this.getSources = function() {
		return S;
	}

	this.getBlocks = function() {
		return B;
	}

	this.getNoCasts = function() {
		return Nc;
	}

	this.moveLvl = function(dx, dy) {
		for (var i = 0; i < B.length; i += 1) {
			B[i].x += dx;
			B[i].y += dy;
		}
		for (var i = 0; i < S.length; i += 1) {
			S[i].x += dx;
			S[i].y += dy;
		}
	}

	this.setDarkness = function(value) {
		bgShade = 'rgba(0, 0, 0,' + value + ')';
	}
}