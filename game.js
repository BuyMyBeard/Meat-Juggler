let application = PIXI.Application;
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
let game = new application({
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: 0xAAAAAA,
  transparent: false,
  antialias: true,
});
document.body.appendChild(game.view);
game.renderer.view.style.position = 'absolute';
const GRAPHICS = PIXI.Graphics;
let ticker = PIXI.Ticker.shared;
const FPS = Math.round(ticker.FPS);
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
let sweetSpotMomentum = -8; //speed change
let yBaseSpeed = -3; // minimum speed change before distance scaling added
let maxMultiplier = 2.2;
let xBaseIncrease = 4;
let foodDimensions = 100;
const ACCELERATION = 0.1; // pixel/gametick²
const MAXSPEED = 8;
const MAXROTATIONINCREASE = 0.1;
const MAXDELTAX = 50;
let lives;
class Food {
  isCooking = false;
  cookingPositionIndex = -1;
  isFadingOut = false
  isCollected = false;
  fadePerTick = -0.03;
  maxAngularMomentum = 0.1; 
  framesCooked = 0;
  state = 0; // 0: raw   1: mid   2: done   3: overcooked   4: burning   -1 = unused
  
  constructor(x, y, xMomentum, yMomentum, angularMomentum, textures) {
    this.textures = textures;
    this.sprite = new PIXI.Sprite(textures[this.state]);
    this.sprite.width = foodDimensions;
    this.sprite.height = foodDimensions;
    this.sprite.position.set(x, y);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.interactive = true;
    this.xMomentum = xMomentum;
    this.yMomentum = yMomentum;
    this.angularMomentum = angularMomentum;
    this.sprite.rotation = 0;
    this.indicator = new Indicator();
    game.stage.addChild(this.sprite);
    game.stage.addChild(this.indicator.sprite);

  }
  recycle(x, y, xMomentum, yMomentum, angularMomentum, textures) {
    this.textures = textures;
    this.state = 0;
    this.sprite.texture = this.textures[this.state];
    this.sprite.position.set(x, y);
    this.xMomentum = xMomentum;
    this.yMomentum = yMomentum;
    this.angularMomentum = angularMomentum;
    this.sprite.alpha = 1;
  }
  disable() {
    this.sprite.position.set(-400, 0);
    this.sprite.xMomentum = 0;
    this.sprite.yMomentum = 0;
    this.sprite.alpha = 0;
    this.isCooking = false;
    this.isCollected = false;
    this.isFadingOut = false;
    this.angularMomentum = 0;
    this.state = -1;
    this.sprite.rotation = 0;
    this.framesCooked = 0;
    console.log("disabled");
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
    if (this.sprite.y > HEIGHT + 2 * this.sprite.height) {
      this.disable();
      lives.lose();
    }
  }
  updateCooking() {
    this.framesCooked++;
    const MEDIUM = 3 * FPS;
    const DONE = 6 * FPS;
    const OVER = 9 * FPS;
    const BURNING = 12 * FPS;
    const BURNED = 20 * FPS;
      switch (this.framesCooked) {
        case MEDIUM:
          this.state++;
          this.sprite.texture = this.textures[this.state];
          break;

        case DONE:
          this.state++;
          this.sprite.texture = this.textures[this.state];
          break;

        case OVER:
          this.state++;
          this.sprite.texture = this.textures[this.state];
          break;

        case BURNING:
          console.log("fire");
          this.state++;
          break;
        
        case BURNED:
          console.log("poof");
          this.disable();
          lives.lose();
          break;

        default:
          break;
      }
  }
  update() {
    if (this.state == -1) {}
    else if (this.isCollected & this.isFadingOut) {
      this.sprite.alpha += this.fadePerTick;
      if (this.sprite.alpha <= 0) {
        this.isFadingOut = false;
        this.disable();
      }
    } else if (this.isCooking) {
      this.updateCooking();
    } else {
      if (this.state == 4) {
        this.updateCooking();
      }
      this.updateIndicator();
      this.updateMomentum();
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
    this.yMomentum = - Math.abs(this.yMomentum);
  }
  collect() {
    this.angularMomentum = 0;
    this.xMomentum = 0;
    this.yMomentum = 0;
    this.isFadingOut = true;
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
    if (y > this.hitboxYEnd || y < this.hitboxYStart) { return -1; }
    this.hitboxWidth = this.width / this.isBusy.length;
    for (let i = 0; i < this.isBusy.length; i++) {
      let isBiggerThanMinX = x > this.hitboxXStart + this.hitboxWidth * i;
      let isSmallerThanMaxX = x <= this.hitboxXStart + this.hitboxWidth * (i + 1);
      let indexNotBusy = !this.isBusy[i];
      if (isBiggerThanMinX && isSmallerThanMaxX) {
        if (indexNotBusy) {
          this.isBusy[i] = true;
          return [this.hitboxXStart + this.hitboxWidth * (i + 0.5), this.hitboxYStart - 1, i];
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
class Lives {
  constructor(texture, count, separation) {
    this.hearts = [];
    for(let i = 0; i < count; i++) {
      let heart = new PIXI.Sprite(texture);
      heart.position.x = i * separation;
      heart.scale.set(0.5,0.5)
      game.stage.addChild(heart);
      this.hearts.push(heart);
      this.count = count;
    }
  } 
  lose() {
    this.count--;
    this.hearts[this.count].alpha = 0;
    if (this.count == 0) {
      // game over
    }
  }  
  reset() {
    count = this.hearts.length;
    for (let heart of hearts) {
      heart.alpha = 1;
    }
  }
}


let pointerPosition;
game.stage.interactive = true;
game.stage.on("pointermove", trackPointerPosition);
function trackPointerPosition(e) {
  pointerPosition = e.data.global;
}

function generateTextures(name, location, resolution, spriteCount) {
  game.loader.add(name, location);
  let spriteSheet = new PIXI.BaseTexture.from(game.loader.resources[name].url);
  let textures = [];
  for (let i = 0; i < spriteCount; i++) {
    textures[i] = new PIXI.Texture(spriteSheet, new PIXI.Rectangle(0, resolution * i, resolution, resolution));
  }
  return textures;
}
hamburgerTextures = generateTextures('hamburger', './spritesheets/hamburger.png', 32 * 4, 4);

function initializeFoodOnClickEvent(food) {
  food.sprite.on('pointerdown', function () {
    if (food.isCooking) {
      bbq.stopCooking(food.stopCooking());
    }
    let deltaX = pointerPosition.x - food.sprite.x;
    let deltaY = pointerPosition.y - food.sprite.y;

    //y momentum
    if (Math.abs(deltaY) < sweetSpot) {
      food.yMomentum = sweetSpotMomentum;
    } else {
      let newMomentum = ((sweetSpotMomentum - yBaseSpeed) * sweetSpot / Math.abs(deltaY) + yBaseSpeed);
      food.yMomentum = newMomentum;
    }

    // x momentum and rotation
    let maxMultiplier = 2.2;
    let momentumScaling = deltaX / (food.sprite.width / 2) * maxMultiplier * food.xMomentum;
    let xBaseIncrease = 4;
    let rotationIncrease = - MAXROTATIONINCREASE * deltaX / MAXDELTAX;

    if (food.xMomentum > 0) {
      food.xMomentum -= momentumScaling + xBaseIncrease;
      food.angularMomentum += rotationIncrease;
    } else if (food.xMomentum == 0) {
      if (deltaX <= 0) {
        food.xMomentum += momentumScaling + xBaseIncrease;
        food.angularMomentum += rotationIncrease;
      } else {
        food.xMomentum -= momentumScaling + xBaseIncrease
        food.angularMomentum += rotationIncrease;
      }
    }
      else {
      food.xMomentum += momentumScaling + xBaseIncrease;
      food.angularMomentum += rotationIncrease;
    }

    //limiters
    if (food.xMomentum >= MAXSPEED) {
      food.xMomentum = MAXSPEED;
    } else if (food.xMomentum <= - MAXSPEED) {
      food.xMomentum = - MAXSPEED;
    }
    if (food.angularMomentum >= food.maxAngularMomentum) {
      food.angularMomentum = food.maxAngularMomentum;
    } else if (food.angularMomentum <= -food.maxAngularMomentum) {
      food.angularMomentum = - food.maxAngularMomentum;
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
for (let t of debugInfo) {
  game.stage.addChild(t);
  t.anchor.x = 1;
  t.position.set(WIDTH - 30, debugPos);
  debugPos += 20;
}

let bbq = new BBQ(300);
let plate = new Plate(WIDTH - 200, HEIGHT - 150);

let foodArray = [
  new Food(718, 514, 0, 0, 0.05, hamburgerTextures),
  new Food(557, 514, 0, 0, -0.03, hamburgerTextures),
];

for (let food of foodArray) {
  initializeFoodOnClickEvent(food);
}

game.ticker.add(delta => gameLoop(delta));
function gameLoop() {
  for (let food of foodArray) {
    food.update();
    cookingPosition = bbq.hitboxCollided(food.sprite.position.x, food.sprite.position.y)
    if (cookingPosition != -1) {
      if (cookingPosition == -2) {
        food.bounce();
      } else {
        food.startCooking(cookingPosition);
      }
    }
    if (plate.hitboxCollided(food.sprite.x, food.sprite.y)) {
      food.collect();
    }
  }

  debugInfo[0].text = `meat position : (${Math.round(foodArray[0].sprite.x)}, ${Math.round(foodArray[0].sprite.y)})`;
  debugInfo[1].text = `meat momentum : (${foodArray[0].xMomentum.toFixed(1)}, ${foodArray[0].yMomentum.toFixed(1)})`;
  if (pointerPosition == undefined) {
    debugInfo[2].text = "pointer unvailable";
  } else {
    debugInfo[2].text = `cursor position : (${Math.round(pointerPosition.x)}, ${Math.round(pointerPosition.y)})`;
  }
  debugInfo[3].text = "FPS : " + Math.round(ticker.FPS);
}


lives = new Lives(hamburgerTextures[0], 3, 30);


//potential bug: package-lock.json 5000 lines limit (?)