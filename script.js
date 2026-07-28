'use strict';

/**
 *  CONFIG / CONSTS
 */
const CONFIG = Object.freeze({
    BLOCK_SIZE: 20,
    ROWS: 24,
    COLS: 14,
    EMPTY: -1,
    DROP_INTERVAL_MS: 1000,
    POINTS_PER_LINE: 100,
});

const SHAPES = Object.freeze([
    [[1], [1], [1], [1]],              // I
    [[1, 1], [1, 1]],                  // O
    [[0, 1, 0], [1, 1, 1]],            // T
    [[1, 0, 0], [1, 1, 1]],            // J
    [[0, 0, 1], [1, 1, 1]],            // L 
    [[0, 1, 1], [1, 1, 0]],            // S
    [[1, 1, 0], [0, 1, 1]],            // Z
]);

/**
 *  UTILS
 */
const randomInt = (max) => Math.floor(Math.random() * max);

function rotateMatrix(shape) {
    const rows = shape.length;
    const cols = shape[0].length;
    const result = [];

    for (let c = 0; c < cols; c++) {
        const newRow = [];
        
        for (let r = rows - 1; r >= 0; r--) {
            newRow.push(shape[r][c]);
        }
        
        result.push(newRow);
    }

    return result;
}

/**
 *  AUDIO
 */
class AudioController {
    constructor(src, toggleButtons) {
        this.audio = new Audio(src);
        this.audio.loop = true;
        this.audio.volume = 0.5;
        this.isPlaying = false;
        this.toggleButtons = Array.from(toggleButtons);

        this.toggleButtons.forEach((button) =>
             button.addEventListener('click', () => this.toggle()));
    }

    play() {
        if (this.isPlaying) return;
        this.audio.play().catch(() => {
        });
        this.isPlaying = true;
        this.updateButtonsText('Pause Sound');
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updateButtonsText('Play Sound');
    }

    updateButtonsText(text) {
        this.toggleButtons.forEach((button) => {
            button.textContent = text;
        });
    }

    toggle() {
        this.isPlaying ? this.pause() : this.play();
    }
}

/**
 *  PIEZA (TETROMINO)
 */
class Piece {
    constructor(colorCount) {
        this.colorCount = colorCount;
        this.reset();
    }

    reset() {
        this.x = Math.floor(CONFIG.COLS / 2) - 1;
        this.y = -1;
        this.shape = SHAPES[randomInt(SHAPES.length)];
        this.color = randomInt(this.colorCount);
    }

    get rotated() {
        return rotateMatrix(this.shape);
    }
}

/**
 *  TABLERO / LÓGICA DEL JUEGO
 */
class Board {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.grid = this.createEmptyGrid();
    }

    createEmptyGrid() {
        return Array.from({ length: this.rows }, () =>
            Array(this.cols).fill(CONFIG.EMPTY)
        );
    }

    reset() {
        this.grid = this.createEmptyGrid();
    }

    isValidPosition(shape, x, y) {
        return shape.every((row, yOffset) =>
            row.every((value, xOffset) => {
                if (value === 0) return true;

                const nextY = y + yOffset;
                const nextX = x + xOffset;

                if (nextY < 0) return true; // aún por encima del tablero
                if (nextX < 0 || nextX >= this.cols || nextY >= this.rows) return false;

                return this.grid[nextY][nextX] === CONFIG.EMPTY;
            })
        );
    }

    solidify(piece) {
        piece.shape.forEach((row, yOffset) => {
            row.forEach((value, xOffset) => {
                if (value === 0) return;

                const targetY = piece.y + yOffset;
                const targetX = piece.x + xOffset;

                if (targetY >= 0 && targetX >= 0 && targetX < this.cols) {
                    this.grid[targetY][targetX] = piece.color;
                }
            });
        });
    }

    /**
     * Elimina las líneas completas y devuelve cuántas se limpiaron.
     */
    clearFullLines() {
        let linesCleared = 0;

        for (let y = this.rows - 1; y >= 0; y--) {
            const isLineFull = this.grid[y].every((value) => value !== CONFIG.EMPTY);

            if (isLineFull) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(this.cols).fill(CONFIG.EMPTY));
                linesCleared++;
                y++; // vuelve a evaluar la misma fila (ahora ocupada por la de arriba)
            }
        }

        return linesCleared;
    }
}

/**
 *  RENDER
 */
class Renderer {
    constructor(canvas, blockImages, blockSize) {
        this.ctx = canvas.getContext('2d');
        this.canvas = canvas;
        this.blockImages = blockImages;
        this.blockSize = blockSize;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBlock(colorIndex, x, y) {
        this.ctx.drawImage(
            this.blockImages[colorIndex],
            0, 0, 32, 32,
            x * this.blockSize, y * this.blockSize,
            this.blockSize, this.blockSize
        );
    }

    drawPiece(piece) {
        piece.shape.forEach((row, yOffset) => {
            row.forEach((value, xOffset) => {
                if (value !== 0) {
                    this.drawBlock(piece.color, piece.x + xOffset, piece.y + yOffset);
                }
            });
        });
    }

    drawBoard(grid) {
        grid.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== CONFIG.EMPTY) {
                    this.drawBlock(value, x, y);
                }
            });
        });
    }

    drawGameOver(show, menuManager) {
        if (show) {
            menuManager.showGameOverMenu();
        } else {
            menuManager.hideAllMenus();
        }
    }

    drawMenuPause(show, menuManager) {
        if (show) {
            menuManager.showPauseMenu();
        }
    }
}

/**
 *  GAME
 */
class Game {
    constructor({ canvas, blockImages, scoreElement, menuManager }) {
        canvas.width = CONFIG.COLS * CONFIG.BLOCK_SIZE;
        canvas.height = CONFIG.ROWS * CONFIG.BLOCK_SIZE;

        this.renderer = new Renderer(canvas, blockImages, CONFIG.BLOCK_SIZE);
        this.board = new Board(CONFIG.ROWS, CONFIG.COLS);
        this.piece = new Piece(blockImages.length);
        this.scoreElement = scoreElement;
        this.menuManager = menuManager;

        this.score = 0;
        this.isGameOver = false;
        this.pause = false;
        this.lastDropTime = 0;
        this.animationFrameId = null;

        this.bindInput();
    }

    start() { 
        this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
    }
    
    reset() {
        this.isGameOver = false;
        this.pause = false;
        this.score = 0;
        this.board.reset();
        this.piece.reset();
        this.menuManager.hideAllMenus();
    }

    moveDown() {
        if (this.isGameOver) return;

        if (this.board.isValidPosition(this.piece.shape, this.piece.x, this.piece.y + 1)) {
            this.piece.y++;
            return;
        }

        if (this.piece.y <= 0) {
            this.isGameOver = true;
            return;
        }

        this.board.solidify(this.piece);
        this.piece.reset();
    }

    moveHorizontal(direction) {
        const nextX = this.piece.x + direction;
        if (this.board.isValidPosition(this.piece.shape, nextX, this.piece.y)) {
            this.piece.x = nextX;
        }
    }

    rotate() {
        const rotatedShape = this.piece.rotated;

        if (!this.board.isValidPosition(rotatedShape, this.piece.x, this.piece.y)) {
            return;
        }

        this.piece.shape = rotatedShape;

        const overflow = this.piece.x + rotatedShape[0].length - CONFIG.COLS;
        if (overflow > 0) {
            this.piece.x -= overflow;
        }
    }

    bindInput() {
        const KEY_ACTIONS = {
            ArrowLeft: () => this.moveHorizontal(-1),
            ArrowRight: () => this.moveHorizontal(1),
            ArrowDown: () => this.moveDown(),
            ArrowUp: () => this.rotate(),
        };

        document.addEventListener('keydown', (event) => {
            if (this.isGameOver) {
                if (event.key === 'Enter') {
                    this.reset();
                }
                return;
            }

            if (event.key === 'Escape') {
                this.pause = !this.pause;
                return;
            }

            if (this.pause) {
                return;
            }

            const action = KEY_ACTIONS[event.key];
            if (action) action();
        });

        // Resume button listener
        const resumeButton = document.getElementById('resume-btn');
        if (resumeButton) {
            resumeButton.addEventListener('click', () => {
                this.pause = false;
            });
        }

        // Restart button listener
        const restartButtons = document.querySelectorAll('.restart-btn');
        if (restartButtons.length > 0) {
            restartButtons.forEach((button) => {
                button.addEventListener('click', () => {
                    this.reset();
                });
            });
        }
    }

    updateScore(linesCleared) {
        if (linesCleared > 0) {
            this.score += linesCleared * CONFIG.POINTS_PER_LINE;
        }
    }

    /**
     * main loop
     */
    loop(timestamp) {
        if (!this.pause && !this.isGameOver) {
            if (timestamp - this.lastDropTime >= CONFIG.DROP_INTERVAL_MS) {
                this.moveDown();
                this.lastDropTime = timestamp;
            }
        }

        this.render();

        this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
    }

    render() {
        this.renderer.clear();
        this.renderer.drawPiece(this.piece);
        this.renderer.drawBoard(this.board.grid);

        const linesCleared = this.board.clearFullLines();
        this.updateScore(linesCleared);

        // Update score element(s). Support single element or collection (.score in multiple places)
        if (this.scoreElement) {
            if (this.scoreElement.length !== undefined) {
                for (const el of this.scoreElement) {
                    if (el) el.textContent = `${this.score}`;
                }
            } else if (this.scoreElement.textContent !== undefined) {
                this.scoreElement.textContent = `${this.score}`;
            }
        }

        this.renderer.drawGameOver(this.isGameOver, this.menuManager);
        this.renderer.drawMenuPause(this.pause && !this.isGameOver, this.menuManager);
    }
}

/**
 *  MENU MANAGER
 */
class MenuManager {
    constructor() {
        this.startMenu = document.getElementById('start-menu');
        this.gameOverMenu = document.getElementById('game-over-menu');
        this.pauseMenu = document.getElementById('pause-menu');
    }

    showStartMenu() {
        this.startMenu.hidden = false;
        this.gameOverMenu.hidden = true;
        this.pauseMenu.hidden = true;
    }

    hideStartMenu() {
        this.startMenu.hidden = true;
    }

    showGameOverMenu() {
        this.gameOverMenu.hidden = false;
        this.pauseMenu.hidden = true;
        this.startMenu.hidden = true;
    }

    showPauseMenu() {
        this.pauseMenu.hidden = false;
        this.gameOverMenu.hidden = true;
    }

    hideAllMenus() {
        this.gameOverMenu.hidden = true;
        this.pauseMenu.hidden = true;
        this.startMenu.hidden = true;
    }
}

/**
 *  START MENU
 */
function StartMenu(menuManager, onPlay) {
    const button = document.getElementById('start-button');

    button.addEventListener('click', () => {
        menuManager.hideStartMenu();
        onPlay();
    });
}

function initGame() {
    const canvas = document.querySelector('canvas');
    const scoreElement = document.getElementsByClassName('score');
    const audioBtns = document.querySelectorAll('.btn-audio');
    const menuManager = new MenuManager();
    
    menuManager.showStartMenu(); 

    const blockImages = [
        'red-block', 'blue-block', 'green-block',
        'yellow-block', 'purple-block', 'pink-block', 'cyan-block',
    ].map((id) => document.getElementById(id));

    StartMenu(menuManager, () => {
        if (audioBtns.length > 0) {
            new AudioController('assets/music/audio.mp3', audioBtns).toggle();
        }

        const game = new Game({ canvas, blockImages, scoreElement, menuManager });
        game.start();
    });
}

document.addEventListener('DOMContentLoaded', initGame);