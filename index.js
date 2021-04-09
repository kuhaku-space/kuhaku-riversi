"use strict";

const BLACK = false, WHITE = true;
const boardSize = 8, bitSize = 32;
const WeightData = [
    [100, -12, 0, -1, -1, 0, -12, 100],
    [-12, -15, -3, -3, -3, -3, -15, -12],
    [0, -3, 0, -1, -1, 0, -3, 0],
    [-1, -3, -1, -1, -1, -1, -3, -1],
    [-1, -3, -1, -1, -1, -1, -3, -1],
    [0, -3, 0, -1, -1, 0, -3, 0],
    [-12, -15, -3, -3, -3, -3, -15, -12],
    [100, -12, 0, -1, -1, 0, -12, 100],
];
class Board {
    constructor() {
        this.blackStone1 = 0, this.blackStone2 = 0;
        this.whiteStone1 = 0, this.whiteStone2 = 0;
    }

    position(x, y) {
        return x * boardSize + y;
    }

    put(x, y, color) {
        var p = this.position(x, y);
        if (color == BLACK) {
            if (p < bitSize) {
                this.blackStone1 |= 1 << p;
            } else {
                this.blackStone2 |= 1 << (p - 32);
            }
        } else {
            if (p < bitSize) {
                this.whiteStone1 |= 1 << p;
            } else {
                this.whiteStone2 |= 1 << (p - 32);
            }
        }
    }

    flip(x, y, color) {
        this.put(x, y, color);
        var p = this.position(x, y);
        if (color == BLACK) {
            if (p < bitSize) this.whiteStone1 ^= 1 << p;
            else this.whiteStone2 ^= 1 << (p - 32);

        } else {
            if (p < bitSize) this.blackStone1 ^= 1 << p;
            else this.blackStone2 ^= 1 << (p - 32);

        }

    }

    countStone(color) {
        var res = 0;
        if (color == BLACK) {
            for (var i = 0; i < bitSize; ++i) {
                if ((this.blackStone1 >> i) & 1) ++res;
                if ((this.blackStone2 >> i) & 1) ++res;
            }
        } else {
            for (var i = 0; i < bitSize; ++i) {
                if ((this.whiteStone1 >> i) & 1) ++res;
                if ((this.whiteStone2 >> i) & 1) ++res;
            }
        }
        return res;
    }

    isStone(x, y, color) {
        var p = this.position(x, y);
        if (color == BLACK) {
            if (p < 32) return (this.blackStone1 >> p) & 1;
            else return (this.blackStone2 >> (p - 32)) & 1;
        } else {
            if (p < 32) return (this.whiteStone1 >> p) & 1;
            else return (this.whiteStone2 >> (p - 32)) & 1;
        }
    }

    isSpace(x, y) {
        return !this.isStone(x, y, BLACK) && !this.isStone(x, y, WHITE);
    }

    isFlip(x, y, color) {
        if (!this.isSpace(x, y)) return false;
        for (var dx = -1; dx <= 1; ++dx) {
            for (var dy = -1; dy <= 1; ++dy) {
                if (dx == 0 && dy == 0) continue;
                var v = this.getFlipCellsOneDir(x, y, dx, dy, color);
                if (v.length > 0) return true;
            }
        }
        return false;
    }

    canFlip(color) {
        for (var x = 0; x < boardSize; ++x) {
            for (var y = 0; y < boardSize; ++y) {
                if (this.isFlip(x, y, color)) return true;
            }
        }
        return false;
    }

    isFinish() {
        return !this.canFlip(BLACK) && !this.canFlip(WHITE);
    }

    getFlipCells(x, y, color) {
        if (!this.isSpace(x, y)) return [];
        var res = [];
        for (var dx = -1; dx <= 1; ++dx) {
            for (var dy = -1; dy <= 1; ++dy) {
                if (dx == 0 && dy == 0) continue;
                var v = this.getFlipCellsOneDir(x, y, dx, dy, color);
                res = res.concat(v)
            }
        }
        return res;
    }

    getFlipCellsOneDir(x, y, dx, dy, color) {
        var res = [];
        var tx = x, ty = y;
        while (true) {
            tx += dx, ty += dy;
            if (!inBoard(tx, ty) || this.isSpace(tx, ty)) return [];
            if (this.isStone(tx, ty, color)) break;
            res.push([tx, ty]);
        }
        return res;
    }

    calcWeightData(color) {
        var score = 0;
        for (var x = 0; x < boardSize; x++) {
            for (var y = 0; y < boardSize; y++) {
                if (this.isStone(x, y, color)) score += WeightData[x][y];
                else if (this.isStone(x, y, !color)) score -= WeightData[x][y];
            }
        }
        return score;
    }

    calcScore(color) {
        return this.countStone(color) - this.countStone(!color);
    }
}

var board = new Board();
var myTurn = false;
var isFinish = false;

function init() {
    var b = document.getElementById("board");
    for (var x = 0; x < boardSize; x++) {
        var tr = document.createElement("tr");
        for (var y = 0; y < boardSize; y++) {
            var td = document.createElement("td");
            td.className = "cell";
            td.id = "cell" + x + y;
            td.onclick = clicked;
            tr.appendChild(td);
        }
        b.appendChild(tr);
    }
    board.put(3, 3, BLACK);
    board.put(4, 4, BLACK);
    board.put(3, 4, WHITE);
    board.put(4, 3, WHITE);
    update();
}

function inBoard(x, y) {
    return x >= 0 && x < boardSize && y >= 0 && y < boardSize
}

function update() {
    if (isFinish) return;
    var numBlack = board.countStone(BLACK);
    var numWhite = board.countStone(WHITE);
    document.getElementById("numBlack").textContent = numBlack;
    document.getElementById("numWhite").textContent = numWhite;

    for (var x = 0; x < boardSize; ++x) {
        for (var y = 0; y < boardSize; ++y) {
            if (board.isSpace(x, y)) continue;
            var c = document.getElementById("cell" + x + y);
            c.textContent = "●";
            c.className = "cell " + (board.isStone(x, y, BLACK) ? "black" : "white");
        }
    }

    var blackFlip = board.canFlip(BLACK);
    var whiteFlip = board.canFlip(WHITE);

    if (!blackFlip && !whiteFlip) {
        isFinish = true;
        if (numWhite > numBlack) {
            showMessage("あなたの負け！");
        } else if (numBlack > numWhite) {
            showMessage("あなたの勝ち！");
        } else {
            showMessage("引き分け！")
        }
    } else if (!blackFlip && !myTurn) {
        showMessage("黒スキップ");
        myTurn = false;
    } else if (!whiteFlip && myTurn) {
        showMessage("白スキップ");
        myTurn = true;
    } else {
        myTurn = !myTurn;
    }
    if (!myTurn) {
        setTimeout(solve, 100, WHITE);
    }
}

function showMessage(str) {
    document.getElementById("message").textContent = str;
    setTimeout(function () {
        document.getElementById("message").textContent = "";
    }, 2000);
}

function clicked(e) {
    if (!myTurn) {
        return;
    }
    var id = e.target.id;
    var x = parseInt(id.charAt(4));
    var y = parseInt(id.charAt(5));
    console.log(x, y);

    if (board.isFlip(x, y, BLACK)) {
        var flipped = board.getFlipCells(x, y, BLACK)
        for (var k = 0; k < flipped.length; k++) {
            board.flip(flipped[k][0], flipped[k][1], BLACK);
        }
        board.put(x, y, BLACK);
        update();
    }
}

function solve(color) {
    var highScore = -1000000;
    var px = -1, py = -1;
    for (var x = 0; x < boardSize; ++x) {
        for (var y = 0; y < boardSize; ++y) {
            var flipped = board.getFlipCells(x, y, color);
            if (flipped.length > 0) {
                var nextBoard = copyBoard(board);
                for (var k = 0; k < flipped.length; ++k) {
                    nextBoard.flip(flipped[k][0], flipped[k][1], color);
                }
                nextBoard.put(x, y, color);
                var score = -gameTree(nextBoard, !color, -highScore, 0);
                console.log(x, y, score);
                if (score > highScore) {
                    highScore = score;
                    px = x, py = y;
                }
            }
        }
    }

    if (px >= 0 && py >= 0) {
        var flipped = board.getFlipCells(px, py, color);
        for (var k = 0; k < flipped.length; ++k) {
            board.flip(flipped[k][0], flipped[k][1], color);
        }
        board.put(px, py, color);
    }
    update();
}

function gameTree(originBoard, color, maxScore, depth) {
    if (originBoard.isFinish()) return originBoard.calcScore(color) * 1000;
    if (depth == 6) return originBoard.calcWeightData(color);
    var highScore = -1000000;
    for (var x = 0; x < boardSize; ++x) {
        for (var y = 0; y < boardSize; ++y) {
            var flipped = board.getFlipCells(x, y, color);
            if (flipped.length > 0) {
                var nextBoard = copyBoard(originBoard);
                for (var k = 0; k < flipped.length; ++k) {
                    nextBoard.flip(flipped[k][0], flipped[k][1], color);
                }
                nextBoard.put(x, y, color);
                var score = -gameTree(nextBoard, !color, -highScore, depth + 1);
                if (score > highScore) highScore = score;
                if (highScore >= maxScore) return highScore;
            }
        }
    }
    if (highScore == -1000000) return -gameTree(nextBoard, !color, -highScore, deoth + 1);
    return highScore;
}

function copyBoard(originBoard) {
    var res = new Board();
    res.blackStone1 = originBoard.blackStone1;
    res.blackStone2 = originBoard.blackStone2;
    res.whiteStone1 = originBoard.whiteStone1;
    res.whiteStone2 = originBoard.whiteStone2;
    return res;
}
