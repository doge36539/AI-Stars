// js/main.js
import { BRAWLERS } from './data/brawlers.js';
import { MAP_SKULL_CREEK, MAP_OUT_OPEN } from './data/maps.js';

export const CONFIG = {
    CANVAS_W: 1600,
    CANVAS_H: 900,
    TILE_SIZE: 50
};

// --- CLASS: THE PLAYER/BOT ---
class Entity {
    constructor(data, x, y, team, isPlayer, gameInstance) {
        this.data = data;
        this.x = x; this.y = y;
        this.team = team;
        this.isPlayer = isPlayer;
        this.game = gameInstance;
        this.hp = data.hp;
        this.maxHp = data.hp;
        this.vx = 0; this.vy = 0;
    }

    update() {
        if (this.isPlayer) {
            this.vx = 0; this.vy = 0;
            if (this.game.keys['w']) this.vy = -this.data.speed;
            if (this.game.keys['s']) this.vy = this.data.speed;
            if (this.game.keys['a']) this.vx = -this.data.speed;
            if (this.game.keys['d']) this.vx = this.data.speed;
        }
        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx) {
        ctx.font = '40px serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.data.icon, this.x, this.y);
        
        // Health Bar
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 30, this.y - 50, 60, 6);
        ctx.fillStyle = 'lime';
        ctx.fillRect(this.x - 30, this.y - 50, (this.hp / this.maxHp) * 60, 6);
    }
}

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

        // Link HTML Buttons
        document.getElementById('btn-showdown').onclick = () => this.openSelect('showdown');
        document.getElementById('btn-knockout').onclick = () => this.openSelect('knockout');
        document.getElementById('play-btn').onclick = () => this.startMatch();

        this.renderMenuGrid();
    }

    openSelect(mode) {
        this.mode = mode;
        document.getElementById('screen-home').classList.add('hidden');
        document.getElementById('screen-select').classList.remove('hidden');
    }

    renderMenuGrid() {
        const grid = document.getElementById('grid');
        grid.innerHTML = '';
        this.brawlersData.forEach(b => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<div class="emoji-preview">${b.icon}</div><div style="color:white; font-size:12px;">${b.name}</div>`;
            card.onclick = () => {
                document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedBrawler = b;
                document.getElementById('play-btn').disabled = false;
                document.getElementById('brawler-desc').innerText = b.desc;
            };
            grid.appendChild(card);
        });
    }

    startMatch() {
        document.getElementById('screen-select').classList.add('hidden');
        document.getElementById('hud').style.display = 'block';
        this.state = 'GAME';

        const map = this.mode === 'showdown' ? this.mapData.showdown : this.mapData.knockout;
        this.loadMap(map);

        this.player = new Entity(this.selectedBrawler, 400, 400, 0, true, this);
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
