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
  fontSize: 30,
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
  new Cloud(-500,10,cloudTextures[3], 1),
  new Cloud(300,30,cloudTextures[1], 1.5),
  new Cloud(0,100,cloudTextures[1], 1.2)
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

let spatula = new PIXI.AnimatedSprite(generateTexturesH('spatula', './spritesheets/spatula.png',256, 368, 3));
spatula.anchor.set(0.5, 0.3);
spatula.animationSpeed = 0.2;
game.stage.addChild(spatula);
spatula.alpha = 0;
spatula.loop = false;
spatula.onComplete = function() {
  spatula.alpha = 0;
};


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

let objectiveText = new PIXI.Text('', textStyle);
objectiveText.anchor.set(1, 0);
objectiveText.position.set(WIDTH - 20, 10);
objectiveText.alpha = 0;
game.stage.addChild(objectiveText);

lives = new Lives(3, 40);
lives.disable();
let objectivePerLevel = [3,4,5,6,7];
// objectivePerLevel = [1,1,1,1,1];
let maxMeatPerLevel = [1,2,2,3,3];
let levelScripts = [
  translateSecondsIntoFrames([1, 10, 20, 30, 40, 50]),
  translateSecondsIntoFrames([1, 10, 20, 30, 40, 50, 60]),
  translateSecondsIntoFrames([1, 7, 14, 21, 28, 35, 42, 49]),
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

let title = new PIXI.Sprite.from('./images/title.png');
title.anchor.set(0.5, 0.5);
title.position.set(WIDTH / 2, 150);
game.stage.addChild(title);

let winText = new PIXI.Text('You completed all the levels!\n Thanks for playing!', winTextStyle);
winText.anchor.set(0.5, 0);
winText.position.set(WIDTH / 2, 10);
game.stage.addChild(winText);
winText.alpha = 0;

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
    winText.alpha = 0;
  });
});

// Go back to Main Menu
let goBackToMenuButtons = [pauseMenuButtons[2], winMenuButtons[2], loseMenuButtons[1]];
goBackToMenuButtons.forEach((button) => {
  button.sprite.on('pointerdown', () => {
    objectiveText.alpha = 0;
    sfx.button.play();
    loadMainMenu();
    music.flippinMeat.stop();
    music.mainMenuSong.play();
    backgroundLayer2.texture = null;
    backgroundLayer3.texture = null;
    winText.alpha = 0;
  });
})

// Play next level
winMenuButtons[0].sprite.on('pointerdown', () => {
  level++;
  sfx.button.play();
  loadLevel(levelScripts[level - 1]);
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


let howToPlay = new PopupMenu();
mainMenuButtons[1].sprite.on('pointerdown', () => {
  howToPlay.display();
  sfx.button.play();
});
howToPlay.addText('Goal of the game: \nCook and serve the meat in the plate', 100, 50);
howToPlay.addText('You can click the meat pieces to juggle them in the air',100, 200);
howToPlay.addText('The pieces of meat are always launched upwards, but you \ncan affect their trajectory depending on where you hit them', 100, 275);
howToPlay.addText('Your guests only like Medium and Well-done meat, so make \nsure you serve them the way they like it', 100, 375);
howToPlay.addText('If you drop meat on the bottom of the screen or serve it \nin an inedible way, you lose hearts!', 100, 475)
howToPlay.addSprite(plate.sprite.texture, WIDTH / 2 - 150, 30);
howToPlay.addSprite(foodTextures[0][3], 300, HEIGHT - 200);
howToPlay.addSprite(foodTextures[4][4], 400, HEIGHT - 200);
howToPlay.addText('Good', 370, HEIGHT - 90);
howToPlay.addSprite(foodTextures[1][2], WIDTH - 350, HEIGHT - 200);
howToPlay.addSprite(foodTextures[3][5], WIDTH - 450, HEIGHT - 200);
howToPlay.addText('Bad', WIDTH - 370, HEIGHT - 90);
howToPlay.hide();

let credits = new PopupMenu();
mainMenuButtons[2].sprite.on('pointerdown', () => {
  credits.display();
  sfx.button.play();

});
credits.addText('Game design :\n    BUYMYBEARD\n    JUAN LUIZ RODRIGUES', 100, 200);
credits.addText('Programming :\n    BUYMYBEARD', 100, 400);
credits.addText('Art :\n    JUAN LUIZ RODRIGUES', 800, 200);
credits.addText('Music composed by :\n    BUYMYBEARD', 800, 400);
credits.addText('Thanks for playing!', 600, 600)
credits.hide();