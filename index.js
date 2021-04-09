"use strict";

const BLACK = 0, WHITE = 1;
const boardSize = 8, bitSize = 32;
class Board {
    #blackStone1;
    #blackStone2;
    #whiteStone1;
    #whiteStone2;
    constructor() {
        this.#blackStone1 = 0, this.#blackStone2 = 0;
        this.#whiteStone1 = 0, this.#whiteStone2 = 0;
    }

    position(x, y) {
        return x * boardSize + y;
    }

    put(x, y, color) {
        var p = this.position(x, y);
        if (color == BLACK) {
            if (p < bitSize) {
                this.#blackStone1 |= 1 << p;
            } else {
                this.#blackStone2 |= 1 << (p - 32);
            }
        } else {
            if (p < bitSize) {
                this.#whiteStone1 |= 1 << p;
            } else {
                this.#whiteStone2 |= 1 << (p - 32);
            }
        }
    }

    flip(x, y, color) {
        this.put(x, y, color);
        var p = this.position(x, y);
        if (color == BLACK) {
            if (p < bitSize) this.#whiteStone1 ^= 1 << p;
            else this.#whiteStone2 ^= 1 << (p - 32);

        } else {
            if (p < bitSize) this.#blackStone1 ^= 1 << p;
            else this.#blackStone2 ^= 1 << (p - 32);

        }

    }

    countStone(color) {
        var res = 0;
        if (color == BLACK) {
            for (var i = 0; i < bitSize; ++i) {
                if ((this.#blackStone1 >> i) & 1) ++res;
                if ((this.#blackStone2 >> i) & 1) ++res;
            }
        } else {
            for (var i = 0; i < bitSize; ++i) {
                if ((this.#whiteStone1 >> i) & 1) ++res;
                if ((this.#whiteStone2 >> i) & 1) ++res;
            }
        }
        return res;
    }

    isStone(x, y, color) {
        var p = this.position(x, y);
        if (color == BLACK) {
            if (p < 32) return (this.#blackStone1 >> p) & 1;
            else return (this.#blackStone2 >> (p - 32)) & 1;
        } else {
            if (p < 32) return (this.#whiteStone1 >> p) & 1;
            else return (this.#whiteStone2 >> (p - 32)) & 1;
        }
    }

    isSpace(x, y) {
        return !this.isStone(x, y, BLACK) && !this.isStone(x, y, WHITE);
    }
}

var WeightData = [
    [30, -12, 0, -1, -1, 0, -12, 30],
    [-12, -15, -3, -3, -3, -3, -15, -12],
    [0, -3, 0, -1, -1, 0, -3, 0],
    [-1, -3, -1, -1, -1, -1, -3, -1],
    [-1, -3, -1, -1, -1, -1, -3, -1],
    [0, -3, 0, -1, -1, 0, -3, 0],
    [-12, -15, -3, -3, -3, -3, -15, -12],
    [30, -12, 0, -1, -1, 0, -12, 30],
];
var board = new Board();
var myTurn = false;

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

    var blackFlip = canFlip(BLACK);
    var whiteFlip = canFlip(WHITE);

    if (blackFlip == 0 && whiteFlip == 0) {
        showMessage("ゲームオーバー");
        if (numWhite > numBlack) {
            showMessage("あなたの負け！");
        } else if (numBlack > numWhite) {
            showMessage("あなたの勝ち！");
        } else {
            showMessage("引き分け！")
        }
    } else if (blackFlip == 0 && !myTurn) {
        showMessage("黒スキップ");
        myTurn = false;
    } else if (whiteFlip == 0 && myTurn) {
        showMessage("白スキップ");
        myTurn = true;
    } else {
        myTurn = !myTurn;
    }
    if (!myTurn) {
        setTimeout(solve, 1000);
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

    var flipped = getFlipCells(x, y, BLACK)
    if (flipped.length > 0) {
        for (var k = 0; k < flipped.length; k++) {
            board.flip(flipped[k][0], flipped[k][1], BLACK);
        }
        board.put(x, y, BLACK);
        update();
    }
}

function solve() {
    var highScore = -1000;
    var px = -1, py = -1;
    for (var x = 0; x < boardSize; ++x) {
        for (var y = 0; y < boardSize; ++y) {
            var nextBoard = copyBoard();
            var flipped = getFlipCells(x, y, WHITE);
            if (flipped.length > 0) {
                for (var k = 0; k < flipped.length; ++k) {
                    nextBoard.flip(flipped[k][0], flipped[k][1], WHITE);
                }
                nextBoard.put(x, y, WHITE);
                var score = calcWeightData(nextBoard);
                if (score > highScore) {
                    highScore = score;
                    px = x, py = y;
                }
            }
        }
    }

    if (px >= 0 && py >= 0) {
        var flipped = getFlipCells(px, py, WHITE);
        console.log(px, py, flipped.length);
        for (var k = 0; k < flipped.length; ++k) {
            board.flip(flipped[k][0], flipped[k][1], WHITE);
        }
        board.put(px, py, WHITE);
    }
    update();
}

function calcWeightData(nextBoard) {
    var score = 0;
    for (var x = 0; x < boardSize; x++) {
        for (var y = 0; y < boardSize; y++) {
            if (nextBoard.isStone(x, y, WHITE)) {
                score += WeightData[x][y];
            }
        }
    }
    return score;
}

function copyBoard() {
    var res = new Board();
    for (var x = 0; x < boardSize; ++x) {
        for (var y = 0; y < boardSize; ++y) {
            if (board.isStone(x, y, BLACK)) res.put(x, y, BLACK);
            else if (board.isStone(x, y, WHITE)) res.put(x, y, WHITE);
        }
    }
    return res;
}

function canFlip(color) {
    for (var x = 0; x < boardSize; ++x) {
        for (var y = 0; y < boardSize; ++y) {
            var flipped = getFlipCells(x, y, color);
            if (flipped.length > 0) {
                return true;
            }
        }
    }
    return false;
}

function getFlipCells(x, y, color) {
    if (!board.isSpace(x, y)) {
        return [];
    }
    var dirs = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
    var res = [];
    for (var k = 0; k < dirs.length; ++k) {
        var flipped = getFlipCellsOneDir(x, y, dirs[k][0], dirs[k][1], color);
        res = res.concat(flipped)
    }
    return res;
}

function getFlipCellsOneDir(fx, fy, dx, dy, color) {
    var x = fx, y = fy;
    var res = [];
    while (true) {
        x += dx;
        y += dy;
        if (!inBoard(x, y) || board.isSpace(x, y)) return [];
        if (board.isStone(x, y, color)) break;
        res.push([x, y]);
    }
    return res;
}
