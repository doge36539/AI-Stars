import { BRAWLERS } from './data/brawlers.js';
import { MAP_SKULL_CREEK, MAP_OUT_OPEN } from './data/maps.js';
import { Game } from './classes/Game.js';

// Global Config
export const CONFIG = {
    CANVAS_W: 1600,
    CANVAS_H: 900,
    TILE_SIZE: 50,
    BUSH_RANGE: 140
};

// Initialize the Game
const game = new Game(BRAWLERS, { showdown: MAP_SKULL_CREEK, knockout: MAP_OUT_OPEN });
game.init();
