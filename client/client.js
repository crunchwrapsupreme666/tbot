var game = null;
var moveRequested = false;

function animateOut(view) {
  view.removeClass("fadeSlideOut").removeClass("fadeSlideIn");
  view.offsetWidth = view.offsetWidth;
  view.addClass("fadeSlideOut");
  setTimeout(function() {
    view.hide();
  }, 400);
}

function animateIn(view) {
  view.removeClass("fadeSlideOut").removeClass("fadeSlideIn");
  view.offsetWidth = view.offsetWidth;
  view.addClass("fadeSlideIn");
  setTimeout(function() {
    view.css("display", "inline-block");
  }, 400);
}

function Game() {
  this.map = [[], [], []];
  this.gameLength = 0;
  this.isNextMoveX = true;
  this.isOver = false;
  this.winner = null;
  this.score = null;
  this.parentGame = null;
  this.children = [];
}

Game.prototype = {
  constructor: Game,
  copyGame: function(game) {
    this.map = jQuery.extend(true, {}, game.map);
    this.gameLength = game.gameLength;
    this.isNextMoveX = game.isNextMoveX;
    this.isOver = game.isOver;
    this.winner = game.winner;
    this.score = game.score;
  },
  setGame: function(game) {
    this.map = jQuery.extend(true, {}, game.map);
    this.gameLength = game.gameLength;
    this.isNextMoveX = game.isNextMoveX;
    this.isOver = game.isOver;
    this.winner = game.winner;
    this.score = game.score;
    this.parentGame = game;
    game.children.push(this);
  },
  makeMove: function(i, j) {
    if (!this.isOver && this.map[i][j] == null) {
      this.isNextMoveX ? (this.map[i][j] = "X") : (this.map[i][j] = "O");
      this.gameLength++;
      this.isNextMoveX = !this.isNextMoveX;
      if (this.gameLength >= 5) this.checkGame();
    }
  },
  checkGame: function() {
    // check horizontal win
    for (var i = 0; i < 3; i++) {
      var left = this.map[i][0],
          center = this.map[i][1],
          right = this.map[i][2];
      if (left == center && center == right && left != null) {
        this.isOver = true;
        this.winner = left;
        return;
      }
    }

    // check vertical win
    for (var i = 0; i < 3; i++) {
      var top = this.map[0][i],
          center = this.map[1][i],
          bottom = this.map[2][i];
      if (top == center && center == bottom && top != null) {
        this.isOver = true;
        this.winner = top;
        return;
      }
    }

    // check diagonal win
    var topLeft = this.map[0][0],
        topRight = this.map[0][2],
        centerCenter = this.map[1][1],
        bottomRight = this.map[2][2],
        bottomLeft = this.map[2][0];
    if (topLeft == centerCenter && centerCenter == bottomRight && topLeft != null) {
      this.isOver = true;
      this.winner = topLeft;
      return;
    } else if (topRight == centerCenter && centerCenter == bottomLeft && topRight != null) {
      this.isOver = true;
      this.winner = topRight;
      return;
    }

    // check draw
    if (this.gameLength == 9) {
      this.isOver = true;
      this.winner = "D";
      return;
    }
  },
  areChildrenEvaluated: function() {
    if (this.score != null) return true;

    for (var i = 0; i < this.children.length; i++) {
      if (this.children[i].score == null) return false;
    }

    return true;
  },
  getNextUnevaluatedChild: function() {
    for (var i = 0; i < this.children.length; i++) {
      if (this.children[i].score == null) {
        return this.children[i];
      }
    }
  }
}

function drawGame(game) {
  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++) {
      if (game.map[i][j] != null) {
        $("#q" + i + j).html(game.map[i][j])
      } else {
        $("#q" + i + j).html("");
      }
    }
  }
}

var playXButton = $("#play_x");
var playOButton = $("#play_o");
var currentTurnText = $(".current_turn_text");
var menuView = $(".menu");
var gameView = $(".game");
var player = null;
var bot = null;
var currentTurnTextOn = false;

playXButton.click(function() {
  animateOut(menuView);
  animateIn(gameView);
  player = "X";
  bot = "O";
  game = new Game();
  drawGame(game);
  setCurrentTurnText();
});

playOButton.click(function() {
  animateOut(menuView);
  animateIn(gameView);
  player = "O";
  bot = "X";
  game = new Game();
  drawGame(game);
  setCurrentTurnText();
  loaderView();
  getBestMove(game, bot);
});

$(".cell").click(function(e) {
  if (game.isNextMoveX == (player == "X") && !game.isOver) {
    var position = {"i": parseInt($(e)[0].toElement.id[1]), "j": parseInt($(e)[0].toElement.id[2])};
    if (game.map[position.i][position.j] == null) {
      game.makeMove(position.i, position.j);
      drawGame(game);
      setCurrentTurnText();
      loaderView();
      getBestMove(game, bot);
      moveRequested = true;
    }
  }
});

function getBestMove(game, bot) {
  var host = window.location.host;
  $.ajax({
    url: "http://" + host + "/",
    method: "POST",
    data: {game: JSON.stringify(game), bot: bot},
    success: function(data) {
      moveRequested = false;
      game.makeMove(data.i, data.j);
      drawGame(game);
      setCurrentTurnText();
    },
    error: function() {
      console.log("Error occurred with POST request:");
      console.log(error);
      moveRequested = false;
    }
  });
}

function loaderView() {
  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++) {
      if (game.map[i][j] == null) {
        $("#q" + i + j).html("<div class='loader'></div>");
      }
    }
  }
}

function restartGame() {
  currentTurnTextOn = false;
  currentTurnText.css("cursor", "auto");
  currentTurnText.css("background-color", "rgba(0,0,0,0.75)");
  animateOut(gameView);
  setTimeout(function() {
    animateIn(menuView);
  }, 300);
}

function setCurrentTurnText() {
  if (game.isOver) {
    declareWinner();
  } else if (game.isNextMoveX == (player == "X")) {
    currentTurnText.text("Your turn!");
  } else {
    currentTurnText.text("TBot's turn!");
  }
}

function declareWinner() {
  var winner = game.winner;
  if (winner == "D") {
    currentTurnText.text("It's a draw! Play again?");
    currentTurnTextOn = true;
    currentTurnText.css("cursor", "pointer");
    currentTurnText.css("background-color", "#2196F3");
  } else {
    currentTurnText.text("TBot wins! Play again?");
    currentTurnTextOn = true;
    currentTurnText.css("cursor", "pointer");
    currentTurnText.css("background-color", "#2196F3");
  }
}

currentTurnText.click(function() {
  if (currentTurnTextOn) {
    restartGame();
  }
});
