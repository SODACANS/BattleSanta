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
 * @param {number} max Upper bound for the randomly generated int.
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

    constructor(imgSrc, pos_x, pos_y, hidden = false) {
        /** The source image for the object in the UI. */
        this.imgSrc = imgSrc;
        /** The x-position the object should be drawn at. */
        this.pos_x = pos_x;
        /** The y-position the object should be drawn at. */
        this.pos_y = pos_y;
        /** A toggle to affect whether the image should actually be drawn or not. */
        this.hidden = hidden;
    }

    /** Draws the image for this object to the UI. */
    draw(ctx) {
        if (!this.hidden) ctx.drawImage(this.imgSrc, this.pos_x, this.pos_y);
    }
}

class Animation {

    constructor(startDisplayInfos, endDisplayInfos, timeLength, flash = false) {
        this.startDisplayInfos = startDisplayInfos;
        this.endDisplayInfos = endDisplayInfos;
        this.timeLength = timeLength;
        this.startTime = null;
	this.endAnimationPromise = null;
    }

    get isStarted() {
        return this.startTime != null;
    }

    get isComplete() {
	return this.isStarted && this.startTime.getTime() + this.timeLength < Date.now();
    }

    start() {
        this.startTime = new Date();
	let resolver = (resolve) => {
	    if (this.isComplete) {
		resolve(true);	
	    } else {
		setTimeout(() => resolver(resolve), 100);
	    }
	};
	return new Promise(resolver);
    }

    stop() {
	this.startTime = null;
    }

    drawFrame(ctx) {
	for (let i = 0; i < this.startDisplayInfos.length; i++) {
	    let startDisplayInfo = this.startDisplayInfos[i];
	    let endDisplayInfo = this.endDisplayInfos[i];
            if (this.isStarted) {
		let now = Date.now();
            	let x = this.interpolate(startDisplayInfo.pos_x, endDisplayInfo.pos_x, this.startTime.getTime(), Date.now(), this.startTime.getTime() + this.timeLength);
            	let y = this.interpolate(startDisplayInfo.pos_y, endDisplayInfo.pos_y, this.startTime.getTime(), Date.now(), this.startTime.getTime() + this.timeLength);
            	let frameDisplayInfo = new DisplayInfo(startDisplayInfo.imgSrc, x, y, startDisplayInfo.hidden);
            	frameDisplayInfo.draw(ctx);
            } else {
            	startDisplayInfo.draw(ctx);
            }
	}
    }

    interpolate(start, stop, t_0, t, t_final) {
        let s = (t - t_0) / (t_final - t_0);
	// Clamp s between 0 and 1.
	s = Math.max(0, Math.min(1, s));
        return start + s * (stop - start);
    }
}

/** Base class for the grinch and santa */
class Combatant {

    constructor(displayInfo, loadedSnowball, name, attackAnimation, defendAnimation) {
        /** Information necessary to display this combatant in the UI. */
        this.displayInfo = displayInfo;
        /** The action this combatant wishes to perform on the next turn. */
        this.nextAction = null;
        this.loadedSnowball = loadedSnowball;
	this._isLoaded = true;
        this.name = name;
	this.attackAnimation = attackAnimation;
	this.defendAnimation = defendAnimation;
    }

    get isLoaded() {
        return this._isLoaded;
    }
    load() {
        this.loadedSnowball.displayInfo.hidden = false;
	this.attackAnimation.startDisplayInfos[1].hidden = false;
	this.attackAnimation.endDisplayInfos[1].hidden = false;
	this.isLoaded = true;
    }
    unload() {
        this.loadedSnowball.displayInfo.hidden = true;
	this.attackAnimation.startDisplayInfos[1].hidden = true;
	this.attackAnimation.endDisplayInfos[1].hidden = true;
	this._isLoaded = false;
    }

    /** Indicates that the combatant has selected their next move and is ready for the next turn to resolve. */
    get isReady() {
        return this.nextAction != null;
    }

    getlegalActions() {
        return this.isLoaded ? [Action.Attack, Action.Defend]
            : [Action.Defend, Action.Reload];
    }

    isActionLegal(action) {
        return this.isLoaded || action != Action.Attack;
    }

    reset() {
        this.nextAction = null;
    }

    getLogMessageForAction() {
        let message = null;
        switch (this.nextAction) {
            case Action.Attack:
                message = this.isLoaded ? `${this.name} chucks a snowball. . .` : `${this.name} looks really silly trying to throw a non-existent snowball. . .`;
                break;
            case Action.Defend:
                message = `${this.name} ducks out of the way. . .`;
                break;
            case Action.Reload:
                message = `${this.name} rolls a fresh snowball. . .`;
        }
        return message;
    }

    animateAction() {
	if (this.currentActionAnimation) return this.currentActionAnimation.start();
    }

    get currentActionAnimation() {
	if (this.nextAction == Action.Attack) {
	    return this.attackAnimation;
	} else if (this.nextAction == Action.Defend) {
	    return this.defendAnimation;
	}
	return null;
    }

    draw(ctx) {
	this.currentActionAnimation && this.currentActionAnimation.isStarted ? this.currentActionAnimation.drawFrame(ctx) : this.displayInfo.draw(ctx);
        this.loadedSnowball.draw(ctx);
    }
}

class Enemy extends Combatant {

    constructor(displayInfo, loadedSnowball, name, target, attackAnimation, defendAnimation) {
        super(displayInfo, loadedSnowball, name, attackAnimation, defendAnimation);
        this.target = target;
    }

}

class Grinch extends Enemy {

    constructor(grinchImg, snowballImg, target) {
	// Set up resting display info.
        let displayInfo = new DisplayInfo(grinchImg, 1000, 0);

	// Set up reloaded snowball ui indicator.
        let snowballDisplayInfo = new DisplayInfo(snowballImg, 1000, 525);
        let snowball = new Snowball(snowballDisplayInfo);

	// Set up the attack animation.
	let attackEndDI = new DisplayInfo(grinchImg, 900, 0);
	let attackSnowballStartDI = new DisplayInfo(snowballImg, 800, 300);
	let attackSnowballEndDI = new DisplayInfo(snowballImg, 600, 400); 
	let attackAnimation = new Animation([displayInfo, attackSnowballStartDI], [attackEndDI, attackSnowballEndDI], 1000);

	// Set up the defend animation.
	let defendEndDI = new DisplayInfo(grinchImg, 1600, 0);
	let defendAnimation = new Animation([displayInfo], [defendEndDI], 500);

        super(displayInfo, snowball, "The Grinch", target, attackAnimation, defendAnimation);
    }

    pickMove() {
        if (!this.target.isLoaded && !this.isLoaded) {
            this.nextAction = Action.Reload;
            return;
        }
        let legalActions = this.getlegalActions();
        let pickIndex = getRandomInt(legalActions.length - 1);
        this.nextAction = legalActions[pickIndex];
    }
}

class Santa extends Combatant {

    constructor(santaImg, snowballImg) {
	// Set up resting display info.
        let displayInfo = new DisplayInfo(santaImg, 0, 300);

	// Set up reloaded snowball ui indicator.
        let snowballDisplayInfo = new DisplayInfo(snowballImg, 525, 825);
        let snowball = new Snowball(snowballDisplayInfo);

	// Set up the attack animation.
	let attackEndDI = new DisplayInfo(santaImg, 100, 300);
	let attackSnowballStartDI = new DisplayInfo(snowballImg, 550, 600);
	let attackSnowballEndDI = new DisplayInfo(snowballImg, 750, 500);
	let attackAnimation = new Animation([displayInfo, attackSnowballStartDI], [attackEndDI, attackSnowballEndDI], 1000);

	// Set up the defend animation
	let defendEndDI = new DisplayInfo(santaImg, -600, 300);
	let defendAnimation = new Animation([displayInfo], [defendEndDI], 500);

        super(displayInfo, snowball, "Santa", attackAnimation, defendAnimation);
    }

    pickMove(action) {
        this.nextAction = action;
        this.focusCurrentAction();
    }

    focusCurrentAction() {
        switch (this.nextAction) {
            case Action.Attack:
                document.getElementById("throw").focus();
                break;
            case Action.Defend:
                document.getElementById("dodge").focus();
                break;
            case Action.Reload:
                document.getElementById("pack").focus();
                break;
        }
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

    constructor(graphicsContext, grinchImg, santaImg, snowballImg, logRef) {
        this.santa = new Santa(santaImg, snowballImg);
        this.grinch = new Grinch(grinchImg, snowballImg, this.santa);
        this.ctx = graphicsContext;
        this.logRef = logRef;
        this.grinch.pickMove();
    }

    async resolveTurn() {
        this.clearLog();

	// Handle Grinch action.
        this.log(this.grinch.getLogMessageForAction());
	if (this.grinch.nextAction == Action.Attack) this.grinch.loadedSnowball.hidden = true;
        await this.grinch.animateAction();
        if (this.grinch.nextAction == Action.Attack && this.grinch.isLoaded) {
            if (this.santa.nextAction != Action.Defend) {
                this.log("You've been hit!");
                alert("You lost");
                this.reset();
            } else {
                this.grinch.unload();
            }
        }
        if (this.grinch.nextAction == Action.Reload) {
            this.grinch.load();
        }

	// Handle Santa action.
        this.log(this.santa.getLogMessageForAction());
	if (this.santa.nextAction == Action.Attack) this.santa.loadedSnowball.hidden = true;
        await this.santa.animateAction();
        if (this.santa.nextAction == Action.Attack && this.santa.isLoaded) {
	    if (this.grinch.nextAction != Action.Defend) {
            	this.log("You nailed the grinch right in the face!");
            	alert("You won!");
            	this.reset();
	    } else {
		this.santa.unload();
	    }
        }
        if (this.santa.nextAction == Action.Reload) {
            this.santa.load();
        }

	// Reset animation state.
	this.santa.currentActionAnimation.stop();
	this.grinch.currentActionAnimation.stop();

	// Prep moves for next turn.
        this.santa.nextAction = null;
	this.grinch.pickMove();
    }

    reset() {
        this.santa.load();
        this.grinch.load();
	this.clearLog();
        this.grinch.pickMove();
    }

    draw() {
        this.ctx.clearRect(0, 0, 1600, 900);
        this.grinch.draw(this.ctx);
        this.santa.draw(this.ctx);
        window.requestAnimationFrame(() => this.draw());
    }

    log(message) {
        console.log(message);
        this.logRef.innerHTML += `${message}</br>`;
    }

    clearLog() {
        this.logRef.innerHTML = "";
    }
}

var battleSantaGame;

function main() {
    let ctx = document.getElementById("canvas").getContext("2d");
    let log = document.getElementById("log");
    battleSantaGame = new BattleSantaGame(ctx, grinchImage, santaImage, snowballImage, log);
    // Set up event listeners for inputs
    document.addEventListener('keypress', (event) => {
        const key = event.key;
        if (['1', '2', '3'].some(val => val == key)) {
            action(+key);
        }
    });
    window.requestAnimationFrame(() => battleSantaGame.draw());
}

function action(act) {
    battleSantaGame.santa.pickMove(act);
    battleSantaGame.resolveTurn();
}
