"use strict";

var express = require("express");
var bodyParser = require("body-parser");
var app = express();

app.use(express.static(__dirname + "/client"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/client/index.html");
});

app.post("/", function(req, res) {
  var game = JSON.parse(req.body.game);
  var bot = req.body.bot;
  var bestMove = getBestMove(game, bot);
  res.send(bestMove);
});

var server = app.listen(process.env.PORT || 3000, function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log("TicTacToe App running on http://" + host + port);
});

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
    this.map = clone(game.map);
    this.gameLength = game.gameLength;
    this.isNextMoveX = game.isNextMoveX;
    this.isOver = game.isOver;
    this.winner = game.winner;
    this.score = game.score;
  },
  setGame: function(game) {
    this.map = clone(game.map);
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

function getPossibleMoves(game) {
  var possibleMoves = [];
  var possibleScores = [];
  var gameMap = game.map;

  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++) {
      if (gameMap[i][j] == null) possibleMoves.push({"i": i, "j": j});
      if (i == 2 && j == 2) return possibleMoves;
    }
  }
}

function getBestMove(game, bot) {
  var games = [];
  var _game = new Game();
  _game.copyGame(game);
  games.push(_game);

  // create move tree
  while (games.length > 0) {
    var current = games.pop();

    if (current.isOver) {
      // assign score
      if (current.winner == bot) {
        current.score = 1;
      } else if (current.winner == "D") {
        current.score = 0;
      } else {
        current.score = -1;
      }

      continue;
    }

    var possibleMoves = getPossibleMoves(current);
    for (var i = 0; i < possibleMoves.length; i++) {
      var next = new Game();
      next.setGame(current);

      next.makeMove(possibleMoves[i].i, possibleMoves[i].j);
      games.push(next);
    }
  }

  // get best path
  // run while the children are not evaluated OR the parent game is not null
  while (!_game.areChildrenEvaluated() || _game.parentGame != null) {
    if (_game.areChildrenEvaluated()) {
      var childrenScores = [];

      for (var i = 0; i < _game.children.length; i++) {
        childrenScores.push(_game.children[i].score);
      }

      if (_game.isNextMoveX == (bot == "X")) {
        _game.score = Math.max.apply(null, childrenScores);
      } else {
        _game.score = Math.min.apply(null, childrenScores);
      }

      _game = _game.parentGame;
    } else {
      _game = _game.getNextUnevaluatedChild();
    }
  }

  var scores = [];
  for (var i = 0; i < _game.children.length; i++) {
    scores.push(_game.children[i].score);
  }

  var maxScore = Math.max.apply(null, scores);
  var maxScoreGameIndices = [];

  for (var i = 0; i < _game.children.length; i++) {
    if (_game.children[i].score == maxScore) {
      maxScoreGameIndices.push(i);
    }
  }

  var bestGame = _game.children[maxScoreGameIndices[random(0, maxScoreGameIndices.length - 1)]];
  return getMoveDifference(_game, bestGame);
}

function getMoveDifference(gameA, gameB) {
  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++) {
      if (gameA.map[i][j] != gameB.map[i][j]) {
        return {"i": i, "j": j};
      }
    }
  }

  return null;
}

function clone(a) {
   return JSON.parse(JSON.stringify(a));
}

function random(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}
