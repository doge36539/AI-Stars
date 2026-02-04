// js/main.js
import { BRAWLERS } from './data/brawler.js'; 
import { MAP_SKULL_CREEK, MAP_OUT_OPEN } from './data/maps.js';

// --- CONFIGURATION ---
const CONFIG = {
    TILE_SIZE: 50,
    CANVAS_W: 1600,
    CANVAS_H: 900
};

// --- ENTITY CLASS ---
class Entity {
    constructor(data, x, y, isPlayer, game) {
        this.data = data;
        this.x = x; 
        this.y = y;
        this.isPlayer = isPlayer;
        this.game = game;
        this.hp = data.hp || 4000;
        this.maxHp = data.hp || 4000;
        this.speed = data.speed || 5; 
    }

    update() {
        if (this.isPlayer) {
            let nextX = this.x;
            let nextY = this.y;

            // Movement Logic
            if (this.game.keys['w']) nextY -= this.speed;
            if (this.game.keys['s']) nextY += this.speed;
            if (this.game.keys['a']) nextX -= this.speed;
            if (this.game.keys['d']) nextX += this.speed;

            // Collision: Stop at edges
            if (nextX > 0 && nextX < CONFIG.CANVAS_W - 50) this.x = nextX;
            if (nextY > 0 && nextY < CONFIG.CANVAS_H - 50) this.y = nextY;
        }
    }

    draw(ctx) {
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x + 25, this.y + 45, 20, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Brawler Icon
        ctx.font = '40px serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.data.icon, this.x + 25, this.y + 35);
        
        // Health Bar
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, this.y - 15, 50, 5);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x, this.y - 15, (this.hp / this.maxHp) * 50, 5);
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
        // Wire Menu Buttons
        const btnSolo = document.getElementById('btn-showdown');
        const btn3v3 = document.getElementById('btn-knockout');
        const playBtn = document.getElementById('play-btn');

        if (btnSolo) btnSolo.onclick = () => this.openMenu('showdown');
        if (btn3v3) btn3v3.onclick = () => this.openMenu('knockout');

        // Wire Play Button
        if (playBtn) {
            playBtn.removeAttribute('disabled'); // Unlock it
            playBtn.onclick = () => {
                if (this.selectedBrawler) {
                    this.startMatch();
                }
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
                
                // Light up the BRAWL button
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
        // 1. Hide the Menu (Crucial Step)
        document.getElementById('screen-select').classList.add('hidden');
        document.getElementById('screen-select').style.display = 'none';
        this.state = 'GAME';

        // 2. Select Map (with Backup Safety)
        let mapData = (this.mode === 'showdown') ? MAP_SKULL_CREEK : MAP_OUT_OPEN;
        
        // 3. Launch!
        this.loadMap(mapData);
        this.loop();
    }

    loadMap(ascii) {
        this.walls = [];
        this.entities = [];
        
        // SAFETY NET: If map is missing, use a blank one so game doesn't crash
        if (!ascii) {
            console.error("Map not found! Using fallback.");
            ascii = [
                "################################",
                "#P.............................#",
                "#..............................#",
                "################################"
            ];
        }

        for (let r = 0; r < ascii.length; r++) {
            for (let c = 0; c < ascii[r].length; c++) {
                let x = c * CONFIG.TILE_SIZE;
                let y = r * CONFIG.TILE_SIZE;
                let tile = ascii[r][c];

                if (tile === '#') {
                    this.walls.push({ x, y, type: 'wall' });
                } else if (tile === 'X') {
                    this.walls.push({ x, y, type: 'box' });
                } else if (tile === 'P') {
                    this.player = new Entity(this.selectedBrawler, x, y, true, this);
                    this.entities.push(this.player);
                }
            }
        }
        
        // Final fallback if 'P' was missing in map
        if (!this.player) {
            this.player = new Entity(this.selectedBrawler, 100, 100, true, this);
            this.entities.push(this.player);
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
            if (w.type === 'wall') {
                this.ctx.fillStyle = '#27ae60';
                this.ctx.fillRect(w.x, w.y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
                this.ctx.strokeStyle = '#1e8449';
                this.ctx.strokeRect(w.x, w.y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
            } else if (w.type === 'box') {
                this.ctx.fillStyle = '#f39c12';
                this.ctx.fillRect(w.x+5, w.y+5, 40, 40);
            }
        });

        // Draw Entities
        this.entities.forEach(e => e.draw(this.ctx));

        requestAnimationFrame(() => this.loop
