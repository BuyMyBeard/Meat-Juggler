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
let graphics = PIXI.Graphics;
const FPS = Math.round(game.ticker.FPS);
//debug text
let style = new PIXI.TextStyle({
  fontFamily: 'Arial',
  fontSize: 15,
  fill: '#FFFFFF',
  stroke: '#EEEEEE'
});

let buttonStyle = new PIXI.TextStyle({
  fontFamily: 'Impact',
  fontSize: 40,
  fill: ['#F08080', '#AA3C3B'],
  stroke: '#000000',
  strokeThickness: 4,
  letterSpacing: 2
});

let pointerPosition;
game.stage.interactive = true;
game.stage.on("pointermove", (e) => {
  pointerPosition = e.data.global;
});

foodTextures = [
  generateTextures('hamburger', './spritesheets/hamburger.png', 32 * 4, 6),
  generateTextures('chicken', './spritesheets/chicken.png', 32 * 4, 6),
  generateTextures('pork', './spritesheets/pork.png', 32 * 4, 6),
  generateTextures('sausage', './spritesheets/sausage.png', 32 * 4, 6),
  generateTextures('skewer', './spritesheets/skewer.png', 32 * 4, 6),
  generateTextures('steak', './spritesheets/steak.png', 32 * 4, 6)
];
const COOLDOWN = 30;

let background = new PIXI.Sprite.from('./images/background_300x400.png');
background.width = WIDTH;
background.height = HEIGHT;
game.stage.addChild(background);

let bbq = new BBQ(-1000);
let plate = new Plate(0, -1000);

let foodArray = [
  new Food(-100, 500, 8, -5, 0.05, foodTextures[0]),
  new Food(WIDTH + 150, 300, -6, 0, -0.03, foodTextures[1]),
  new Food(WIDTH + 150, 300, -6, 0, -0.03, foodTextures[1]),
  new Food(WIDTH + 150, 300, -6, 0, -0.03, foodTextures[1]),
  new Food(WIDTH + 150, 300, -6, 0, -0.03, foodTextures[1]),
];

for (let food of foodArray) {
  initializeFoodOnClickEvent(food);
}

let frame = 0;
gameState = 0 // -1: pause   0: menu   1: game   -2: lose   2: win

heart = foodTextures[0]
lives = new Lives(heart[1], 3, 30);
lives.disable();

let level1Script=translateSecondsIntoFrames([1, 10, 20, 30, 35, 45, 55, 65, 75, 80]);
console.log(level1Script);
let currentLevel;
let wave;
let foodServed;
let foodGoal;

game.ticker.add(delta => updateLoop(delta));
music.mainMenuSong.play();

document.addEventListener('keydown', (key) => {
  if (key.key == 'p') {
    if (gameState == 1) {
      gameState = -1;
      toggleBlur(true);
      pauseMenuButtons.forEach((button) => {
        button.display();
      });
    } else if (gameState == -1) {
      gameState = 1;
      toggleBlur(false);
      pauseMenuButtons.forEach((button) => {
        button.hide();
      });
    }
  }
});

blurFilter = new PIXI.filters.BlurFilter();

mainMenuButtons = [
  new Button(WIDTH / 2, HEIGHT / 2, "Play", buttonStyle, false),
  new Button(WIDTH / 2, HEIGHT / 2 + 120, "How to play", buttonStyle, false),
  new Button(WIDTH / 2, HEIGHT / 2 + 240, "Credits", buttonStyle, false)
];
pauseMenuButtons = [
  new Button(WIDTH / 2, HEIGHT / 2 - 120, "Resume", buttonStyle, true),
  new Button(WIDTH / 2, HEIGHT / 2, "Retry level", buttonStyle, true),
  new Button(WIDTH / 2, HEIGHT / 2 + 120, "Go back to Main Menu", buttonStyle, true)
];
winMenuButtons = [
  new Button(WIDTH / 2, HEIGHT / 2 -120, "Play next level", buttonStyle, true),
  new Button(WIDTH / 2, HEIGHT / 2, "Retry level", buttonStyle, true),
  new Button(WIDTH / 2, HEIGHT / 2 + 120, "Go back to Main Menu", buttonStyle, true)
];
loseMenuButtons = [
  new Button(WIDTH / 2, HEIGHT / 2 - 60, "Retry level", buttonStyle, true),
  new Button(WIDTH / 2, HEIGHT / 2 + 60, "Go back to Main Menu", buttonStyle, true)
];

// Play
mainMenuButtons[0].sprite.on('pointerdown', () => {
  sfx.button.play();
  loadLevel(level1Script);
  mainMenuButtons.forEach((button) => {
    button.hide();
  });
});

// Resume
pauseMenuButtons[0].sprite.on('pointerdown', () => {
  sfx.button.play();
  gameState = 1;
  toggleBlur(false);
  pauseMenuButtons.forEach((button) => {
    button.hide();
  });
});

// Retry
let retryButtons = [pauseMenuButtons[1], winMenuButtons[1], loseMenuButtons[0]];
retryButtons.forEach((button) => {
  button.sprite.on('pointerdown', () => {
    sfx.button.play();
    loadLevel(currentLevel);
  });
});

// Go back to Main Menu
let goBackToMenuButtons = [pauseMenuButtons[2], winMenuButtons[2], loseMenuButtons[1]];
goBackToMenuButtons.forEach((button) => {
  button.sprite.on('pointerdown', () => {
    sfx.button.play();
    loadMainMenu();
    music.flippinMeat.stop();
    music.mainMenuSong.play();
  });
})

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
//potential bug: package-lock.json 5000 lines limit (?)