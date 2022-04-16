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
  isCooking = false;
  cookingPositionIndex = -1;
  timeCooked = 0;
  isCollected = false;

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
  update() {
    if (this.isCollected) {
      
    }
 
    else if (!this.isCooking) {
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
      if (this.sprite.y > HEIGHT + this.sprite.height) {
        //destroy
      }
    } 
  }
  startCooking(cookingPosition) {
    this.angularMomentum = 0;
    this.sprite.rotation = 0;
    this.xMomentum = 0;
    this.yMomentum = 0;
    this.isCooking = true;
    this.sprite.position.set(cookingPosition[0], cookingPosition[1]);
    this.cookingPositionIndex = cookingPosition[2];
  }
  stopCooking() {
    this.isCooking = false;
    let cookingPos = this.cookingPositionIndex;
    this.cookingPositionIndex = -1;
    return cookingPos;
  }
  bounce() {
    this.yMomentum *= -0.5;
  }
  collect() {
    this.angularMomentum = 0;
    this.sprite.rotation = 0;
    this.xMomentum = 0;
    this.yMomentum = 0;
    this.isCollected = true;
  }
}

class Indicator {
  constructor() {
    this.sprite = new PIXI.Sprite.from('./images/indicator.png');
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.position.set(-50, 30);
  }
}
class BBQ {
  width = 512;
  isBusy = [false, false, false];
  hitboxYStart = HEIGHT - 180;
  hitboxYEnd = HEIGHT - 100;
  constructor(x) {
    this.sprite = new PIXI.Sprite.from('./images/BBQ-grill2.png');
    this.sprite.anchor.set(0, 1);
    this.sprite.position.set(x, HEIGHT);
    game.stage.addChild(this.sprite);
    this.hitboxXStart = x;
  }
  // returns an array [cookingPositionX, cookingPositionY, cookingPositionIndex]. 
  // if hitbox not encountered, returns -1 instead
  // if hitbox encountered but busy, returns -2 instead
  hitboxCollided(x, y) { 
    if (y > this.hitboxYEnd || y < this.hitboxYStart) {return -1;}
    this.hitboxWidth = this.width / this.isBusy.length;
    for (let i = 0; i < this.isBusy.length; i++) {
      let isBiggerThanMinX = x > this.hitboxXStart + this.hitboxWidth * i;
      let isSmallerThanMaxX =  x <= this.hitboxXStart + this.hitboxWidth * (i + 1);
      let indexNotBusy = !this.isBusy[i];
      if (isBiggerThanMinX && isSmallerThanMaxX) {
        if (indexNotBusy) {
          this.isBusy[i] = true;
          return [this.hitboxXStart + this.hitboxWidth * (i + 0.5) , this.hitboxYStart - 1 , i]; 
        }
        return -2;
      }
    }
    return -1;
  }
  stopCooking(index) {
    this.isBusy[index] = false;
  }
}
class Plate {

  constructor(x, y) {
    this.sprite = new PIXI.Sprite.from("./images/meatslab.jpg");
    this.sprite.position.set(x, y);
    this.sprite.width = 100;
    this.sprite.height = 100;
    game.stage.addChild(this.sprite);
  }
  hitboxCollided(x, y) {
    let isWithinHitboxX = x >= this.sprite.position.x && x <= this.sprite.position.x + this.sprite.width;
    let isWithinHitboxY = y >= this.sprite.position.y && y <= this.sprite.position.y + this.sprite.height;
    if (isWithinHitboxX && isWithinHitboxY) { return true; }
    return false;
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
    if (food.isCooking) {
      bbq.stopCooking(food.stopCooking());
    }
    let deltaX = pointerPosition.x - food.sprite.x;
    let deltaY = pointerPosition.y - food.sprite.y;
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
      food.xMomentum = - MAXSPEED;
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

let bbq = new BBQ(300);
let plate = new Plate(WIDTH - 200, HEIGHT - 150);

let foodArray = [
  new Food(200, -200, 3, -5, 0.03),
  new Food(100, -500, -2, 0, -0.03),
];

for (let food of foodArray) {
  initializeFoodOnClickEvent(food);
}

game.ticker.add(delta => gameLoop(delta));
function gameLoop(delta) {
  for (let food of foodArray){
    food.update();
    food.updateIndicator();
    cookingPosition = bbq.hitboxCollided(food.sprite.position.x, food.sprite.position.y)
    if (cookingPosition != -1) {
      if (cookingPosition == -2) {
        food.bounce();
      } else {
        food.startCooking(cookingPosition);
      }
    }
    if (plate.hitboxCollided(food.sprite.x, food.sprite.y)) {
      console.log(true);
    }
  }  
  
  debugInfo[0].text = `meat position : (${Math.round(foodArray[0].sprite.x)}, ${Math.round(foodArray[0].sprite.y)})`;
  debugInfo[1].text = `meat momentum : (${foodArray[0].xMomentum.toFixed(1)}, ${foodArray[0].yMomentum.toFixed(1)})`;
  if (pointerPosition == undefined) {
    debugInfo[2].text = "pointer unvailable";
  } else {
    debugInfo[2].text = `cursor position : (${Math.round(pointerPosition.x)}, ${Math.round(pointerPosition.y)})`;
  }
}



//first gamemode: arcade
//bbq on the left, plate on the right,  