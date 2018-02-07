var windowWidth = 1000;
var windowHeight = 1000;
var game = new Phaser.Game(windowWidth, windowHeight, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, update: update, render: render });

var cameraGroup;

var ptmRatio = 50;

var viewScale = 50000000 / ptmRatio; //1,000,000 meters per pixel, ie 50,000,000 meters for every 50 pixels
var originalViewScale = viewScale;

var secondsPerTick = 86400 / 60; //1 day == 86400 seconds.

function preload() {
//     game.load.image('arrow', 'assets/sprites/arrow.png');
    game.load.image('ball', 'assets/sprites/shinyball.png');
}

function AstronomicalBody() {
	var radius; //in meters

	var velocityX;
	var velocityY;

	var sprite;

	var distanceFromParent; //in meters
}

var earth;
var moon;

var G = 6.67384e-11;
var GMmEarthMoonPair = 2.9284721e37;

var pathData;

function create() {
    game.physics.startSystem(Phaser.Physics.BOX2D);

    game.physics.box2d.ptmRatio = ptmRatio;
	
	game.time.advancedTiming = true;
    game.time.desiredFps = 60;

    game.stage.backgroundColor = '#000000';

    cameraGroup = game.add.group();
	
	pathData = game.add.bitmapData(windowWidth, windowHeight);
    pathData.context.fillStyle = '#ffffff';
    var bg = game.add.sprite(0, 0, pathData);

	//initialize earth
    earth = new AstronomicalBody();
   	earth.radius = 6371000; //meters
   	earth.velocityX = 0;
   	earth.velocityY = 0;

// 	earth.sprite = game.physics.box2d.createCircle(game.width / 2, game.height / 2, earth.radius / viewScale);
	earth.sprite = game.add.sprite(game.width / 2, game.height / 2);
	cameraGroup.add(earth.sprite);
	game.physics.box2d.enable(earth.sprite);
	earth.sprite.body.setCircle(earth.radius / viewScale);
	earth.sprite.body.mass = 5.972e24;

	//initialize moon
   	moon = new AstronomicalBody();
   	moon.radius = 1737000; //meters
	moon.distanceFromParent = 384400000; //meters
	moon.velocityX = 0;
	moon.velocityY = 500; //meters per second

//  moon.sprite = game.physics.box2d.createCircle(game.width / 2 + (moon.distanceFromParent / viewScale), game.height / 2, moon.radius / viewScale);
	moon.sprite = game.add.sprite(earth.sprite.body.x + (moon.distanceFromParent / viewScale), earth.sprite.body.y);
	cameraGroup.add(moon.sprite);
   	game.physics.box2d.enable(moon.sprite);
   	moon.sprite.body.setCircle(moon.radius / viewScale);
   	moon.sprite.body.mass = 7.3476e22;
//    	moon.sprite.body.velocity.y = moon.velocity / viewScale;


	cameraGroup.forEach(function(item) {
		item.scaleMin = null;
		item.scaleMax = null;
	}, this);

	game.camera.bounds = false;
//     game.camera.follow(moon.sprite, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);
    game.camera.deadzone = new Phaser.Rectangle(windowWidth / 2, windowHeight / 2, 1, 1);

	game.input.onDown.add(zoom, this);
}

function update() {
// 	accelerateToObject(earth, moon);
// 	accelerateToObject(moon, earth);

	pathData.context.fillRect(moon.sprite.centerX, moon.sprite.centerY, 1, 1);
	pathData.context.fillRect(earth.sprite.centerX, earth.sprite.centerY, 1, 1);
    pathData.dirty = true;
}

function render() {
	game.debug.box2dWorld();
}

function zoom(pointer) {
	var newViewScale = viewScale * 0.90;
	var scale = originalViewScale / newViewScale;

	//recalculate scale of moon
	recalculateScale(newViewScale);

	//resize objects in camera accordingly
	scaleObjects(scale);

	var earthX = earth.sprite.body.x;
	var earthY = earth.sprite.body.y;

	var moonX = moon.sprite.body.x;
	var moonY = moon.sprite.body.y;

	earth.sprite.body.setCircle(earth.radius / newViewScale);
	moon.sprite.body.setCircle(moon.radius / newViewScale);
	
	earth.sprite.body.x = earthX;
	earth.sprite.body.y = earthY;

	moon.sprite.body.x = moonX;
	moon.sprite.body.y = moonY;

	viewScale = newViewScale;
}

function recalculateScale(newViewScale) {
	//learn how to resize things in animation
// 	earth.sprite.body.setCircle(earth.radius / viewScale);
// 	moon.sprite.body.setCircle(moon.radius / viewScale);

	//move moon to new position
	var obj1CentX = moon.sprite.centerX;
    var obj1CentY = moon.sprite.centerY;
	
	var obj2CentX = earth.sprite.centerX;
	var obj2CentY = earth.sprite.centerY;
	
    var dx = (obj1CentX - obj2CentX);
    var dy = (obj1CentY - obj2CentY);

    var dist = Phaser.Math.distance(obj1CentX, obj1CentY, obj2CentX, obj2CentY) * viewScale;
	
	var theta = Math.atan2(dy, dx);
	
	moon.sprite.body.x = earth.sprite.body.x + (dist / newViewScale) * Math.cos(theta);
	moon.sprite.body.y = earth.sprite.body.y + (dist / newViewScale) * Math.sin(theta);
}

function scaleObjects(cameraScale){
	cameraGroup.forEach(function(item) {
		var scaleTween = game.add.tween(item.scale).to({
	    	x: cameraScale,
	    	y: cameraScale,
		}, 200, Phaser.Easing.Quadratic.IN, true);
	}, this);
}

function accelerateToObject(obj1, obj2) {   
    // Find direction to target
    var obj1CentX = obj1.sprite.centerX;
    var obj1CentY = obj1.sprite.centerY;
	
	var obj2CentX = obj2.sprite.centerX;
	var obj2CentY = obj2.sprite.centerY;
	
    var dx = (obj1CentX - obj2CentX);
    var dy = (obj1CentY - obj2CentY);

    var dist = Phaser.Math.distance(obj1CentX, obj1CentY, obj2CentX, obj2CentY) * viewScale;

    var distSquared = Math.pow(dist, 2);

    var force = GMmEarthMoonPair / distSquared;

	var theta = Math.atan2(dy, dx);

    var forceX = force * Math.cos(theta);
    var forceY = force * Math.sin(theta);

    var dt = secondsPerTick;

	obj2.velocityX += forceX / obj2.sprite.body.mass * dt;
	obj2.velocityY += forceY / obj2.sprite.body.mass * dt;
	
	obj2.sprite.body.x += obj2.velocityX * dt / viewScale;
	obj2.sprite.body.y += obj2.velocityY * dt / viewScale;
}