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
        this.selectedBrawler = null;
        this.camera = { x: 0, y: 0 };
        this.keys = {}; 
    }

    init() {
        this.setupEventListeners();
        // Since we start on the home screen, we don't need to render the grid yet,
        // but we can call it to prepare the data.
        this.renderMenuGrid();
    }

    // --- LOGIC: CONNECTING BUTTONS TO ACTIONS ---
    setupEventListeners() {
        // Keyboard tracking
        window.onkeydown = (e) => this.keys[e.key.toLowerCase()] = true;
        window.onkeyup = (e) => this.keys[e.key.toLowerCase()] = false;

        // "SKULL CREEK" Button
        const btnShowdown = document.getElementById('btn-showdown');
        if (btnShowdown) {
            btnShowdown.onclick = () => {
                this.mode = 'showdown';
                this.showSelectionScreen();
            };
        }

        // "OUT IN OPEN" Button
        const btnKnockout = document.getElementById('btn-knockout');
        if (btnKnockout) {
            btnKnockout.onclick = () => {
                this.mode = 'knockout';
                this.showSelectionScreen();
            };
        }

        // "BRAWL!" Button
        const playBtn = document.getElementById('play-btn');
        if (playBtn) {
            playBtn.onclick = () => {
                if (this.selectedBrawler) this.start(this.selectedBrawler);
            };
        }
    }

    showSelectionScreen() {
        // Hide Home, Show Character Select
        document.getElementById('screen-home').classList.add('hidden');
        document.getElementById('screen-select').classList.remove('hidden');
        this.renderMenuGrid();
    }

    renderMenuGrid() {
        const grid = document.getElementById('grid');
        if (!grid) return;
        grid.innerHTML = ''; 

        this.brawlersData.forEach(b => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="emoji-preview">${b.icon}</div>
                <div style="color:white; font-size:12px; font-weight:bold; margin-top:5px;">${b.name}</div>
            `;

            card.onclick = () => {
                // Highlight the selected card
                document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                // Set choice and enable play button
                this.selectedBrawler = b;
                const playBtn = document.getElementById('play-btn');
                playBtn.disabled = false;
                playBtn.style.opacity = "1";
                document.getElementById('brawler-desc').innerText = b.desc;
            };
            grid.appendChild(card);
        });
    }

    // --- CORE ENGINE FUNCTIONS ---
    start(selectedBrawler) {
        document.getElementById('screen-select').classList.add('hidden');
        document.getElementById('hud').style.display = 'block';
        this.state = 'GAME';
        const currentMap = this.mode === 'showdown' ? this.mapData.showdown : this.mapData.knockout;
        this.loadMap(currentMap);
        this.player = new Entity(selectedBrawler, 400, 400, 0, true, this);
        this.entities.push(this.player);
    }

    loadMap(ascii) {
        this.mapW = ascii[0].length * CONFIG.TILE_SIZE;
        this.mapH = ascii.length * CONFIG.TILE_SIZE;
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
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        this.bushes.forEach(b => { this.ctx.fillStyle = '#27ae60'; this.ctx.fillRect(b.x, b.y, b.w, b.h); });
        this.walls.forEach(w => { this.ctx.fillStyle = '#7f8c8d'; this.ctx.fillRect(w.x, w.y, w.w, w.h); });
        this.entities.forEach(e => e.draw(this.ctx));
        this.ctx.restore();
    }
}
