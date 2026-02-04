// js/main.js
import { BRAWLERS } from './data/brawler.js'; 
import { MAP_SKULL_CREEK, MAP_OUT_OPEN } from './data/maps.js';

// --- CONFIGURATION ---
const CONFIG = {
    TILE_SIZE: 50,
    CANVAS_W: 1600,
    CANVAS_H: 900
};

// --- THE PLAYER LOGIC ---
class Entity {
    constructor(data, x, y, isPlayer, game) {
        this.data = data;
        this.x = x; 
        this.y = y;
        this.isPlayer = isPlayer;
        this.game = game;
        this.hp = data.hp;
        this.maxHp = data.hp;
        this.speed = data.speed || 5; // Default speed if missing
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
        // Draw Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 20, 20, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw Icon
        ctx.font = '50px serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.data.icon, this.x, this.y + 10);
        
        // Draw Health Bar
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - 30, this.y - 50, 60, 8);
        ctx.fillStyle = '#2ecc71'; // Brawl Stars Green
        ctx.fillRect(this.x - 30, this.y - 50, (this.hp / this.maxHp) * 60, 8);
    }
}

// --- THE GAME ENGINE ---
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CONFIG.CANVAS_W;
        this.canvas.height = CONFIG.CANVAS_H;
        
        this.state = 'MENU';
        this.selectedBrawler = null;
        this.mode = 'showdown'; // Default
        this.keys = {};
        this.entities = [];
        this.walls = [];
        
        // Input Listeners
        window.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);
    }

    init() {
        console.log("Engine Initialized");

        // Wire up the Menu Buttons
        const btnSolo = document.getElementById('btn-showdown');
        const btn3v3 = document.getElementById('btn-knockout');
        const playBtn = document.getElementById('play-btn');

        if (btnSolo) btnSolo.onclick = () => this.openMenu('showdown');
        if (btn3v3) btn3v3.onclick = () => this.openMenu('knockout');

        // CRITICAL: Wire the BRAWL button
        if (playBtn) {
            playBtn.onclick = () => {
                console.log("Brawl Button Clicked");
                if (this.selectedBrawler) {
                    this.startMatch();
                } else {
                    alert("Please select a brawler first!");
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
        grid.innerHTML = ''; // Clear old buttons

        BRAWLERS.forEach(b => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div style="font-size:40px;">${b.icon}</div>
                <div style="color:white; font-size:12px;">${b.name}</div>
            `;
            
            card.onclick = () => {
                // Visual Select
                document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                // Logic Select
                this.selectedBrawler = b;
                
                // Enable Play Button
                const playBtn = document.getElementById('play-btn');
                playBtn.disabled = false;
                playBtn.style.opacity = "1";
                document.getElementById('brawler-desc').innerText = b.desc;
