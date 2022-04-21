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
let music = {
  mainMenuSong: new Howl({
    src: ['./music/Main-Menu.wav'],
    loop: true
  }),
  flippinMeat: new Howl({
    src: ['./music/Flippin-Meat.wav'],
    sprite: {
      'intro': [0, 8000],
      'mainLoop': [8000, 8000, true],
      'defeat': [16000, 5000]
    }
  })
}
function playMainSong() {
  music.flippinMeat.play('intro');
  music.flippinMeat.once('end', () => {
    music.flippinMeat.play('mainLoop');
  });
}


function endSong() {
  music.flippinMeat.once('end', () => {
    music.flippinMeat.stop();
    music.flippinMeat.play('defeat');
  }); 
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
foodTextures = [
  generateTextures('hamburger', './spritesheets/hamburger.png', 32 * 4, 6),
  generateTextures('chicken', './spritesheets/chicken.png', 32 * 4, 6),
  generateTextures('pork', './spritesheets/pork.png', 32 * 4, 6),
  generateTextures('sausage', './spritesheets/sausage.png', 32 * 4, 6),
  generateTextures('skewer', './spritesheets/skewer.png', 32 * 4, 6),
  generateTextures('steak', './spritesheets/steak.png', 32 * 4, 6)
]


function initializeFoodOnClickEvent(food) {
  food.sprite.on('pointerdown', () => {
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

bbq = new BBQ(-1000);
plate = new Plate(0, -1000);
//bbq = new BBQ(300);
//plate = new Plate(WIDTH - 200, HEIGHT - 150);

let foodArray = [
  new Food(-100, 500, 8, -5, 0.05, foodTextures[0]),
  new Food(WIDTH + 150, 300 , -6, 0, -0.03, foodTextures[1]),
  new Food(WIDTH + 150, 300 , -6, 0, -0.03, foodTextures[1]),
  new Food(WIDTH + 150, 300 , -6, 0, -0.03, foodTextures[1]),
  new Food(WIDTH + 150, 300 , -6, 0, -0.03, foodTextures[1]),
];

function randomIntegerGenerator(min, max) {
  return Math.floor(Math.random() * (max + 1 - min) + min);
}
function randomDoubleGenerator(min, max) {
  return Math.random() * (max - min) + min;
}
game.ticker.add(delta => menuLoop(delta));
function menuLoop() {
  foodArray.forEach((food) => {
    const MINX = -200;
    const MAXX = -100;
    const MINY = -100;
    const MAXY = HEIGHT;
    const MINXMOMENTUM = 4;
    const MAXXMOMENTUM = 8;
    const MINYMOMENTUM = -5;
    const MAXYMOMENTUM = 0;
    if (food.state == -1) {
      let side = randomIntegerGenerator(0, 1); // 0: left, 1: right
      let x = Math.pow(-1, side) * randomDoubleGenerator(MINX, MAXX) + side * WIDTH;
      let y = randomDoubleGenerator(MINY, MAXY);
      let xMomentum = Math.pow(-1, side) * randomDoubleGenerator(MINXMOMENTUM, MAXXMOMENTUM);
      let yMomentum = randomDoubleGenerator(MINYMOMENTUM, MAXYMOMENTUM);
      let angularMomentum = randomDoubleGenerator(- maxAngularMomentum, maxAngularMomentum);
      let foodType = randomIntegerGenerator(0, foodTextures.length - 1)
      food.recycle(x, y, xMomentum, yMomentum, angularMomentum, foodTextures[foodType]);
    }
    food.update();
  });
}

for (let food of foodArray) {
  initializeFoodOnClickEvent(food);
}

// game.ticker.add(delta => gameLoop(delta));
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
}


lives = new Lives(hamburgerTextures[0], 3, 30);
lives.disable();

//potential bug: package-lock.json 5000 lines limit (?)