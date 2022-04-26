//food common variables
// hitting the object in the sweet spot vertically gives him the most vertical speed
// the farter from the sweet spot the object is hit vertically the less vertical speed
// the farter from the middle horizontally the object is hit the more the horizontal momentum is affected
let sweetSpot = 10; //pixels
let sweetSpotMomentum = -8; //speed change
let yBaseSpeed = -3; // minimum speed change before distance scaling added
let maxMultiplier = 2.2;
let xBaseIncrease = 4;
const ACCELERATION = 0.1; // pixel/gametick²
const MAXSPEED = 8;
const MAXROTATIONINCREASE = 0.1;
const MAXDELTAX = 50;
let maxAngularMomentum = 0.1; 
let lives;
let foodUsed = 0;
class Food {
  isCooking = false;
  cookingPositionIndex = -1;
  isFadingOut = false
  isCollected = false;
  fadePerTick = -0.03;
  framesCooked = 0;
  state = 1; // 1: raw   2: mid   3: done   4: well done   4: overcooked   5: burning   -1 = unused
  cooldown = 0;
  isBurning = false
  
  constructor(x, y, xMomentum, yMomentum, angularMomentum, textures) {
    this.textures = textures;
    this.sprite = new PIXI.Sprite(textures[this.state]);
    this.sprite.position.set(x, y);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.interactive = false;
    this.xMomentum = xMomentum;
    this.yMomentum = yMomentum;
    this.angularMomentum = angularMomentum;
    this.sprite.rotation = 0;
    this.indicator = new Indicator(this.textures[0]);
    this.fire = new PIXI.AnimatedSprite(fireTextures);
    this.fire.anchor.set(0.5, 0.8);
    this.fire.position.set(x, y);
    this.fire.play();
    this.fire.animationSpeed = 0.1;
    this.fire.alpha = 0;
    game.stage.addChild(this.sprite);
    game.stage.addChild(this.fire);
    game.stage.addChild(this.indicator.sprite);
    foodUsed++;
    
  }
  recycle(x, y, xMomentum, yMomentum, angularMomentum, textures) {
    this.textures = textures;
    this.state = 1
    this.sprite.texture = this.textures[this.state];
    this.sprite.position.set(x, y);
    this.xMomentum = xMomentum;
    this.yMomentum = yMomentum;
    this.angularMomentum = angularMomentum;
    this.sprite.alpha = 1;
    this.indicator.sprite.texture = textures[0];
    foodUsed++;
  }
  disable() {
    this.fire.alpha = 0;
    this.sprite.position.set(-2000, 1000);
    this.sprite.xMomentum = 0;
    this.sprite.yMomentum = 0;
    this.sprite.alpha = 0;
    this.isBurning = false;
    if (this.isCooking) {
      fixBBQ(this.cookingPositionIndex);
      this.isCooking = false;
      this.cookingPositionIndex = -1;
    }
    this.isCollected = false;
    this.isFadingOut = false;
    this.angularMomentum = 0;
    this.state = -1;
    this.sprite.rotation = 0;
    this.framesCooked = 0;
    this.indicator.hide();
    foodUsed--;
  }
  updateIndicator() {
    if (this.sprite.y < 0) {
      this.indicator.sprite.x = this.sprite.x;
    } else {
      this.indicator.sprite.x = -200;
    }
  }
  updateMomentum() {
    if (this.yMomentum < MAXSPEED - 0.1) {
      this.yMomentum += ACCELERATION;
    }
    this.sprite.x += this.xMomentum;
    this.sprite.y += this.yMomentum;
    this.sprite.rotation += this.angularMomentum;
    if (this.sprite.x < this.sprite.width / 2){
      this.xMomentum = Math.abs(this.xMomentum)
      this.angularMomentum *= -1;
    } else if (this.sprite.x > WIDTH - this.sprite.width / 2) {
      this.xMomentum = - Math.abs(this.xMomentum)
      this.angularMomentum *= -1;
    }
    if (this.sprite.y > HEIGHT + 2 * this.sprite.height) {
      this.disable();
      if (this.sprite.interactive) {
        lives.lose();
      }
    }
  }
  updateCooking() {
    this.fire.position.set(this.sprite.x, this.sprite.y);
    this.framesCooked++;
    const MEDIUM = 3 * FPS;
    const DONE = 6 * FPS;
    const WELLDONE = 9 * FPS;
    const BURNING = 12 * FPS;
    const BURNED = 16 * FPS;
    const DISSAPEAR = 20 * FPS;
      switch (this.framesCooked) {
        case MEDIUM:
        case DONE:
        case WELLDONE:
          this.state++;
          this.sprite.texture = this.textures[this.state];
          break;

        case BURNING:
          this.isBurning = true;
          this.fire.alpha = 1;
          sfx.fire.play();
          break;
        
        case BURNED:
          this.state++;
          this.sprite.texture = this.textures[this.state];
          break;

        case DISSAPEAR:
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
      if (this.isBurning) {
        this.updateCooking();
      }
      this.updateIndicator();
      this.updateMomentum();
      if (this.cooldown > 0) { this.cooldown--; }
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
    if (!this.isFadingOut) {
      if (this.state == 3 || this.state == 4) {
        foodServed++;
        frame = currentLevelScript[wave] - 1 * FPS;
        sfx.valid.play();
      } else {
        lives.lose();
        sfx.invalid.play();
      }  
    }
    if (foodServed >= foodGoal && !this.isFadingOut) {
      loadWinMenu();
    }
    this.isFadingOut = true;
    this.isCollected = true;
  }
}


class Indicator {
hiddenX = -1000;
  constructor(texture) {
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.position.set(-200, 60);
  }
  hide() {
    this.sprite.x = this.hiddenX;
  }
}
class BBQ {
  width = 512;
  hiddenX = -2000;
  yOffset = 40;
  isBusy = [false, false, false];
  hitboxYStart = HEIGHT - 140 + this.yOffset;
  hitboxYEnd = HEIGHT - 100 + this.yOffset;
  constructor(x) {
    this.sprite = new PIXI.Sprite.from('./images/BBQ_grill.png');
    this.sprite.anchor.set(0, 1);
    this.sprite.position.set(x, HEIGHT + this.yOffset);
    game.stage.addChild(this.sprite);
  }
  // returns an array [cookingPositionX, cookingPositionY, cookingPositionIndex]. 
  // if hitbox not encountered, returns -1 instead
  // if hitbox encountered but busy, returns -2 instead
  hitboxCollided(x, y) {
    let border = 45;
    if (y > this.hitboxYEnd || y < this.hitboxYStart) { return -1; }
    this.hitboxWidth = (this.width - 2 * border) / this.isBusy.length;
    for (let i = 0; i < this.isBusy.length; i++) {
      let isBiggerThanMinX = x > this.sprite.x + border + this.hitboxWidth * i;
      let isSmallerThanMaxX = x <= this.sprite.x + border + this.hitboxWidth * (i + 1);
      let indexNotBusy = !this.isBusy[i];
      if (isBiggerThanMinX && isSmallerThanMaxX) {
        if (indexNotBusy) {
          this.isBusy[i] = true;
          sfx.grill.play();
          return [this.sprite.x + border + this.hitboxWidth * (i + 0.5), this.hitboxYStart - 1, i];
        }
        return -2;
      }
    }
    return -1;
  }
  stopCooking(index) {
    this.isBusy[index] = false;
  }
  hide() {
    this.sprite.x = this.hiddenX;
  }
}
class Plate {
  hiddenX = -2000;
  dimensions = 128;
  constructor(x, y) {
    this.sprite = new PIXI.Sprite.from("./images/plate_32x32.png");
    this.sprite.position.set(x, y);
    game.stage.addChild(this.sprite);
    this.savedX = x;
  }
  hitboxCollided(x, y) {
    let isWithinHitboxX = x >= this.sprite.position.x && x <= this.sprite.position.x + this.dimensions;
    let isWithinHitboxY = y >= this.sprite.position.y && y <= this.sprite.position.y + this.dimensions;
    if (isWithinHitboxX && isWithinHitboxY) { return true; }
    return false;
  }
  hide() {
    this.sprite.x = this.hiddenX;
  }
  display() {
    this.sprite.position.x = this.savedX;
  }
}
class Lives {
  constructor(count, separation) {
    this.hearts = [];
    for(let i = 0; i < count; i++) {
      let heart = new PIXI.Sprite.from('./images/heart_32x32.png');
      heart.position.x = i * separation;
      heart.scale.set(0.7,0.7)
      game.stage.addChild(heart);
      this.hearts.push(heart);
      this.count = count;
    }
  } 
  lose() {
    if (this.count > 0) {
      this.count--;
      this.hearts[this.count].alpha = 0;
      if (this.count == 0) {
        endSong();
        loadloseMenu();
      }
    }
  }  
  reset() {
    this.count = this.hearts.length;
    for (let heart of this.hearts) {
      heart.alpha = 1;
    }
  }
  disable() {
    this.hearts.forEach((heart) => {
      heart.alpha = 0;
    });
  }
}
class Button {
  hiddenOffset = 2000;
  constructor(x, y, text, textStyle, hidden) {
    this.sprite = new PIXI.Sprite.from('./images/button.png');
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.position.set(x, y);
    this.sprite.interactive = true;
    game.stage.addChild(this.sprite);
    this.text = new PIXI.Text(text, textStyle);
    this.text.anchor.set(0.5, 0.5);
    this.text.position.set(x, y);
    game.stage.addChild(this.text);
    this.displayX = x;
    this.hiddenX = x + this.hiddenOffset;
    if (hidden) {
      this.hide()
    }
  }
  hide() {
    this.sprite.x = this.hiddenX;
    this.text.x = this.hiddenX;
  }
  display() {
    this.sprite.x = this.displayX;
    this.text.x = this.displayX;
  }
}
class SoundButton {
  hiddenOffset = 2000;
  constructor(x, y, texture) {
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(1, 0);
    this.sprite.position.set(x, y);
    this.sprite.interactive = true;
    game.stage.addChild(this.sprite);
    this.displayX = x;
    this.hiddenX = x + this.hiddenOffset;
  }
  hide() {
    this.sprite.x = this.hiddenX;
  }
  display() {
    this.sprite.x = this.displayX;
  }
}
class Cloud {
  hiddenX = 5000;
  MinX = -1000
  MaxX = WIDTH + 1000;
  constructor(x, y, texture, speed) {
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.position.set(x, y);
    game.stage.addChild(this.sprite);
    this.speed = speed;
    this.savedPosition = this.sprite.x;
  }
  update() {
    this.sprite.x += this.speed;
    if (this.sprite.x >= this.MaxX) {
      this.sprite.x = this.MinX;
    }
  }
  hide() {
    this.savedPosition = this.sprite.x;
    this.sprite.x = this.hiddenX;
  }
  display() {
    this.sprite.x = this.savedPosition;
  }
}
class PopupMenu {
  content = [];
  savedX = WIDTH - 50;
  hiddenX = -2000;
  constructor() {
    this.background = new PIXI.Graphics();
    this.background.beginFill(0x00008B).drawRect(0, 0, WIDTH, HEIGHT).endFill();
    this.background.alpha = 0.85;
    this.background.interactive = true;
    game.stage.addChild(this.background);
    this.exitButton = new PIXI.Sprite.from('./images/X_Button.png');
    this.exitButton.anchor.set(1, 0);
    this.exitButton.position.set(this.savedX, 5);
    this.exitButton.interactive = true;
    game.stage.addChild(this.exitButton);
    this.exitButton.on('pointerdown', () => {
      this.hide();
      sfx.button.play();
    });
  }
  addText(text, x, y) {
    text = new PIXI.Text(text, textStyle);
    text.position.set(x, y);
    game.stage.addChild(text);
    this.content.push(text);
  }
  addSprite(texture, x, y) {
    let sprite = new PIXI.Sprite(texture);
    sprite.position.set(x, y);
    game.stage.addChild(sprite);
    this.content.push(sprite);
  }
  hide() {
    this.content.forEach((item) => {
      item.alpha = 0;
    });
    this.exitButton.x = this.hiddenX;
    this.background.x = 5000;
  }
  display() {
    this.content.forEach((item) => {
      item.alpha = 1;
    });
    this.exitButton.x = this.savedX;
    this.background.x = 0;
  }
}