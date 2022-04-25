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
function playGameSong() {
  music.flippinMeat.play('intro');
  music.flippinMeat.once('end', () => {
    music.flippinMeat.play('mainLoop');
  });
}

/* version 1 (can cause multiple bugs)
function endSong() {
  music.flippinMeat.once('end', () => {
    music.flippinMeat.stop();
    music.flippinMeat.play('defeat');
  });
} */
//version 2
function endSong() {
  music.flippinMeat.stop();
  music.flippinMeat.play('defeat');
}

let sfx = {
  button: new Howl({
    src: ['./sounds/button.wav']
  }),
  valid: new Howl({
    src: ['./sounds/valid.wav']
  }),
  invalid: new Howl({
    src: ['./sounds/invalid.wav']
  }),
  grill: new Howl({
    src: ['./sounds/grill2.wav']
  }),
  fire: new Howl({
    src: ['./sounds/flame-burst.wav']
  }),
  squich: [
    new Howl({
      src: ['./sounds/squich1.wav']
    }),
    new Howl({
      src: ['./sounds/squich2.wav']
    }),
    new Howl({
      src: ['./sounds/squich3.wav']
    }),
    new Howl({
      src: ['./sounds/squich4.wav']
    }),
    new Howl({
      src: ['./sounds/squich5.wav']
    }),
    new Howl({
      src: ['./sounds/squich6.wav']
    })
  ]
}