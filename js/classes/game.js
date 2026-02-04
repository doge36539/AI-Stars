// js/classes/game.js
import { Entity } from './entity.js';
import { CONFIG } from '../main.js';

export class Game {
    constructor(brawlersData, mapData) {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.brawlersData = brawlersData;
        this.mapData = mapData;

        this.entities = [];
        this.bullets = [];
        this.particles = [];
        this.walls = [];
        this.bushes = [];
        
        this.state = 'MENU';
        this.mode = 'showdown';
        this.selectedBrawler = null; // Track selection
        this.camera = { x: 0, y: 0 };
        this.frameCount = 0;
    }

    init() {
        this.setupEventListeners();
        this.renderMenuGrid();
    }

    // --- BUTTON AND MOUSE LOGIC ---
    setupEventListeners() {
        // Mode Buttons
        document.getElementById('btn-showdown').onclick = () => {
            this.mode = 'showdown';
            document.getElementById('screen-home').classList.add('hidden');
            document.getElementById('screen-select').classList.remove('hidden');
        };

        document.getElementById('btn-knockout').onclick = () => {
            this.mode = 'knockout';
            document.getElementById('screen-home').classList.add('hidden');
            document.getElementById('screen-select').classList.remove('hidden');
        };

        // Play Button
        document.getElementById('play-btn').onclick = () => {
            if (this.selectedBrawler) {
                this.start(this.selectedBrawler);
            }
        };

        // Canvas Shooting (Optional: simple version)
        this.canvas.onmousedown = () => {
            if (this.state === 'GAME' && this.player) this.player.tryShoot();
        };
    }

    // --- CHARACTER SELECT GRID ---
    renderMenuGrid() {
        const grid = document.getElementById('grid');
        grid.innerHTML = ''; // Clear old content

        this.brawlersData.forEach(b => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="emoji-preview">${b.icon}</div>
                <div style="color:white; font-size:0.8vw; font-weight:bold; margin-top:5px;">${b.name}</div>
            `;

            card.onclick = () => {
                // UI Highlight
                document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                // Logic Set
                this.selectedBrawler = b;
                document.getElementById('play-btn').disabled = false;
                document.getElementById('play-btn').style.opacity = "1";
                document.getElementById('brawler-desc').innerText = b.desc;
            };

            grid.appendChild(card);
        });
    }

    start(selectedBrawler) {
        // Hide UI for gameplay
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById('hud').style.display = 'block';

        this.state = 'GAME';
        this.entities = [];
        this.bullets = [];
        this.walls = [];
        this.bushes = [];

        const currentMap = this.mode === 'showdown' ? this.mapData.showdown : this.mapData.knockout;
        this.loadMap(currentMap);

        const player = new Entity(selectedBrawler, 0, 0, 0, true, this);
        this.spawnEntity(player, 0);
        this.entities.push(player);
        this.player = player;

        this.spawnBots();
    }

    // ... Rest of your loadMap, update, and draw functions remain the same
    loadMap(asciiMap) {
        this.mapW = asciiMap[0].length * CONFIG.TILE_SIZE;
        this.mapH = asciiMap.length * CONFIG.TILE_SIZE;
        for (let r = 0; r < asciiMap.length; r++) {
            for (let c = 0; c < asciiMap[0].length; c++) {
                let x = c * CONFIG.TILE_SIZE;
                let y = r * CONFIG.TILE_SIZE;
                if (asciiMap[r][c] === '#') this.walls.push({ x, y, w: CONFIG.TILE_SIZE, h: CONFIG.TILE_SIZE, hp: 3000 });
                if (asciiMap[r][c] === '~') this.bushes.push({ x, y, w: CONFIG.TILE_SIZE, h: CONFIG.TILE_SIZE });
            }
        }
    }

    spawnEntity(ent, id) {
        if (this.mode === 'showdown') {
            let a = (id / 10) * Math.PI * 2, r = (this.mapW / 2) - 200;
            ent.x = this.mapW / 2 + Math.cos(a) * r;
            ent.y = this.mapH / 2 + Math.sin(a) * r;
        } else {
            ent.x = this.mapW / 2 + (Math.random() - 0.5) * 500;
            ent.y = ent.team === 0 ? this.mapH - 150 : 150;
        }
    }

    spawnBots() {
        const count = this.mode === 'showdown' ? 9 : 5;
        for (let i = 1; i <= count; i++) {
            let team = this.mode === 'showdown' ? i : (i < 3 ? 0 : 1);
            let randomBrawler = this.brawlersData[Math.floor(Math.random() * this.brawlersData.length)];
            let bot = new Entity(randomBrawler, 0, 0, team, false, this);
            this.spawnEntity(bot, i);
            this.entities.push(bot);
        }
    }

    update() {
        if (this.state !== 'GAME') return;
        this.frameCount++;
        this.camera.x += (this.player.x - this.canvas.width / 2 - this.camera.x) * 0.1;
        this.camera.y += (this.player.y - this.canvas.height / 2 - this.camera.y) * 0.1;
        this.entities.forEach(e => e.update());
        this.bullets.forEach(b => b.update());
        this.particles.forEach(p => p.update());
        this.entities = this.entities.filter(e => e.hp > 0);
        this.bullets = this.bullets.filter(b => b.active);
        this.particles = this.particles.filter(p => p.life > 0);
        this.walls = this.walls.filter(w => w.hp > 0);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        this.bushes.forEach(b => { this.ctx.fillStyle = '#27ae60'; this.ctx.fillRect(b.x, b.y, b.w + 1, b.h + 1); });
        this.walls.forEach(w => { this.ctx.fillStyle = '#7f8c8d'; this.ctx.fillRect(w.x, w.y, w.w, w.h); });
        this.entities.forEach(e => e.draw(this.ctx));
        this.bullets.forEach(b => b.draw(this.ctx, this.player.team));
        this.particles.forEach(p => p.draw(this.ctx));
        this.ctx.restore();
    }
}
