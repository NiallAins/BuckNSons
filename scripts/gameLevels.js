var gameObjs;

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
				{src : Assets.bgs.levelOneBg, z : -1, x: 0, y: -7356, plX : 1, plY : 0.5},
				{src : Assets.bgs.levelOne, z : -1, x: 0, y: 0, plX : 1, plY : 1}
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
			gameObjs.gems = [
				new Gem(600, -1000, "green"),
				new Gem(600, -1300, "blue"),
				new Gem(600, -1600, "red"),
				new Gem(200, -2400, "green"),
				new Gem(300, -2500, "green"),
				new Gem(500, -2700, "blue"),
				new Gem(600, -2800, "blue"),
				new Gem(800, -3000, "red"),
				new Gem(900, -3100, "red")
			]
			gameObjs.bigGemRed  = new BigGem(1190, 320, "red");
			gameObjs.bigGemGreen  = new BigGem(40, 320, "green");
			gameObjs.bigGemBlue  = new BigGem(600, 20, "blue");
			gameObjs.whale1 = new Whale(-400, -6800);
			gameObjs.whale2 = new Whale(-400, -8000);
			gameObjs.whale3 = new Whale(-400, -9000);
			gameObjs.whale4 = new Whale(-500, -9500);
			gameObjs.whale5 = new Whale(-500, -10000);
			gameObjs.gemBar = new GemBar();
		}
	}
}