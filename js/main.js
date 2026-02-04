// js/main.js
import { BRAWLERS } from './data/brawlers.js';
import { MAP_SKULL_CREEK, MAP_OUT_OPEN } from './data/maps.js';
import { Game } from './classes/game.js';

// Configuration constants exported for other files
export const CONFIG = {
    CANVAS_W: 1600,
    CANVAS_H: 900,
    TILE_SIZE: 50,
    BUSH_RANGE: 140
};

const game = new Game(BRAWLERS, {
    showdown: MAP_SKULL_CREEK,
    knockout: MAP_OUT_OPEN
});

window.onload = () => {
    game.init();
    
    // Start the animation loop
    function loop() {
        game.update();
        game.draw();
        requestAnimationFrame(loop);
    }
    loop();
};
