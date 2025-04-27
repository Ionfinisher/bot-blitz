let game;
let gameOptions = {
  fieldSize: 7,
  botColors: 6,
  botSize: 100,
  swapSpeed: 200,
  fallSpeed: 100,
  destroySpeed: 200,
};
const HORIZONTAL = 1;
const VERTICAL = 2;
window.onload = function () {
  let gameConfig = {
    width: 700,
    height: 700,
    scene: playGame,
  };
  game = new Phaser.Game(gameConfig);
  window.focus();
  resize();
  window.addEventListener("resize", resize, false);
};
class playGame extends Phaser.Scene {
  constructor() {
    super("PlayGame");
  }
  preload() {
    this.load.spritesheet("bots", "assets/sprites/gems.png", {
      frameWidth: gameOptions.botSize,
      frameHeight: gameOptions.botSize,
    });
    this.load.audio("swap", ["assets/sounds/swap.wav"]);
    this.load.audio("match", ["assets/sounds/match.wav"]);
    this.load.audio("no-match", ["assets/sounds/no-match.wav"]);
    this.load.audio("combo", ["assets/sounds/combo.wav"]);
    this.load.audio("backgroundMusic", ["assets/sounds/background.mp3"]);
    this.load.image("particle", "assets/sprites/particle.png", {
      frameWidth: gameOptions.botSize,
      frameHeight: gameOptions.botSize,
    });
  }
  create() {
    this.backgroundMusic = this.sound.add("backgroundMusic", {
      loop: true,
      volume: 0.5,
    });

    this.backgroundMusic.play();

    this.canPick = true;
    this.dragging = false;

    this.score = 0;
    this.bestCombo = 0;
    this.scoreText = document.getElementById("score-value");
    this.comboText = document.getElementById("combo-value");
    this.scoreText.textContent = this.score;
    this.comboText.textContent = this.bestCombo;

    this.particles = this.add.particles("particle");

    this.drawField();
    this.selectedBot = null;
    this.comboCounter = 0;

    this.initialTime = 120;
    this.timeLeft = this.initialTime;
    this.timeText = document.getElementById("time-value");
    this.timeText.textContent = this.timeLeft;

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });

    this.input.on("pointerdown", this.botSelect, this);
    this.input.on("pointermove", this.startSwipe, this);
    this.input.on("pointerup", this.stopSwipe, this);

    const soundOnButton = document.getElementById("sound-on-button");
    const soundOffButton = document.getElementById("sound-off-button");

    const updateSoundButtons = () => {
      if (this.sound.mute) {
        if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
          this.backgroundMusic.pause();
        }
      } else {
        if (
          this.backgroundMusic &&
          !this.backgroundMusic.isPlaying &&
          this.backgroundMusic.seek === 0
        ) {
          this.backgroundMusic.play();
        } else if (this.backgroundMusic && this.backgroundMusic.isPaused) {
          this.backgroundMusic.resume();
        }
      }
    };

    soundOnButton.addEventListener("click", () => {
      this.sound.mute = false;
      updateSoundButtons();
    });

    soundOffButton.addEventListener("click", () => {
      this.sound.mute = true;
      updateSoundButtons();
    });

    updateSoundButtons();
  }
  drawField() {
    this.gameArray = [];
    this.poolArray = [];
    this.botGroup = this.add.group();
    for (let i = 0; i < gameOptions.fieldSize; i++) {
      this.gameArray[i] = [];
      for (let j = 0; j < gameOptions.fieldSize; j++) {
        let bot = this.add.sprite(
          gameOptions.botSize * j + gameOptions.botSize / 2,
          gameOptions.botSize * i + gameOptions.botSize / 2,
          "bots"
        );
        this.botGroup.add(bot);
        do {
          let randomColor = Phaser.Math.Between(0, gameOptions.botColors - 1);
          bot.setFrame(randomColor);
          this.gameArray[i][j] = {
            botColor: randomColor,
            botSprite: bot,
            isEmpty: false,
          };
        } while (this.isMatch(i, j));
      }
    }
  }
  isMatch(row, col) {
    return this.isHorizontalMatch(row, col) || this.isVerticalMatch(row, col);
  }
  isHorizontalMatch(row, col) {
    return (
      this.botAt(row, col).botColor == this.botAt(row, col - 1).botColor &&
      this.botAt(row, col).botColor == this.botAt(row, col - 2).botColor
    );
  }
  isVerticalMatch(row, col) {
    return (
      this.botAt(row, col).botColor == this.botAt(row - 1, col).botColor &&
      this.botAt(row, col).botColor == this.botAt(row - 2, col).botColor
    );
  }
  botAt(row, col) {
    if (
      row < 0 ||
      row >= gameOptions.fieldSize ||
      col < 0 ||
      col >= gameOptions.fieldSize
    ) {
      return -1;
    }
    return this.gameArray[row][col];
  }
  botSelect(pointer) {
    if (this.canPick) {
      this.dragging = true;
      let row = Math.floor(pointer.y / gameOptions.botSize);
      let col = Math.floor(pointer.x / gameOptions.botSize);
      let pickedBot = this.botAt(row, col);
      if (pickedBot != -1) {
        if (this.selectedBot == null) {
          pickedBot.botSprite.setScale(1.2);
          pickedBot.botSprite.setDepth(1);
          this.selectedBot = pickedBot;
        } else {
          if (this.areTheSame(pickedBot, this.selectedBot)) {
            this.selectedBot.botSprite.setScale(1);
            this.selectedBot = null;
          } else {
            if (this.areNext(pickedBot, this.selectedBot)) {
              this.selectedBot.botSprite.setScale(1);
              this.swapBots(this.selectedBot, pickedBot, true);
            } else {
              this.selectedBot.botSprite.setScale(1);
              pickedBot.botSprite.setScale(1.2);
              this.selectedBot = pickedBot;
            }
          }
        }
      }
    }
  }
  startSwipe(pointer) {
    if (this.dragging && this.selectedBot != null) {
      let deltaX = pointer.downX - pointer.x;
      let deltaY = pointer.downY - pointer.y;
      let deltaRow = 0;
      let deltaCol = 0;
      if (
        deltaX > gameOptions.botSize / 2 &&
        Math.abs(deltaY) < gameOptions.botSize / 4
      ) {
        deltaCol = -1;
      }
      if (
        deltaX < -gameOptions.botSize / 2 &&
        Math.abs(deltaY) < gameOptions.botSize / 4
      ) {
        deltaCol = 1;
      }
      if (
        deltaY > gameOptions.botSize / 2 &&
        Math.abs(deltaX) < gameOptions.botSize / 4
      ) {
        deltaRow = -1;
      }
      if (
        deltaY < -gameOptions.botSize / 2 &&
        Math.abs(deltaX) < gameOptions.botSize / 4
      ) {
        deltaRow = 1;
      }
      if (deltaRow + deltaCol != 0) {
        let pickedBot = this.botAt(
          this.getBotRow(this.selectedBot) + deltaRow,
          this.getBotCol(this.selectedBot) + deltaCol
        );
        if (pickedBot != -1) {
          this.selectedBot.botSprite.setScale(1);
          this.swapBots(this.selectedBot, pickedBot, true);
          // this.dragging = false; not necessary anymore
        }
      }
    }
  }
  stopSwipe() {
    this.dragging = false;
  }
  areTheSame(bot1, bot2) {
    return (
      this.getBotRow(bot1) == this.getBotRow(bot2) &&
      this.getBotCol(bot1) == this.getBotCol(bot2)
    );
  }
  getBotRow(bot) {
    return Math.floor(bot.botSprite.y / gameOptions.botSize);
  }
  getBotCol(bot) {
    return Math.floor(bot.botSprite.x / gameOptions.botSize);
  }
  areNext(bot1, bot2) {
    return (
      Math.abs(this.getBotRow(bot1) - this.getBotRow(bot2)) +
        Math.abs(this.getBotCol(bot1) - this.getBotCol(bot2)) ==
      1
    );
  }
  swapBots(bot1, bot2, swapBack) {
    this.sound.play("swap");
    this.swappingBots = 2;
    this.canPick = false;
    this.dragging = false;
    let fromColor = bot1.botColor;
    let fromSprite = bot1.botSprite;
    let toColor = bot2.botColor;
    let toSprite = bot2.botSprite;
    let bot1Row = this.getBotRow(bot1);
    let bot1Col = this.getBotCol(bot1);
    let bot2Row = this.getBotRow(bot2);
    let bot2Col = this.getBotCol(bot2);
    this.gameArray[bot1Row][bot1Col].botColor = toColor;
    this.gameArray[bot1Row][bot1Col].botSprite = toSprite;
    this.gameArray[bot2Row][bot2Col].botColor = fromColor;
    this.gameArray[bot2Row][bot2Col].botSprite = fromSprite;
    this.tweenBot(bot1, bot2, swapBack);
    this.tweenBot(bot2, bot1, swapBack);
  }
  tweenBot(bot1, bot2, swapBack) {
    let row = this.getBotRow(bot1);
    let col = this.getBotCol(bot1);
    this.tweens.add({
      targets: this.gameArray[row][col].botSprite,
      x: col * gameOptions.botSize + gameOptions.botSize / 2,
      y: row * gameOptions.botSize + gameOptions.botSize / 2,
      duration: gameOptions.swapSpeed,
      callbackScope: this,
      onComplete: function () {
        this.swappingBots--;
        if (this.swappingBots == 0) {
          if (!this.matchInBoard() && swapBack) {
            this.sound.play("no-match");
            this.comboCounter = 0;
            this.swapBots(bot1, bot2, false);
          } else {
            if (this.matchInBoard()) {
              this.handleMatches();
            } else {
              this.canPick = true;
              this.selectedBot = null;
              this.comboCounter = 0;
            }
          }
        }
      },
    });
  }
  matchInBoard() {
    for (let i = 0; i < gameOptions.fieldSize; i++) {
      for (let j = 0; j < gameOptions.fieldSize; j++) {
        if (this.isMatch(i, j)) {
          return true;
        }
      }
    }
    return false;
  }
  handleMatches() {
    this.comboCounter++;
    if (this.comboCounter > 1) {
      this.sound.play("combo");

      if (this.comboCounter > this.bestCombo) {
        this.bestCombo = this.comboCounter;
        this.comboText.textContent = this.bestCombo;
      }
    } else {
      this.sound.play("match");
    }

    this.score += 10 * this.comboCounter;
    this.scoreText.textContent = this.score;

    this.removeMap = [];
    for (let i = 0; i < gameOptions.fieldSize; i++) {
      this.removeMap[i] = [];
      for (let j = 0; j < gameOptions.fieldSize; j++) {
        this.removeMap[i].push(0);
      }
    }
    this.markMatches(HORIZONTAL);
    this.markMatches(VERTICAL);
    this.destroyBots();
  }
  markMatches(direction) {
    for (let i = 0; i < gameOptions.fieldSize; i++) {
      let colorStreak = 1;
      let currentColor = -1;
      let startStreak = 0;
      let colorToWatch = 0;
      for (let j = 0; j < gameOptions.fieldSize; j++) {
        if (direction == HORIZONTAL) {
          colorToWatch = this.botAt(i, j).botColor;
        } else {
          colorToWatch = this.botAt(j, i).botColor;
        }
        if (colorToWatch == currentColor) {
          colorStreak++;
        }
        if (colorToWatch != currentColor || j == gameOptions.fieldSize - 1) {
          if (colorStreak >= 3) {
            if (direction == HORIZONTAL) {
              console.log(
                "HORIZONTAL :: Length = " +
                  colorStreak +
                  " :: Start = (" +
                  i +
                  "," +
                  startStreak +
                  ") :: Color = " +
                  currentColor
              );
            } else {
              console.log(
                "VERTICAL :: Length = " +
                  colorStreak +
                  " :: Start = (" +
                  startStreak +
                  "," +
                  i +
                  ") :: Color = " +
                  currentColor
              );
            }
            for (let k = 0; k < colorStreak; k++) {
              if (direction == HORIZONTAL) {
                this.removeMap[i][startStreak + k]++;
              } else {
                this.removeMap[startStreak + k][i]++;
              }
            }
          }
          startStreak = j;
          colorStreak = 1;
          currentColor = colorToWatch;
        }
      }
    }
  }
  destroyBots() {
    let destroyed = 0;
    for (let i = 0; i < gameOptions.fieldSize; i++) {
      for (let j = 0; j < gameOptions.fieldSize; j++) {
        if (this.removeMap[i][j] > 0) {
          destroyed++;

          let botSprite = this.gameArray[i][j].botSprite;
          let emitter = this.particles.createEmitter({
            x: botSprite.x,
            y: botSprite.y,
            speed: { min: 100, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 400,
            blendMode: "ADD",
            gravityY: 200,
            quantity: 10,
          });

          emitter.explode(10, botSprite.x, botSprite.y);

          this.tweens.add({
            targets: this.gameArray[i][j].botSprite,
            alpha: 0.5,
            duration: gameOptions.destroySpeed,
            callbackScope: this,
            onComplete: function () {
              destroyed--;
              this.gameArray[i][j].botSprite.visible = false;
              this.poolArray.push(this.gameArray[i][j].botSprite);
              if (destroyed == 0) {
                this.makeBotsFall();
                this.replenishField();
              }
            },
          });
          this.gameArray[i][j].isEmpty = true;
        }
      }
    }
  }
  makeBotsFall() {
    for (let i = gameOptions.fieldSize - 2; i >= 0; i--) {
      for (let j = 0; j < gameOptions.fieldSize; j++) {
        if (!this.gameArray[i][j].isEmpty) {
          let fallTiles = this.holesBelow(i, j);
          if (fallTiles > 0) {
            this.tweens.add({
              targets: this.gameArray[i][j].botSprite,
              y:
                this.gameArray[i][j].botSprite.y +
                fallTiles * gameOptions.botSize,
              duration: gameOptions.fallSpeed * fallTiles,
            });
            this.gameArray[i + fallTiles][j] = {
              botSprite: this.gameArray[i][j].botSprite,
              botColor: this.gameArray[i][j].botColor,
              isEmpty: false,
            };
            this.gameArray[i][j].isEmpty = true;
          }
        }
      }
    }
  }
  holesBelow(row, col) {
    let result = 0;
    for (let i = row + 1; i < gameOptions.fieldSize; i++) {
      if (this.gameArray[i][col].isEmpty) {
        result++;
      }
    }
    return result;
  }
  replenishField() {
    let replenished = 0;
    let moved = false;
    for (let j = 0; j < gameOptions.fieldSize; j++) {
      let emptySpots = this.holesInCol(j);
      if (emptySpots > 0) {
        moved = true;
        for (let i = 0; i < emptySpots; i++) {
          replenished++;
          let randomColor = Phaser.Math.Between(0, gameOptions.botColors - 1);
          this.gameArray[i][j].botColor = randomColor;
          this.gameArray[i][j].botSprite = this.poolArray.pop();
          this.gameArray[i][j].botSprite.setFrame(randomColor);
          this.gameArray[i][j].botSprite.visible = true;
          this.gameArray[i][j].botSprite.x =
            gameOptions.botSize * j + gameOptions.botSize / 2;
          this.gameArray[i][j].botSprite.y =
            gameOptions.botSize / 2 - (emptySpots - i) * gameOptions.botSize;
          this.gameArray[i][j].botSprite.alpha = 1;
          this.gameArray[i][j].isEmpty = false;
          this.tweens.add({
            targets: this.gameArray[i][j].botSprite,
            y: gameOptions.botSize * i + gameOptions.botSize / 2,
            duration: gameOptions.fallSpeed * emptySpots,
            callbackScope: this,
            onComplete: function () {
              replenished--;
              if (replenished == 0) {
                if (this.matchInBoard()) {
                  this.time.addEvent({
                    delay: 250,
                    callback: this.handleMatches,
                    callbackScope: this,
                  });
                } else {
                  this.canPick = true;
                  this.selectedBot = null;
                  this.comboCounter = 0;
                }
              }
            },
          });
        }
      }
    }

    if (!moved && !this.matchInBoard()) {
      this.canPick = true;
      this.selectedBot = null;
      this.comboCounter = 0;
    }
  }
  holesInCol(col) {
    var result = 0;
    for (let i = 0; i < gameOptions.fieldSize; i++) {
      if (this.gameArray[i][col].isEmpty) {
        result++;
      }
    }
    return result;
  }
  updateTimer() {
    this.timeLeft--;
    this.timeText.textContent = this.timeLeft;

    if (this.timeLeft <= 0) {
      this.timerEvent.remove(false);
      this.gameOver();
    }
  }
  gameOver() {
    console.log("Game Over!");
    this.canPick = false;

    let highScores = JSON.parse(localStorage.getItem("highScores") || "[]");

    highScores.push({
      score: this.score,
      combo: this.bestCombo,
    });

    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10);

    localStorage.setItem("highScores", JSON.stringify(highScores));

    alert(
      `Game Over, Your Score: ${this.score}\nBest Combo: ${this.bestCombo}`
    );

    window.location.href = "leaderboard.html";
  }
}

function resize() {
  var canvas = document.querySelector("canvas");
  var windowWidth = window.innerWidth;
  var windowHeight = window.innerHeight;
  var windowRatio = windowWidth / windowHeight;
  var gameRatio = game.config.width / game.config.height;
  if (windowRatio < gameRatio) {
    canvas.style.width = windowWidth + "px";
    canvas.style.height = windowWidth / gameRatio + "px";
  } else {
    canvas.style.width = windowHeight * gameRatio + "px";
    canvas.style.height = windowHeight + "px";
  }
}
