// js/main.js
import { BRAWLERS } from './data/brawler.js'; 
import { MAP_SKULL_CREEK, MAP_OUT_OPEN } from './data/maps.js';

// --- 1. THE GAME CONFIGURATION ---
const CONFIG = {
    TILE_SIZE: 50,
    CANVAS_W: 1600,
    CANVAS_H: 900
};

// --- 2. THE PLAYER & OBJECTS (ENTITY CLASS) ---
class Entity {
    constructor(data, x, y, isPlayer, game) {
        this.data = data;
        this.x = x; 
        this.y = y;
        this.isPlayer = isPlayer;
        this.game = game;
        this.hp = data.hp;
        this.speed = data.speed;
    }

    update() {
        if (this.isPlayer) {
            // WASD Movement
            if (this.game.keys['w']) this.y -= this.speed;
            if (this.game.keys['s']) this.y += this.speed;
            if (this.game.keys['a']) this.x -= this.speed;
            if (this.game.keys['d']) this.x += this.speed;
        }
    }

    draw(ctx) {
        // Draw the Brawler Emoji
        ctx.font = '40px serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.data.icon, this.x, this.y);
        
        // Draw Health Bar
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 25, this.y - 45, 50, 5);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - 25, this.y - 45, (this.hp / this.data.hp) * 50, 5);
    }
}

// --- 3. THE BRAIN (GAME CLASS) ---
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CONFIG.CANVAS_W;
        this.canvas.height = CONFIG.CANVAS_H;
        
        this.state = 'MENU';
        this.selectedBrawler = null;
        this.mode = null;
        this.keys = {};
        this.walls = [];
        this.entities = [];
        
        // Listen for Keys
        window.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);
    }

    startMatch() {
        // 1. Hide Menu, Show Game
        document.getElementById('screen-select').classList.add('hidden');
        document.getElementById('screen-select').style.display = 'none'; // Force hide
        this.state = 'GAME';

        // 2. Load the Map
        const mapData = (this.mode === 'showdown') ? MAP_SKULL_CREEK : MAP_OUT_OPEN;
        this.loadMap(mapData);

        // 3. Spawn Player
        this.player = new Entity(this.selectedBrawler, 400, 400, true, this);
        this.entities.push(this.player);

        // 4. Start the Loop
        this.loop();
    }

    loadMap(asciiMap) {
        this.walls = [];
        if (!asciiMap) return; 
        for (let r = 0; r < asciiMap.length; r++) {
            for (let c = 0; c < asciiMap[r].length; c++) {
                if (asciiMap[r][c] === '#') {
                    this.walls.push({ x: c * CONFIG.TILE_SIZE, y: r * CONFIG.TILE_SIZE });
                }
            }
        }
    }

    loop() {
        if (this.state !== 'GAME') return;
        
        // Update everything
        this.entities.forEach(e => e.update());

        // Draw everything
        this.ctx.fillStyle = '#1a1a2e'; // Background color
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Walls
        this.ctx.fillStyle = '#7f8c8d';
        this.walls.forEach(w => this.ctx.fillRect(w.x, w.y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE));

        // Draw Entities
        this.entities.forEach(e => e.draw(this.ctx));

        requestAnimationFrame(() => this.loop());
    }
}

// --- 4. WIRING IT TOGETHER ---
const game = new Game();

window.onload = () => {
    // Menu Buttons
    const btnSolo = document.getElementById('btn-showdown');
    const btn3v3 = document.getElementById('btn-knockout');
    const playBtn = document.getElementById('play-btn');

    if (btnSolo) btnSolo.onclick = () => openSelect('showdown');
    if (btn3v3) btn3v3.onclick = () => openSelect('knockout');

    // THE FIX: Wiring the BRAWL button!
    if (playBtn) {
        playBtn.onclick = () => {
            if (game.selectedBrawler) {
                game.startMatch(); // Only launches if you picked someone
            }
        };
    }
};

function openSelect(mode) {
    game.mode = mode;
    document.getElementById('screen-home').style.display = 'none';
    document.getElementById('screen-select').classList.remove('hidden');
    document.getElementById('screen-select').style.display = 'flex';
    renderGrid();
}

function renderGrid() {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    BRAWLERS.forEach(b => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<div style="font-size:40px;">${b.icon}</div><div style="font-size:12px;color:white;">${b.name}</div>`;
        card.onclick = () => {
            document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            game.selectedBrawler = b; // Tell the game engine who we picked
            
            // Enable Play Button
            const playBtn = document.getElementById('play-btn');
            playBtn.disabled = false;
            playBtn.style.opacity = "1";
            document.getElementById('brawler-desc').innerText = b.desc;
        };
        grid.appendChild(card);
    });
}
