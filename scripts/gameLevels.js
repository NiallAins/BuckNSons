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
		partOne : function() {
			gameObjs = {};

			//Set level background and view
			Level.x = 0;
			Level.y = 1200;

			//Stores level backgrounds and foregrounds
			Level.bgs = [
				{src : Assets.bgs.partOneBg, z : -1, x: 0, y: -16080, plX : 1, plY : 0.5},
				{src : Assets.bgs.partTwoBg, z : -1, x: 1280, y: -16070, plX : 1, plY : 0.5},
				{src : Assets.bgs.partTwoBg, z : -1, x: 8240, y: -16070, plX : 1, plY : 0.5},
				{src : Assets.bgs.water, z : -1, x: 0, y: 0, plX : 1, plY : 0.6},
				{src : Assets.bgs.partOneFg, z : -1, x: 0, y: -30, plX : 1, plY : 0.8},
				{src : Assets.bgs.platforms, z : -1, x: 0, y: 0, plX : 1, plY : 1}
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

			gameObjs.menu = new Menu();
			gameObjs.buck  = new Buck(550, -400);
			gameObjs.bigGemRed  = new BigGem(1190, 320, "red");
			gameObjs.bigGemGreen  = new BigGem(40, 320, "green");
			gameObjs.bigGemBlue  = new BigGem(600, 20, "blue");
			gameObjs.gemBar = new GemBar();
			/*gameObjs.buck  = new BuckFly(550, -17000);
			Level.y = 16000;
			gameObjs.gemBar.red = 10;
			gameObjs.gemBar.blue = 10;
			gameObjs.gemBar.green = 10;
			gameObjs.gems = [];*/
		},

		partTwo : function() {
			gameObjs.shawn = new Shawn(200, -200);
			gameObjs.gems = [
				new Gem(600, -1000, "green"),
				new Gem(600, -1300, "blue"),
				new Gem(600, -1800, "red"),

				new BadGem(200, -2000),
				new BadGem(300, -2000),
				new BadGem(400, -2000),
				new BadGem(800, -2000),
				new BadGem(900, -2000),
				new BadGem(1000, -2000),

				new Gem(200, -2300, "green"),
				new Gem(300, -2400, "green"),
				new Gem(500, -2600, "blue"),
				new Gem(600, -2700, "blue"),
				new Gem(800, -3000, "red"),
				new Gem(900, -3100, "red"),

				new Gem(100, -3800, "red"),
				new Gem(1200, -4100, "red"),
				new Gem(100, -3900, "blue"),
				new Gem(1200, -4200, "blue"),
				new Gem(100, -4000, "green"),
				new Gem(1200, -4300, "green"),
				new BadGem(20, -3600),
				new BadGem(1280, -3900),
				new BadGem(100, -3700),
				new BadGem(1200, -4000),
				new BadGem(200, -3800),
				new BadGem(1100, -4100),
				new BadGem(300, -3900),
				new BadGem(1000, -4200),

				new BadGem(600, -4800),
				new BadGem(500, -4900),
				new BadGem(700, -4900),
				new BadGem(400, -5000),
				new BadGem(800, -5000),
				new BadGem(300, -5100),
				new BadGem(900, -5100),
				new Gem(600, -4950, "red"),
				new Gem(500, -4700, "blue"),
				new Gem(700, -4700, "blue"),
				new Gem(400, -4800, "blue"),
				new Gem(800, -4800, "blue"),
				new Gem(100, -4900, "green"),
				new Gem(1200, -4900, "green"),

				new Gem(400, -5800, "green"),
				new Gem(600, -6000, "green"),
				new Gem(800, -5800, "green"),
				new Gem(600, -5600, "green"),
				new Gem(600, -5800, "blue"),

				//Whales//

				new BadGem(700, -11400, 8),
				new BadGem(600, -11500, 8),
				new BadGem(500, -11400, 8),
				new Gem(600, -11200, "red"),	

				new Gem(600, -11800, "green"),
				new Gem(600, -12000, "green"),
				new Gem(600, -12200, "green"),
				new Gem(400, -12300, "blue"),
				new Gem(400, -12500, "blue"),
				new Gem(800, -12300, "blue"),
				new Gem(800, -12500, "blue"),
				new Gem(100, -12400, "red"),
				new Gem(100, -12600, "red"),
				new Gem(1100, -12400, "red"),
				new Gem(1100, -12600, "red"),

				new BadGem(100, -12000, 8),
				new BadGem(300, -12100, 8),
				new BadGem(500, -12200, 8),
				new BadGem(700, -12300, 8),
				new BadGem(900, -12400, 8),
				new BadGem(1100, -12500, 8),

				new BadGem(1100, -12700, 8),
				new BadGem(1000, -12700, 8),
				new BadGem(800, -12750, 8),
				new BadGem(700, -12750, 8),
				new BadGem(500, -12800, 8),
				new BadGem(400, -12800, 8),
				new BadGem(200, -12850, 8),
				new BadGem(100, -12850, 8),

				new Gem(0, -14000, "green"),
				new BadGem(100, -14000, 0),
				new BadGem(200, -14000, 0),
				new BadGem(300, -14000, 0),
				new BadGem(400, -14200, 8),
				new Gem(400, -14000, "blue"),
				new BadGem(500, -14000, 0),
				new Gem(600, -14100, "red"),
				new BadGem(600, -14000, 0),
				new Gem(600, -13850, "red"),
				new BadGem(700, -14000, 0),
				new BadGem(800, -14200, 8),
				new Gem(800, -14000, "blue"),
				new BadGem(900, -14000, 0),
				new BadGem(1000, -14000, 0),
				new BadGem(1100, -14000, 0),
				new Gem(1200, -14000, "green"),

				new Gem(300, -14900, "blue"),
				new Gem(400, -15000, "blue"),
				new Gem(500, -14900, "blue"),
				new Gem(400, -14800, "blue"),
				new Gem(400, -14900, "red"),
				new Gem(700, -14900, "blue"),
				new Gem(800, -15000, "blue"),
				new Gem(900, -14900, "blue"),
				new Gem(800, -14800, "blue"),
				new Gem(800, -14900, "red")
			];
			gameObjs.whale1 = new Whale(-200, -6800, 1);
			gameObjs.whale2 = new Whale(1200, -8000, -1);
			gameObjs.whale3 = new Whale(-400, -9000, 1);
			gameObjs.whale4 = new Whale(-200, -9500, 1);
			gameObjs.whale5 = new Whale(1200, -10000, -1);
		},

		partThree : function() {
			gameObjs.monkG = new Monk("green");
			gameObjs.monkB = new Monk("blue");
			gameObjs.monkR = new Monk("red");
		}
	}
}