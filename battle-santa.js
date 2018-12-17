/** loading map for image resources */
var imgLoading = [true, true, true];
// indexes into the loading map for each image resource
const SANTA_LOADING_IDX = 0;
const GRINCH_LOADING_IDX = 1;
const SNOWBALL_LOADING_IDX = 2;

/** Functor that maps one of the indecies above to a call-back for the "load" event. */
function onloadFunctor(id) {
    return () => {
        imgLoading[id] = false;
        if (!imgLoading.some(loading => loading)) main();
    }
}

// Our image resources.
var santaImage = new Image();
santaImage.addEventListener("load", onloadFunctor(SANTA_LOADING_IDX));
santaImage.src = "santa.png";

var grinchImage = new Image();
grinchImage.addEventListener("load", onloadFunctor(GRINCH_LOADING_IDX));
grinchImage.src = "grinch.png";

var snowballImage = new Image();
snowballImage.addEventListener("load", onloadFunctor(SNOWBALL_LOADING_IDX));
snowballImage.src = "snowball.png";

/**
 * Helper function for generating a random integer between min and max inclusively
 * @param {number} max Upper boudn for the randomly generated int.
 * @param {number} min Lower bound for the randomly generated int.
 */
function getRandomInt(max, min = 0) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Enum for the actions a combatant can take. */
var Action = {
    Attack: 1,
    Defend: 2,
    Reload: 3
};

class Menu {

    constructor() {
        this.throwButton = document.getElementById("throw");
        this.dodgeButton = document.getElementById("dodge");
        this.packButton = document.getElementById("pack");
    }
}

/** Basic info needed for displaying objects in the UI. */
class DisplayInfo {
    ///** The source image for the object in the UI. */
    //imgSrc;
    ///** The x-position the object should be drawn at. */
    //pos_x;
    ///** The y-position the object should be drawn at. */
    //pos_y;
    //hidden;

    constructor(imgSrc, pos_x, pos_y, hidden = false) {
        this.imgSrc = imgSrc;
        this.pos_x = pos_x;
        this.pos_y = pos_y;
        this.hidden = hidden;
    }

    /** Draws the image for this object to the UI. */
    draw(ctx) {
        if (!this.hidden) ctx.drawImage(this.imgSrc, this.pos_x, this.pos_y);
    }
}

/** Base class for the grinch and santa */
class Combatant {

    ///** The action this combatant wishes to perform on the next turn. */
    //nextAction = null;
    ///** Indicates if the combatant has reloaded their attack. */
    //isLoaded = true;
    ///** Information necessary to display this combatant in the UI. */
    //displayInfo;

    constructor(displayInfo, loadedSnowball, name) {
        this.displayInfo = displayInfo;
        this.nextAction = null;
	this.loadedSnowball = loadedSnowball;
	this.name = name;
    }

    get isLoaded() {
	return !this.loadedSnowball.displayInfo.hidden;
    }
    load() {
	this.loadedSnowball.displayInfo.hidden = false;
    }
    unload() {
	this.loadedSnowball.displayInfo.hidden = true;
    }

    /** Indicates that the combatant has selected their next move and is ready for the next turn to resolve. */
    get isReady() {
        return this.nextAction != null;
    }

    getlegalActions() {
        return this.isLoaded ? [ Action.Attack, Action.Defend ]
            : [ Action.Defend, Action.Reload ];
    }

    isActionLegal(action) {
        return this.isLoaded || action != Action.Attack;
    }

    reset() {
        this.nextAction = null;
    }

    printAction() {
	switch (this.nextAction) {
	    case Action.Attack:
		console.log(this.name, "chucks a snowball. . .");
		break;
	    case Action.Defend:
		console.log(this.name, "ducks out of the way. . .");
		break;
	    case Action.Reload:
		console.log(this.name, "rolls a fresh snowball. . .");
	}
    }

    draw(ctx) {
        this.displayInfo.draw(ctx);
	this.loadedSnowball.draw(ctx);
    }
}

class Enemy extends Combatant {
    
    constructor(displayInfo, loadedSnowball, name, target) {
	super(displayInfo, loadedSnowball, name);
	this.target = target;
    }

}

class Grinch extends Enemy {

    constructor(grinchImg, snowballImg, target) {
        let displayInfo = new DisplayInfo(grinchImg, 1000, 0);
	let snowballDisplayInfo = new DisplayInfo(snowballImg, 1000, 525);
	let snowball = new Snowball(snowballDisplayInfo);
        super(displayInfo, snowball, "The Grinch", target);
    }

    pickMove() {
	if (!this.target.isLoaded && !this.isLoaded) {
	    this.nextAction = Action.Reload;
	}
        let legalActions = this.getlegalActions();
        let pickIndex = getRandomInt(legalActions.length - 1);
	this.nextAction = legalActions[pickIndex];
    }
}

class Santa extends Combatant {

    constructor(santaImg, snowballImg) {
        let displayInfo = new DisplayInfo(santaImg, 0, 300);
	let snowballDisplayInfo = new DisplayInfo(snowballImg, 525, 825);
	let snowball = new Snowball(snowballDisplayInfo);
        super(displayInfo, snowball, "Santa");
    }

    pickMove(action) {
        this.nextAction = action;
    }
}

class Snowball {

    constructor(displayInfo) {
        this.displayInfo = displayInfo;
    }

    draw(ctx) {
	this.displayInfo.draw(ctx);
    }
}

class BattleSantaGame {

    //grinch = new Grinch();
    //santa = new Santa();

    constructor(graphicsContext, grinchImg, santaImg, snowballImg) {
        this.santa = new Santa(santaImg, snowballImg);
        this.grinch = new Grinch(grinchImg, snowballImg, this.santa);
        this.ctx = graphicsContext;
	this.grinch.pickMove();
    }

    resolveTurn() {
	this.grinch.printAction();
	this.santa.printAction();
	if (this.grinch.nextAction == Action.Attack) {
	    if (this.santa.nextAction != Action.Defend) {
		console.log("You've been hit!");
		alert("You lost");
		this.reset();
	    } else {
		this.grinch.unload();
	    }
	}
	else if (this.santa.nextAction == Action.Attack) {
	    if (this.grinch.nextAction != Action.Defend) {
		console.log("You nailed the grinch right in the face!");
		alert("You won!");
		this.reset();
	    } else {
		this.santa.unload();
	    }
	}
	if (this.santa.nextAction == Action.Reload) {
	    this.santa.load();
	}
	if (this.grinch.nextAction == Action.Reload) {
	    this.grinch.load();
	}
	this.santa.nextAction = null;
	this.grinch.pickMove();
	this.draw();
    }

    reset() {
	this.santa.load();
	this.grinch.load();
	this.grinch.pickMove();
	this.draw();
    }

    draw() {
	this.ctx.clearRect(0,0,1600,900);
        this.grinch.draw(this.ctx);
        this.santa.draw(this.ctx);
    }
}

var battleSantaGame;

function main() {
    let ctx = document.getElementById("canvas").getContext("2d");
    battleSantaGame = new BattleSantaGame(ctx, grinchImage, santaImage, snowballImage);
    battleSantaGame.draw();
    //ctx.drawImage(santaImage, 0, 300);
    //ctx.drawImage(grinchImage, 1000, 0);
}

function action(act) {
    battleSantaGame.santa.pickMove(act);
    battleSantaGame.resolveTurn();
}
