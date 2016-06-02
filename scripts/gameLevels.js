var Level = {
	boundarys : [],
	ladders : [],
	bgs : [],
	x : 0,
	y : 0,
	bgX : 0,
	bgY : 0,

	addBoundary : function() {
		for(var i = 0; i < arguments.length; i += 1) {
			arguments[i].slope = (arguments[i].y0 - arguments[i].y1) / (arguments[i].x1 - arguments[i].x0);
			if (typeof arguments[i].type === 'undefined') {
				arguments[i].type = 'solid';
			}
			Level.boundarys.push(arguments[i]);
		}
	},

	//Place objects in level
	load : {
		onlyLevel : function() {
			gameObjs = {};

			//Set level background and view
			Level.x = 0;
			Level.y = 0;

			//Stores level backgrounds and foregrounds
			Level.bgs = [	
				{src : Assets.bgs.levelOne, z : -1, x: 0, y: 0, plX : 1, plY : 1},
			];

			//Stores level boundarys
			Level.boundarys = [],
			Level.addBoundary(
				//Ground
				{x0 : -100, y0 : 598, x1 : 1300, y1 : 598},
				{x0 : -100, y0 : 385, x1 : 130, y1 : 385, type: 'platform'},
				{x0 : 1150, y0 : 385, x1 : 1300, y1 : 385, type: 'platform'},
				{x0 : -15, y0 : 1000, x1 : -15, y1 : 0},
				{x0 : 1300, y0 : 1000, x1 : 1300, y1 : 0}
			);

			//Add level objects
			gameObjs.buck  = new Buck(550, 200);
			gameObjs.shawn = new Shawn(200, 30);
			gameObjs.bigGemGreen  = new BigGem(1190, 320, "green");
			gameObjs.bigGemRed  = new BigGem(40, 320, "red");
			gameObjs.bigGemBlue  = new BigGem(600, 20, "blue");
			gameObjs.bar = new GemBar();
		}
	}
}