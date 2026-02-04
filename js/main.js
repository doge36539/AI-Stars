// js/main.js
import { BRAWLERS } from './data/brawlers.js';
import { MAP_SKULL_CREEK, MAP_OUT_OPEN } from './data/maps.js';
import { Brawler } from './classes/brawler.js';

export const CONFIG = {
    CANVAS_W: 1600,
    CANVAS_H: 900,
    TILE_SIZE: 50
};

// --- GET HTML ELEMENTS ---
const screenHome = document.getElementById('screen-home');
const screenSelect = document.getElementById('screen-select');
const btnShowdown = document.getElementById('btn-showdown');
const btnKnockout = document.getElementById('btn-knockout');
const grid = document.getElementById('grid');
const brawlerDesc = document.getElementById('brawler-desc');
const playBtn = document.getElementById('play-btn');


// --- CLASS: THE GAME ENGINE ---
class Game {
    constructor(brawlersData, mapData) {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CONFIG.CANVAS_W;
        this.canvas.height = CONFIG.CANVAS_H;

        this.brawlersData = brawlersData;
        this.mapData = mapData;
        
        this.entities = [];
        this.walls = [];
        this.bushes = [];
        
        this.state = 'MENU';
        this.keys = {};
        this.camera = { x: 0, y: 0 };
        this.selectedBrawler = null;
    }

    init() {
        // Keyboard tracking
        window.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);

        this.renderMenuGrid();
    }

    openSelect(mode) {
        this.mode = mode;
        screenHome.classList.add('hidden');
        screenSelect.classList.remove('hidden');
    }

    renderMenuGrid() {
        grid.innerHTML = '';
        this.brawlersData.forEach(b => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<div class="emoji-preview">${b.icon}</div><div style="color:white; font-size:12px;">${b.name}</div>`;
            card.onclick = () => {
                document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedBrawler = b;
                playBtn.disabled = false;
                brawlerDesc.innerText = b.desc;
            };
            grid.appendChild(card);
        });
    }

    startMatch() {
        screenSelect.classList.add('hidden');
        document.getElementById('hud').style.display = 'block';
        this.state = 'GAME';

        const map = this.mode === 'showdown' ? this.mapData.showdown : this.mapData.knockout;
        this.loadMap(map);

        this.player = new Brawler(this.selectedBrawler, 400, 400, 0, true, this);
        this.entities.push(this.player);
    }

    loadMap(ascii) {
        for (let r = 0; r < ascii.length; r++) {
            for (let c = 0; c < ascii[r].length; c++) {
                let x = c * CONFIG.TILE_SIZE, y = r * CONFIG.TILE_SIZE;
                if (ascii[r][c] === '#') this.walls.push({ x, y, w: CONFIG.TILE_SIZE, h: CONFIG.TILE_SIZE });
                if (ascii[r][c] === '~') this.bushes.push({ x, y, w: CONFIG.TILE_SIZE, h: CONFIG.TILE_SIZE });
            }
        }
    }

    update() {
        if (this.state !== 'GAME') return;
        this.camera.x += (this.player.x - this.canvas.width / 2 - this.camera.x) * 0.1;
        this.camera.y += (this.player.y - this.canvas.height / 2 - this.camera.y) * 0.1;
        this.entities.forEach(e => e.update());
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.state !== 'GAME') return;

        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        this.bushes.forEach(b => { this.ctx.fillStyle = '#27ae60'; this.ctx.fillRect(b.x, b.y, b.w, b.h); });
        this.walls.forEach(w => { this.ctx.fillStyle = '#7f8c8d'; this.ctx.fillRect(w.x, w.y, w.w, w.h); });
        this.entities.forEach(e => e.draw(this.ctx));
        
        this.ctx.restore();
    }
}

// Start the whole thing
const game = new Game(BRAWLERS, { showdown: MAP_SKULL_CREEK, knockout: MAP_OUT_OPEN });
game.init();


function mainLoop() {
    game.update();
    game.draw();
    requestAnimationFrame(mainLoop);
}
mainLoop();
