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
		testLevel : function() {
			gameObjs = {};

			//Set level background and view
			Level.x = 0;
			Level.y = 0;

			//Stores level backgrounds and foregrounds
			Level.bgs = [	
				//{src : Assets.bgs.testbg, z : -1, plX : 0.1, plY : 1},
			];

			//Stores level boundarys
			Level.boundarys = [],
			Level.addBoundary(
				//Ground
				{x0 : -100, y0 : 548, x1 : 550, y1 : 548},
				{x0 : 650, y0 : 548, x1 : 3000, y1 : 548},
				//Box top
				{x0 : 550, y0 : 500, x1 : 650, y1 : 500},
				//Box sides
				{x0 : 650, y0 : 547, x1 : 650, y1 : 500},
				{x0 : 550, y0 : 547, x1 : 550, y1 : 500},
				//Right Slope
				{x0 : 765, y0 : 425, x1 : 1061, y1 : 295, type : "platform"},
				//LeftSlopeUp
				{x0 : 299, y0 : 250, x1 : 108, y1 : 312, type : "platform"},
				//LeftSlopeDown
				{x0 : 299, y0 : 250, x1 : 416, y1 : 318, type : "platform"},
				//LeftPlatform
				{x0 : 416, y0 : 318, x1 : 634, y1 : 318, type : "platform"}

			);

			//Add level objects
			gameObjs.shawn = new Shawn(50, 50);
			gameObjs.buck  = new Buck(400, 100);
		}
	}
}