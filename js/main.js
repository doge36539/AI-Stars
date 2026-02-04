// js/main.js
import { BRAWLERS } from './data/brawler.js'; 
import { MAP_SKULL_CREEK, MAP_OUT_OPEN } from './data/maps.js';

const CONFIG = {
    TILE_SIZE: 50,
    CANVAS_W: 1600,
    CANVAS_H: 900,
    AI_SIGHT_RANGE: 500, // AI can only see 10 tiles away
    AI_BUSH_SIGHT: 100   // AI can only see 2 tiles into bushes
};

// --- ENTITY CLASS ---
class Entity {
    constructor(data, x, y, isPlayer, game) {
        this.data = data;
        this.x = x; 
        this.y = y;
        this.w = 40; 
        this.h = 40;
        this.isPlayer = isPlayer;
        this.game = game;
        this.hp = data.hp || 4000;
        this.maxHp = data.hp || 4000;
        this.speed = isPlayer ? (data.speed || 6) : 3; 
        
        // AI Stats
        this.inBush = false;
        this.targetX = null;
        this.targetY = null;
        this.patrolTimer = 0;
    }

    update() {
        this.checkBush();
        let dx = 0;
        let dy = 0;

        if (this.isPlayer) {
            // --- PLAYER CONTROLS ---
            if (this.game.keys['w']) dy = -this.speed;
            if (this.game.keys['s']) dy = this.speed;
            if (this.game.keys['a']) dx = -this.speed;
            if (this.game.keys['d']) dx = this.speed;
        } else {
            // --- NEW AI LOGIC ---
            const player = this.game.player;
            const dist = Math.hypot(player.x - this.x, player.y - this.y);
            
            // 1. CHECK VISIBILITY
            // Can see if: Player is CLOSE enough AND (Player not in bush OR Player is SUPER close)
            const canSee = (dist < CONFIG.AI_SIGHT_RANGE) && 
                           (!player.inBush || dist < CONFIG.AI_BUSH_SIGHT);

            if (canSee) {
                // CHASE MODE
                this.targetX = player.x;
                this.targetY = player.y;
                this.patrolTimer = 0; // Reset patrol if we see player
            } else {
                // PATROL MODE (If I have no target, or I reached my target, pick a new random one)
                if (this.targetX === null || this.hasReachedTarget()) {
                    this.pickRandomPatrolPoint();
                }
            }

            // Move towards Target (if I have one)
            if (this.targetX !== null) {
                const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
                dx = Math.cos(angle) * this.speed;
                dy = Math.sin(angle) * this.speed;
            }
        }

        if (dx !== 0 || dy !== 0) this.move(dx, dy);
    }

    hasReachedTarget() {
        if (this.targetX === null) return true;
        const dist = Math.hypot(this.targetX - this.x, this.targetY - this.y);
        return dist < 50; // Close enough
    }

    pickRandomPatrolPoint() {
        // Wait a bit before moving again
        this.patrolTimer++;
        if (this.patrolTimer < 50) return; // Stand still for 50 frames

        // Pick a random spot on the map
        this.targetX = Math.random() * 3000;
        this.targetY = Math.random() * 2000;
        this.patrolTimer = 0;
    }

    checkBush() {
        const cx = this.x + 20;
        const cy = this.y + 20;
        this.inBush = false;
        for (let b of this.game.bushes) {
            if (cx > b.x && cx < b.x + 50 && cy > b.y && cy < b.y + 50) {
                this.inBush = true;
                break;
            }
        }
    }

    move(dx, dy) {
        if (!this.checkCollision(this.x + dx, this.y)) this.x += dx;
        if (!this.checkCollision(this.x, this.y + dy)) this.y += dy;
    }

    checkCollision(newX, newY) {
        for (let w of this.game.walls) {
            if (newX < w.x + w.w && newX + this.w > w.x &&
                newY < w.y + w.h && newY + this.h > w.y) {
                return true;
            }
        }
        return false;
    }

    draw(ctx, camX, camY) {
        // DRAW RELATIVE TO CAMERA
        let screenX = this.x - camX;
        let screenY = this.y - camY;

        // Opacity: If Player is in bush, go transparent (so you know).
        // Enemies in bushes should be totally invisible unless close? 
        // For now, let's make enemies fade too so you can see if they hide.
        if (this.inBush) ctx.globalAlpha = 0.5;
        else ctx.globalAlpha = 1.0;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(screenX + 20, screenY + 40, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Icon
        ctx.fillStyle = '#fff'; 
        ctx.font = '40px serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.data.icon, screenX + 20, screenY + 35);
        
        // Health Bar (Always solid)
        ctx.globalAlpha = 1.0; 
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX, screenY - 15, 40, 5);
        ctx.fillStyle = this.isPlayer ? '#00ff00' : '#ff0000';
        ctx.fillRect(screenX, screenY - 15, (this.hp / this.maxHp) * 40, 5);
        
        // DEBUG: Draw Line to target (so you can see AI thinking)
        if (!this.isPlayer && this.targetX !== null) {
            // Uncomment next line to see red lines pointing where AI is going
            // ctx.strokeStyle = 'red'; ctx.beginPath(); ctx.moveTo(screenX+20, screenY+20); ctx.lineTo(this.targetX - camX, this.targetY - camY); ctx.stroke();
        }
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
        this.keys = {};
        this.entities = [];
        this.walls = [];
        this.bushes = [];
        this.camera = { x: 0, y: 0 };
        
        window.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);
    }

    init() {
        const btnSolo = document.getElementById('btn-showdown');
        const playBtn = document.getElementById('play-btn');
        if (btnSolo) btnSolo.onclick = () => this.openMenu();
        if (playBtn) {
            playBtn.removeAttribute('disabled');
            playBtn.onclick = () => { if (this.selectedBrawler) this.startMatch(); };
        }
    }

    openMenu() {
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
                document.getElementById('play-btn').disabled = false;
                document.getElementById('play-btn').style.opacity = "1";
            };
            grid.appendChild(card);
        });
    }

    startMatch() {
        document.getElementById('screen-select').style.display = 'none';
        this.state = 'GAME';
        this.loadMap(MAP_SKULL_CREEK);
        this.loop();
    }

    loadMap(ascii) {
        this.walls = [];
        this.bushes = [];
        this.entities = [];
        
        if (!ascii) ascii = ["################", "#P............X#", "################"];

        for (let r = 0; r < ascii.length; r++) {
            for (let c = 0; c < ascii[r].length; c++) {
                let x = c * CONFIG.TILE_SIZE;
                let y = r * CONFIG.TILE_SIZE;
                let tile = ascii[r][c];

                if (tile === '#') {
                    this.walls.push({ x, y, w: CONFIG.TILE_SIZE, h: CONFIG.TILE_SIZE, type: 'wall' });
                } else if (tile === 'X') {
                    this.walls.push({ x, y, w: CONFIG.TILE_SIZE, h: CONFIG.TILE_SIZE, type: 'box' });
                } else if (tile === 'B') {
                    this.bushes.push({ x, y });
                } else if (tile === 'P') {
                    this.player = new Entity(this.selectedBrawler, x, y, true, this);
                    this.entities.push(this.player);
                }
            }
        }
        
        // Spawn AI far away
        for(let i=0; i<3; i++) {
            let enemy = new Entity(BRAWLERS[0], 1000, 500 + (i*200), false, this);
            this.entities.push(enemy);
        }
    }

    updateCamera() {
        if (!this.player) return;
        
        // 1. Center on player
        this.camera.x = this.player.x - (CONFIG.CANVAS_W / 2);
        this.camera.y = this.player.y - (CONFIG.CANVAS_H / 2);
        
        // 2. Removed Clamping so it ALWAYS follows, even if map is small/weird
    }

    loop() {
        if (this.state !== 'GAME') return;

        this.entities.forEach(e => e.update());
        this.updateCamera();

        // CLEAR
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // DRAW WALLS (Adjusted by Camera)
        this.walls.forEach(w => {
            let drawX = w.x - this.camera.x;
            let drawY = w.y - this.camera.y;
            this.ctx.fillStyle = (w.type === 'wall') ? '#27ae60' : '#f39c12';
            this.ctx.fillRect(drawX, drawY, w.w, w.h);
            this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            this.ctx.strokeRect(drawX, drawY, w.w, w.h);
        });

        // DRAW BUSHES (Adjusted by Camera)
        this.ctx.fillStyle = '#2ecc71';
        this.bushes.forEach(b => {
            let drawX = b.x - this.camera.x;
            let drawY = b.y - this.camera.y;
            this.ctx.fillRect(drawX, drawY, 50, 50);
        });

        // DRAW ENTITIES (Adjusted by Camera)
        this.entities.sort((a, b) => a.y - b.y);
        this.entities.forEach(e => e.draw(this.ctx, this.camera.x, this.camera.y));

        requestAnimationFrame(() => this.loop());
    }
}

const game = new Game();
window.onload = () => game.init();
