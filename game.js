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
  fill: '#1005FF',
  stroke: '#000000',
  strokeThickness: 2
});

let buttonStyle = new PIXI.TextStyle({
  fontFamily: 'Georgia, Serif',
  fontSize: 40,
  fill: ['#F08080', '#AA3C3B'],
  stroke: '#000000',
  strokeThickness: 4,
  letterSpacing: 2
});

let textStyle = new PIXI.TextStyle({
  fontFamily: 'Georgia, Serif',
  fontSize: 20,
  fill: ['#F08080', '#AA3C3B'],
  stroke: '#000000',
  strokeThickness: 2
});
const winTextStyle = new PIXI.TextStyle({
  fill: [
      "#f08080",
      "#aa3c3b"
  ],
  fontFamily: "Comic Sans MS",
  fontSize: 70,
  strokeThickness: 4
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

let cloudTextures = generateTexturesH('clouds', './spritesheets/clouds_137x86.png',137 * 4, 86 * 4, 5);
let fireTextures = generateTexturesH('fire', './spritesheets/fire.png', 32 * 4, 32 * 4, 4);

const COOLDOWN = 30;

let menuBackgroundTexture = new PIXI.Texture.from('./images/sky_300x400.png');
let mountainBackgroundTexture = new PIXI.Texture.from('./images/moutains_300x400.png');
let gameBackgroundTexture = new PIXI.Texture.from('./images/background_300x400.png');
let backgroundLayer1 = new PIXI.Sprite(menuBackgroundTexture);
backgroundLayer1.width = WIDTH;
backgroundLayer1.height = HEIGHT;
game.stage.addChild(backgroundLayer1);

let backgroundLayer2 = new PIXI.Sprite(mountainBackgroundTexture);
backgroundLayer2.width = WIDTH;
backgroundLayer2.height = HEIGHT;
game.stage.addChild(backgroundLayer2);
backgroundLayer2.texture = null;

let menuCloudArray = [
  new Cloud(25,25, cloudTextures[0], 2),
  new Cloud(-500,170,cloudTextures[3], 3),
  new Cloud(2000,700, cloudTextures[4], 1),
  new Cloud(300,330,cloudTextures[1], 4),
  new Cloud(2500,520, cloudTextures[2], 2),
  new Cloud(600,1000,cloudTextures[2], 5)
];

let gameCloudArray = [
  new Cloud(25,25, cloudTextures[4], 1.7),
  new Cloud(-500,170,cloudTextures[3], 1),
  new Cloud(300,330,cloudTextures[1], 1.5)
];
gameCloudArray.forEach((cloud) => {
  cloud.hide();
});

let backgroundLayer3  = new PIXI.Sprite(gameBackgroundTexture);
backgroundLayer3.width = WIDTH;
backgroundLayer3.height = HEIGHT;
game.stage.addChild(backgroundLayer3);
backgroundLayer3.texture = null;


let bbq = new BBQ(-1000);
let plate = new Plate(WIDTH - 165, HEIGHT - 200);
plate.hide();

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

lives = new Lives(3, 40);
lives.disable();
let objectivePerLevel = [3,4,5,6,7];
objectivePerLevel = [1,1,1,1,1]
let maxMeatPerLevel = [1,2,2,3,3];
let levelScripts = [
  translateSecondsIntoFrames([1, 10, 20, 30]),
  translateSecondsIntoFrames([1, 10, 20, 30]),
  translateSecondsIntoFrames([1, 5, 15, 25]),
  translateSecondsIntoFrames([1, 10, 20, 30]),
  translateSecondsIntoFrames([1, 5, 15, 25])
];
let level;
let currentLevelScript;
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
      soundButtons[0].display();
      soundButtons[1].display();
    } else if (gameState == -1) {
      gameState = 1;
      toggleBlur(false);
      pauseMenuButtons.forEach((button) => {
        button.hide();
      });
      soundButtons[0].hide();
      soundButtons[1].hide();
    }
  }
});

blurFilter = new PIXI.filters.BlurFilter();
alphaFilter = new PIXI.filters.AlphaFilter(0.5);

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

soundTextures = generateTextures('sound','./spritesheets/soundButtons_32x32.png', 32 * 4, 2);
soundButtons = [
  new SoundButton(WIDTH - 150, 10, soundTextures[0]),
  new SoundButton(WIDTH - 10, 10, soundTextures[1])
];

// Play
mainMenuButtons[0].sprite.on('pointerdown', () => {
  sfx.button.play();
  level = 1;
  backgroundLayer2.texture = mountainBackgroundTexture;
  backgroundLayer3.texture = gameBackgroundTexture;
  loadLevel(levelScripts[level - 1]);
  mainMenuButtons.forEach((button) => {
    button.hide();
  });
  soundButtons[0].hide();
  soundButtons[1].hide();
});

// Resume
pauseMenuButtons[0].sprite.on('pointerdown', () => {
  sfx.button.play();
  gameState = 1;
  toggleBlur(false);
  pauseMenuButtons.forEach((button) => {
    button.hide();
  });
  soundButtons[0].hide();
  soundButtons[1].hide();
});

// Retry
let retryButtons = [pauseMenuButtons[1], winMenuButtons[1], loseMenuButtons[0]];
retryButtons.forEach((button) => {
  button.sprite.on('pointerdown', () => {
    sfx.button.play();
    music.flippinMeat.stop();
    loadLevel(currentLevelScript);
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
    backgroundLayer2.texture = null;
    backgroundLayer3.texture = null;
  });
})

// Play next level
winMenuButtons[0].sprite.on('pointerdown', () => {
  level++;
  sfx.button.play();
  loadLevel(levelScripts[level - 1]);
  console.log('Playing level ' + level);
  winMenuButtons.forEach((button) => {
    button.hide();
  });
});

//missing case
pauseMenuButtons[0].sprite.on('pointerdown', () => {
  soundButtons[0].hide();
  soundButtons[1].hide();
});
pauseMenuButtons[1].sprite.on('pointerdown', () => {
  soundButtons[0].hide();
  soundButtons[1].hide();
});
  

// Music toggle
let musicIsPlaying = true;
soundButtons[0].sprite.on('pointerdown', () => {
  toggleMusic();
  sfx.button.play();
})

//SFX toggle
let sfxIsPlaying = true;
soundButtons[1].sprite.on('pointerdown', () => {
  toggleSFX();
  sfx.button.play();
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
