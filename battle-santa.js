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

    constructor(displayInfo, loadedSnowball) {
        this.displayInfo = displayInfo;
        this.nextAction = null;
	this.loadedSnowball = loadedSnowball;
    }

    get isLoaded() {
	return !this.loadedSnowball.displayInfo.hidden;
    }
    set isLoaded(val) {
	this.loadedSnowball.displayInfo.hidden = !val;
    }

    /** Indicates that the combatant has selected their next move and is ready for the next turn to resolve. */
    get isReady() {
        return this.nextAction != null;
    }

    getlegalActions() {
        return this.isLoaded ? [ Action.Attack, Action.Defend, Action.Reload ]
            : [ Action.Defend, Action.Reload ];
    }

    isActionLegal(action) {
        return this.isLoaded || action != Action.Attack;
    }

    reset() {
        this.nextAction = null;
    }

    draw(ctx) {
        this.displayInfo.draw(ctx);
	this.loadedSnowball.draw(ctx);
    }
}

class Grinch extends Combatant {

    constructor(grinchImg, snowballImg) {
        let displayInfo = new DisplayInfo(grinchImg, 1000, 0);
	let snowballDisplayInfo = new DisplayInfo(snowballImg, 1000, 525);
	let snowball = new Snowball(snowballDisplayInfo);
        super(displayInfo, snowball);
    }

    pickMove() {
        legalActions = this.getlegalActions();
        pickIndex = getRandomInt(legalActions.length - 1);
        return legalActions[pickIndex];
    }
}

class Santa extends Combatant {

    constructor(santaImg, snowballImg) {
        let displayInfo = new DisplayInfo(santaImg, 0, 300);
	let snowballDisplayInfo = new DisplayInfo(snowballImg, 525, 825);
	let snowball = new Snowball(snowballDisplayInfo);
        super(displayInfo, snowball);
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
        this.grinch = new Grinch(grinchImg, snowballImg);
        this.santa = new Santa(santaImg, snowballImg);
        this.ctx = graphicsContext;
    }

    draw() {
        this.grinch.draw(this.ctx);
        this.santa.draw(this.ctx);
    }
}

function main() {
    let ctx = document.getElementById("canvas").getContext("2d");
    let battleSantaGame = new BattleSantaGame(ctx, grinchImage, santaImage, snowballImage);
    battleSantaGame.draw();
    //ctx.drawImage(santaImage, 0, 300);
    //ctx.drawImage(grinchImage, 1000, 0);
}
