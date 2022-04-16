let application = PIXI.Application;
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
let game = new application({
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: 0xAAAAAA,
  transparent: false,
  antialias : true,
});
document.body.appendChild(game.view);
game.renderer.view.style.position = 'absolute';
const GRAPHICS = PIXI.Graphics;

//debug text
let style = new PIXI.TextStyle({
  fontFamily: 'Arial',
  fontSize: 15,
  fill: '#FFFFFF',
  stroke: '#EEEEEE'
});

//food common variables
// hitting the object in the sweet spot vertically gives him the most vertical speed
// the farter from the sweet spot the object is hit vertically the less vertical speed
// the farter from the middle horizontally the object is hit the more the horizontal momentum is affected
let sweetSpot = 10; //pixels
let sweetSpotIncrease = -8; //speed change
let yBaseIncrease = -3; // minimum speed change before distance scaling added
let maxMultiplier = 2.2;
let xBaseIncrease = 4;
let foodDimensions = 100;
const ACCELERATION = 0.1; // pixel/gametick²
const MAXSPEED = 8;

class Food {
  constructor(x, y, xMomentum, yMomentum, angularMomentum) {   
    this.sprite = new PIXI.Sprite.from('./images/meatslab.jpg');
    this.sprite.width = foodDimensions;
    this.sprite.height = foodDimensions;
    this.sprite.position.set(x,y);
    this.sprite.anchor.set(0.5,0.5);
    this.sprite.interactive = true;
    this.xMomentum = xMomentum;
    this.yMomentum = yMomentum;
    this.angularMomentum = angularMomentum;
    this.sprite.rotation = 0;
    this.indicator = new Indicator();
    game.stage.addChild(this.sprite);
    game.stage.addChild(this.indicator.sprite);
  }
  updateIndicator() {
    if (this.sprite.y < 0) {
      this.indicator.sprite.x = this.sprite.x;
    } else {
      this.indicator.sprite.x = -50;
    }
  } 
  updateMomentum() {
    if (this.yMomentum < MAXSPEED - 0.1) {
      this.yMomentum += ACCELERATION;
    }
    this.sprite.x += this.xMomentum;
    this.sprite.y += this.yMomentum;
    this.sprite.rotation += this.angularMomentum;
    if (this.sprite.x < this.sprite.width / 2 || this.sprite.x > WIDTH - this.sprite.width / 2) {
      this.xMomentum *= -1;
      this.angularMomentum *= -1;
    } 
    if (this.sprite.y > HEIGHT - this.sprite.height / 2) {
      this.yMomentum *= -1;
    }
  }
}

class Indicator {
  constructor() {
    this.sprite = new PIXI.Sprite.from('./images/indicator.png')
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.position.set(-50, 30);
    this.sprite.scale.set(4,4)
  }
}

let pointerPosition;
game.stage.interactive = true;
game.stage.on("pointermove", trackPointerPosition);
function trackPointerPosition(e) {
  pointerPosition = e.data.global;
}

function initializeFoodOnClickEvent(food) {
  food.sprite.on('pointerdown', function() {
    let deltaX = pointerPosition.x - food.sprite.x;
    let deltaY = pointerPosition.y - food.sprite.y;
    console.log(deltaX);
    console.log(deltaY);
    if (Math.abs(deltaY) < sweetSpot) {
      food.yMomentum = sweetSpotIncrease;
    } else {
      let momentumIncrease = ((sweetSpotIncrease - yBaseIncrease) * sweetSpot / Math.abs(deltaY) + yBaseIncrease);
      food.yMomentum = momentumIncrease;
    }
    let maxMultiplier = 2.2;
    let momentumScaling = deltaX / (food.sprite.width / 2) * maxMultiplier * food.xMomentum;
    let xBaseIncrease = 4;
    
    if (food.xMomentum >= 0) { 
      food.xMomentum -= momentumScaling + xBaseIncrease;
    } else { 
      food.xMomentum += momentumScaling + xBaseIncrease;
    }
    if (food.xMomentum >= MAXSPEED) {
      food.xMomentum = MAXSPEED;
    } else if (food.xMomentum <= - MAXSPEED) {
      food.xMomentum = - MAXSPEED
    }
  }); 
}


//debug Info
let infoCount = 10;
let debugInfo = new Array();
for (let i = 0; i < infoCount; i++) {
  debugInfo[i] = new PIXI.Text("", style);
}
let debugPos = 0;
for(let t of debugInfo) {
  game.stage.addChild(t);
  t.anchor.x = 1;
  t.position.set(WIDTH - 30, debugPos);
  debugPos += 20;
}

let foodArray = [
  new Food(200, 200, 3, -5, 0.03),
  new Food(100, 500, -2, 0, -0.03),
];

for (let food of foodArray) {
  initializeFoodOnClickEvent(food);
}

game.ticker.add(delta => gameLoop(delta));
function gameLoop(delta) {
  for (let food of foodArray){
    food.updateMomentum();
    food.updateIndicator();
  }  
  
  debugInfo[0].text = `meat position : (${Math.round(foodArray[0].sprite.x)}, ${Math.round(foodArray[0].sprite.y)})`;
  debugInfo[1].text = `meat momentum : (${foodArray[0].xMomentum.toFixed(1)}, ${foodArray[0].yMomentum.toFixed(1)})`;
  if (pointerPosition == undefined) {
    debugInfo[2].text = "pointer unvailable";
  } else {
    debugInfo[2].text = `cursor position : (${Math.round(pointerPosition.x)}, ${Math.round(pointerPosition.y)})`;
  }
}