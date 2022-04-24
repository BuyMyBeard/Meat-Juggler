function generateTextures(name, location, resolution, spriteCount) {
  game.loader.add(name, location);
  let spriteSheet = new PIXI.BaseTexture.from(game.loader.resources[name].url);
  let textures = [];
  for (let i = 0; i < spriteCount; i++) {
    textures[i] = new PIXI.Texture(spriteSheet, new PIXI.Rectangle(0, resolution * i, resolution, resolution));
  }
  return textures;
}

function initializeFoodOnClickEvent(food) {
  food.sprite.on('pointerdown', () => {
    if (food.cooldown > 0) { console.log(food.cooldown); return 0; }
    food.cooldown += COOLDOWN;
    sfx.squich[randomIntegerGenerator(0,sfx.squich.length-1)].play();
    console.log(food.cooldown);
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

function randomIntegerGenerator(min, max) {
  return Math.floor(Math.random() * (max + 1 - min) + min);
}
function randomDoubleGenerator(min, max) {
  return Math.random() * (max - min) + min;
}
function menuSpawnFoodRandomly(food) {
  const MINX = -200;
  const MAXX = -100;
  const MINY = -100;
  const MAXY = HEIGHT;
  const MINXMOMENTUM = 4;
  const MAXXMOMENTUM = 8;
  const MINYMOMENTUM = -5;
  const MAXYMOMENTUM = 0;

  let side = randomIntegerGenerator(0, 1); // 0: left, 1: right
  let x = Math.pow(-1, side) * randomDoubleGenerator(MINX, MAXX) + side * WIDTH;
  let y = randomDoubleGenerator(MINY, MAXY);
  let xMomentum = Math.pow(-1, side) * randomDoubleGenerator(MINXMOMENTUM, MAXXMOMENTUM);
  let yMomentum = randomDoubleGenerator(MINYMOMENTUM, MAXYMOMENTUM);
  let angularMomentum = randomDoubleGenerator(- maxAngularMomentum, maxAngularMomentum);
  let foodType = randomIntegerGenerator(0, foodTextures.length - 1)
  food.recycle(x, y, xMomentum, yMomentum, angularMomentum, foodTextures[foodType]);
}
function spawnFoodAbove(food) {
  const MINX = 0;
  const MAXX = WIDTH;
  const MINY = -500;
  const MAXY = -200;
  const MINXMOMENTUM = -4;
  const MAXXMOMENTUM = 4;
  const YMOMENTUM = 0;

  let x = randomDoubleGenerator(MINX, MAXX);
  let y = randomDoubleGenerator(MINY, MAXY);
  let xMomentum = randomDoubleGenerator(MINXMOMENTUM, MAXXMOMENTUM);
  let angularMomentum = randomDoubleGenerator(- maxAngularMomentum, maxAngularMomentum);
  let foodType = randomIntegerGenerator(0, foodTextures.length - 1)
  food.recycle(x, y, xMomentum, YMOMENTUM, angularMomentum, foodTextures[foodType]);
}

function gameLoop() {
  frame++;
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
}

function spawnFood() {
  if (wave >= currentLevel.length) {
    wave = 0;
    frame = 0;
  }
  let nextEvent = currentLevel[wave];
  if (foodUsed == 0 && wave > 0) {
    frame = nextEvent;
  }
  if (frame == nextEvent && foodUsed < foodArray.length) {
    spawnFoodAbove(getFirstUnusedFood());
    wave++;
  }
}

function menuLoop() {
  for (let food of foodArray) {
    food.update();
    if (food.state == -1) { 
      menuSpawnFoodRandomly(food);
    }
  }
}

function updateLoop() {
  switch (gameState) {
    case 0: 
      menuLoop();
      break;

    case 1:
      gameLoop();
      spawnFood();
      break;

    default:
      break;
  }
  // d.update();
  debugInfo[0].text = `meat position : (${Math.round(foodArray[0].sprite.x)}, ${Math.round(foodArray[0].sprite.y)})`;
  debugInfo[1].text = `meat momentum : (${foodArray[0].xMomentum.toFixed(1)}, ${foodArray[0].yMomentum.toFixed(1)})`;
  if (pointerPosition == undefined) {
    debugInfo[2].text = "pointer unvailable";
  } else {
    debugInfo[2].text = `cursor position : (${Math.round(pointerPosition.x)}, ${Math.round(pointerPosition.y)})`;
  }
  debugInfo[3].text = `food used : ${foodUsed} `;
  debugInfo[4].text = `food cooked : ${foodServed} / ${foodGoal}`;
}

function translateSecondsIntoFrames(array) {
  newArray = []
  array.forEach((time) => {
    newArray.push(time * FPS);
  });
  return newArray;
}


function loadLevel(level) {
  foodArray.forEach((food) => {
    food.disable();
    food.sprite.interactive = true;
    foodServed = 0;
    foodGoal = 5;
  });
  frame = 0;
  wave = 0;
  gameState = 1;
  currentLevel = level;
  bbq.sprite.x = (300);
  plate.sprite.position.set(WIDTH - 200, HEIGHT - 150);
  lives.reset(); 
  music.mainMenuSong.stop();
  playGameSong();
  mainMenuButtons.forEach((button) => {
    button.hide();
  });
  pauseMenuButtons.forEach((button) => {
    button.hide();
  });
  loseMenuButtons.forEach((button) => {
    button.hide();
  });
  winMenuButtons.forEach((button) => {
    button.hide();
  });
  toggleBlur(false);
}
function getFirstUnusedFood() {
  for (food of foodArray) {
    if (food.state == -1) {
      return food;
    }
  }
  throw "no food unused";
}

function toggleBlur(isEnabled) {
  if (isEnabled) {
    foodArray.forEach((food) => {
      food.sprite.filters = [blurFilter];
      food.indicator.sprite.filters = [blurFilter];                    
    });
    lives.hearts.forEach((heart) => {
      heart.filters = [blurFilter];
    });
    bbq.sprite.filters = [blurFilter];
    plate.sprite.filters = [blurFilter];
    background.filters = [blurFilter];
  } else { 
    foodArray.forEach((food) => {
      food.sprite.filters = null;
      food.indicator.sprite.filters = null;
    });
    lives.hearts.forEach((heart) => {
      heart.filters = null;
    });
    bbq.sprite.filters = null;
    plate.sprite.filters = null;
    background.filters = null;
  }
}
function fixBBQ(cookingPos) {
  bbq.isBusy[cookingPos] = false;
}

//debugging
function showHitboxes() {
  let x = bbq.sprite.x;
  let width = bbq.width;
  let border = 40;
  let hitboxWidth = (width - 2 * border) / 3;
  let boxes = [];
  let fill = [0x111111, 0x222222, 0x333333]
  for (let i = 0; i < 3; i++) {
    let isBiggerThanMinX = x + border + hitboxWidth * i;
    let hitboxWidth2 = x + border + hitboxWidth * (i + 1) - isBiggerThanMinX;
    let box1 = new graphics();
    box1.beginFill(fill[i]).drawRect(isBiggerThanMinX, bbq.hitboxYStart, hitboxWidth2, bbq.hitboxYEnd - bbq.hitboxYStart).endFill();
    box1.alpha = 0.9;
    game.stage.addChild(box1);
    boxes.push(box1);
  }
}

function loadMainMenu() {
  toggleBlur(false);
  gameState = 0;
  foodArray.forEach((food) => {
    food.disable();
    food.sprite.interactive = false;
  })
  mainMenuButtons.forEach((button) => {
    button.display();
  });
  pauseMenuButtons.forEach((button) => {
    button.hide();
  });
  loseMenuButtons.forEach((button) => {
    button.hide();
  });
  winMenuButtons.forEach((button) => {
    button.hide();
  });
  bbq.hide();
  plate.hide();
  lives.disable();
}

function loadloseMenu() {
  loseMenuButtons.forEach((button) => {
    button.display();
  });
  foodArray.forEach((food) => {
    food.sprite.interactive = false;
  })
  gameState = -2;
}

function loadWinMenu() {
  winMenuButtons.forEach((button) => {
    button.display();
  });
  foodArray.forEach((food) => {
    food.sprite.interactive = false;
  })
  gameState = 2;
}