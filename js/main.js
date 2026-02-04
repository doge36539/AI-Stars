// js/main.js
import { BRAWLERS } from './data/brawler.js'; 
import { MAP_SKULL_CREEK, MAP_OUT_OPEN } from './data/maps.js';

const CONFIG = {
    TILE_SIZE: 50,
    CANVAS_W: 1600,
    CANVAS_H: 900
};

// --- ENTITY (Handles Players AND Bots) ---
class Entity {
    constructor(data, x, y, isPlayer, game) {
        this.data = data;
        this.x = x; 
        this.y = y;
        this.w = 40; // Hitbox width
        this.h = 40; // Hitbox height
        this.isPlayer = isPlayer;
        this.game = game;
        this.hp = data.hp || 4000;
        this.maxHp = data.hp || 4000;
        this.speed = isPlayer ? (data.speed || 5) : 3; // Bots are slightly slower
        this.isDead = false;
    }

    update() {
        if (this.isDead) return;

        let dx = 0;
        let dy = 0;

        if (this.isPlayer) {
            // PLAYER CONTROLS
            if (this.game.keys['w']) dy = -this.speed;
            if (this.game.keys['s']) dy = this.speed;
            if (this.game.keys['a']) dx = -this.speed;
            if (this.game.keys['d']) dx = this.speed;
        } else {
            // SIMPLE AI (Chases Player)
            const player = this.game.player;
            if (player && !player.isDead) {
                if (this.x < player.x) dx = this.speed;
                if (this.x > player.x) dx = -this.speed;
                if (this.y < player.y) dy = this.speed;
                if (this.y > player.y) dy = -this.speed;
            }
        }

        // PHYSICS & COLLISION
        if (dx !== 0 || dy !== 0) {
            this.move(dx, dy);
        }
    }

    move(dx, dy) {
        // Try moving X first
        if (!this.checkCollision(this.x + dx, this.y)) {
            this.x += dx;
        }
        // Try moving Y separately (allows sliding along walls)
        if (!this.checkCollision(this.x, this.y + dy)) {
            this.y += dy;
        }

        // Screen Boundaries
        this.x = Math.max(0, Math.min(this.x, CONFIG.CANVAS_W - this.w));
        this.y = Math.max(0, Math.min(this.y, CONFIG.CANVAS_H - this.h));
    }

    checkCollision(newX, newY) {
        // Loop through all walls to see if we hit one
        for (let w of this.game.walls) {
            if (
                newX < w.x + w.w &&
                newX + this.w > w.x &&
                newY < w.y + w.h &&
                newY + this.h > w.y
            ) {
                return true; // Hit a wall!
            }
        }
        return false; // Safe to move
    }

    draw(ctx) {
        if (this.isDead) return;

        // 1. Draw Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x + 20, this.y + 40, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Draw Brawler (FIX: Reset opacity/color)
        ctx.fillStyle = '#fff'; 
        ctx.globalAlpha = 1.0; // Force full visibility
        ctx.font = '40px serif';
        ctx.textAlign = 'center';
        // Draw the emoji slightly up so it stands on the shadow
        ctx.fillText(this.data.icon, this.x + 20, this.y + 35);
        
        // 3. Health Bar
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, this.y - 15, 40, 5);
        
        // Green for Player, Red for Enemy
        ctx.fillStyle = this.isPlayer ? '#00ff00' : '#ff0000';
        ctx.fillRect(this.x, this.y - 15, (this.hp / this.maxHp) * 40, 5);
    }
}

// --- GAME ENGINE ---
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CONFIG.CANVAS_W;
        this.canvas.height = CONFIG.CANVAS_H;
        
        this.state = 'MENU';
        this.selectedBrawler = null;
        this.mode = 'showdown';
        this.keys = {};
        this.entities = [];
        this.walls = [];
        
        window.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);
    }

    init() {
        const btnSolo = document.getElementById('btn-showdown');
        const btn3v3 = document.getElementById('btn-knockout');
        const playBtn = document.getElementById('play-btn');

        if (btnSolo) btnSolo.onclick = () => this.openMenu('showdown');
        if (btn3v3) btn3v3.onclick = () => this.openMenu('knockout');

        if (playBtn) {
            playBtn.removeAttribute('disabled');
            playBtn.onclick = () => {
                if (this.selectedBrawler) this.startMatch();
            };
        }
    }

    openMenu(mode) {
        this.mode = mode;
        document.getElementById('screen-home').style.display = 'none';
        document.getElementById('screen-select').classList.remove('hidden');
        document.getElementById('screen-select').style.display = 'flex';
        this.renderGrid();
    }

    renderGrid() {
        const grid = document.getElementById('grid');
        grid.innerHTML = ''; 

        BRAWLERS.forEach(b => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<div style="font-size:40px;">${b.icon}</div><div>${b.name}</div>`;
            card.onclick = () => {
                document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedBrawler = b;
                
                const playBtn = document.getElementById('play-btn');
                playBtn.disabled = false;
                playBtn.style.opacity = "1";
                playBtn.style.cursor = "pointer";
                document.getElementById('brawler-desc').innerText = b.desc;
            };
            grid.appendChild(card);
        });
    }

    startMatch() {
        document.getElementById('screen-select').classList.add('hidden');
        document.getElementById('screen-select').style.display = 'none';
        this.state = 'GAME';

        const mapData = (this.mode === 'showdown') ? MAP_SKULL_CREEK : MAP_OUT_OPEN;
        this.loadMap(mapData);
        this.loop();
    }

    loadMap(ascii) {
        this.walls = [];
        this.entities = [];
        
        // Fallback map if missing
        if (!ascii) ascii = ["################", "#P............X#", "################"];

        // 1. Parse Map
        for (let r = 0; r < ascii.length; r++) {
            for (let c = 0; c < ascii[r].length; c++) {
                let x = c * CONFIG.TILE_SIZE;
                let y = r * CONFIG.TILE_SIZE;
                let tile = ascii[r][c];

                if (tile === '#') {
                    this.walls.push({ x, y, w: CONFIG.TILE_SIZE, h: CONFIG.TILE_SIZE, type: 'wall' });
                } else if (tile === 'X') {
                    this.walls.push({ x, y, w: CONFIG.TILE_SIZE, h: CONFIG.TILE_SIZE, type: 'box' });
                } else if (tile === 'P') {
                    // Spawn Player
                    this.player = new Entity(this.selectedBrawler, x, y, true, this);
                    this.entities.push(this.player);
                }
            }
        }

        // 2. Spawn Enemies (AI)
        // We pick 3 random brawlers to be enemies
        for(let i=0; i<3; i++) {
            let randomBrawler = BRAWLERS[Math.floor(Math.random() * BRAWLERS.length)];
            // Spawn them at random spots (top right, bottom left, etc)
            let ex = (i === 0) ? 100 : (i === 1) ? 1400 : 1400;
            let ey = (i === 0) ? 800 : (i === 1) ? 100 : 800;
            
            let enemy = new Entity(randomBrawler, ex, ey, false, this);
            this.entities.push(enemy);
        }
    }

    loop() {
        if (this.state !== 'GAME') return;

        // Update
        this.entities.forEach(e => e.update());

        // Draw Background
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Walls
        this.walls.forEach(w => {
            this.ctx.fillStyle = (w.type === 'wall') ? '#27ae60' : '#f39c12';
            this.ctx.fillRect(w.x, w.y, w.w, w.h);
            // Border
            this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            this.ctx.strokeRect(w.x, w.y, w.w, w.h);
        });

        // Draw Entities
        // Sort by Y position so characters in front appear on top
        this.entities.sort((a, b) => a.y - b.y);
        this.entities.forEach(e => e.draw(this.ctx));

        requestAnimationFrame(() => this.loop());
    }
}

const game = new Game();
window.onload = () => game.init();
