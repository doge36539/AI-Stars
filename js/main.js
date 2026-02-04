// js/main.js
import { BRAWLERS } from './data/brawler.js'; 
import { MAP_SKULL_CREEK, MAP_OUT_OPEN } from './data/maps.js';

const CONFIG = {
    TILE_SIZE: 50,
    CANVAS_W: 1600,
    CANVAS_H: 900,
    AI_SIGHT_RANGE: 500,
    AI_BUSH_SIGHT: 100
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
        this.speed = isPlayer ? (data.speed || 6) : 3.5; 
        
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
            if (this.game.keys['w']) dy = -this.speed;
            if (this.game.keys['s']) dy = this.speed;
            if (this.game.keys['a']) dx = -this.speed;
            if (this.game.keys['d']) dx = this.speed;
        } else {
            // AI LOGIC
            const player = this.game.player;
            const dist = Math.hypot(player.x - this.x, player.y - this.y);
            const canSee = (dist < CONFIG.AI_SIGHT_RANGE) && (!player.inBush || dist < CONFIG.AI_BUSH_SIGHT);

            if (canSee) {
                this.targetX = player.x;
                this.targetY = player.y;
                this.patrolTimer = 0;
            } else {
                if (this.targetX === null || this.hasReachedTarget()) {
                    this.pickRandomPatrolPoint();
                }
            }

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
        return dist < 50;
    }

    pickRandomPatrolPoint() {
        this.patrolTimer++;
        if (this.patrolTimer < 50) return;
        this.targetX = Math.random() * 3000;
        this.targetY = Math.random() * 2000;
        this.patrolTimer = 0;
    }

    checkBush() {
        const cx = this.x + 20;
        const cy = this.y + 20;
        this.inBush = false;
        // Check center point against bush coordinates
        for (let b of this.game.bushes) {
            // Simple box check
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
        let screenX = this.x - camX;
        let screenY = this.y - camY;

        // Visual Hiding Logic
        if (this.inBush) {
            if (this.isPlayer) ctx.globalAlpha = 0.5; // You become ghost
            else return; // Enemies are TOTALLY INVISIBLE in bush (unless close logic handled elsewhere)
        } else {
            ctx.globalAlpha = 1.0;
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(screenX + 20, screenY + 40, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Icon
        ctx.globalAlpha = (this.inBush && this.isPlayer) ? 0.5 : 1.0;
        ctx.fillStyle = '#fff'; 
        ctx.font = '40px serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.data.icon, screenX + 20, screenY + 35);
        
        // Health Bar
        ctx.globalAlpha = 1.0; 
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX, screenY - 15, 40, 5);
        ctx.fillStyle = this.isPlayer ? '#00ff00' : '#ff0000';
        ctx.fillRect(screenX, screenY - 15, (this.hp / this.maxHp) * 40, 5);
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
        
        for(let i=0; i<3; i++) {
            let enemy = new Entity(BRAWLERS[0], 1000, 500 + (i*200), false, this);
            this.entities.push(enemy);
        }
    }

    updateCamera() {
        if (!this.player) return;
        this.camera.x = this.player.x - (CONFIG.CANVAS_W / 2);
        this.camera.y = this.player.y - (CONFIG.CANVAS_H / 2);
    }

    // --- NEW VISUAL DRAWING FUNCTIONS ---
    drawWall(ctx, x, y) {
        // 1. Side Face (Darker) - Gives Height
        ctx.fillStyle = '#145a32'; 
        ctx.fillRect(x, y + 20, 50, 30);
        
        // 2. Top Face (Lighter)
        ctx.fillStyle = '#27ae60'; 
        ctx.fillRect(x, y, 50, 45); // Overlap slightly to look connected
        
        // 3. Highlight (Detail)
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(x, y, 50, 5);
    }

    drawBox(ctx, x, y) {
        // 1. Box Body
        ctx.fillStyle = '#d35400';
        ctx.fillRect(x + 5, y + 10, 40, 35);
        
        // 2. Box Top
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(x + 5, y + 5, 40, 10);
        
        // 3. Icon
        ctx.fillStyle = '#f1c40f';
        ctx.font = "20px Arial";
        ctx.fillText("⚡", x + 25, y + 35);
    }

    drawBush(ctx, x, y) {
        // Draw 5 overlapping circles to make it look like a cloud
        ctx.fillStyle = '#2ecc71'; 
        ctx.beginPath();
        
        // Center
        ctx.arc(x + 25, y + 25, 30, 0, Math.PI * 2);
        // Corners (Randomize slightly for organic look)
        ctx.arc(x + 10, y + 10, 20, 0, Math.PI * 2);
        ctx.arc(x + 40, y + 10, 20, 0, Math.PI * 2);
        ctx.arc(x + 10, y + 40, 20, 0, Math.PI * 2);
        ctx.arc(x + 40, y + 40, 20, 0, Math.PI * 2);
        
        ctx.fill();
    }

    loop() {
        if (this.state !== 'GAME') return;

        this.entities.forEach(e => e.update());
        this.updateCamera();

        // 1. DRAW BACKGROUND (Subtle Grid)
        this.ctx.fillStyle = '#212f3c'; // Dark Blue Floor
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Grid Lines
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        // Calculate grid offset based on camera to make it scroll
        const offsetX = -this.camera.x % 50;
        const offsetY = -this.camera.y % 50;
        for (let x = offsetX; x < this.canvas.width; x += 50) { ctx.moveTo(x, 0); ctx.lineTo(x, this.canvas.height); }
        for (let y = offsetY; y < this.canvas.height; y += 50) { ctx.moveTo(0, y); ctx.lineTo(this.canvas.width, y); }
        this.ctx.stroke();

        // 2. DRAW WALLS & BOXES
        this.walls.forEach(w => {
            let drawX = w.x - this.camera.x;
            let drawY = w.y - this.camera.y;
            
            if (drawX > -60 && drawX < CONFIG.CANVAS_W && drawY > -60 && drawY < CONFIG.CANVAS_H) {
                if (w.type === 'wall') this.drawWall(this.ctx, drawX, drawY);
                else if (w.type === 'box') this.drawBox(this.ctx, drawX, drawY);
            }
        });

        // 3. DRAW BUSHES (Floor Layer)
        this.bushes.forEach(b => {
            let drawX = b.x - this.camera.x;
            let drawY = b.y - this.camera.y;
            if (drawX > -60 && drawX < CONFIG.CANVAS_W && drawY > -60 && drawY < CONFIG.CANVAS_H) {
                this.drawBush(this.ctx, drawX, drawY);
            }
        });

        // 4. DRAW ENTITIES
        this.entities.sort((a, b) => a.y - b.y);
        this.entities.forEach(e => e.draw(this.ctx, this.camera.x, this.camera.y));

        requestAnimationFrame(() => this.loop());
    }
}

const game = new Game();
window.onload = () => game.init();
