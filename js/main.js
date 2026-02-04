// js/main.js
import { BRAWLERS } from './data/brawler.js'; 
import { MAP_SKULL_CREEK, MAP_OUT_OPEN } from './data/maps.js';

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
        this.w = 40; 
        this.h = 40;
        this.isPlayer = isPlayer;
        this.game = game;
        this.hp = data.hp || 4000;
        this.maxHp = data.hp || 4000;
        this.speed = isPlayer ? (data.speed || 6) : 3.5; 
        
        // AI & Visibility Stats
        this.inBush = false;
        this.lastKnownTargetX = null;
        this.lastKnownTargetY = null;
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.wanderTimer = 0;
    }

    update() {
        // 1. Check if hiding in a bush
        this.checkBush();

        let dx = 0;
        let dy = 0;

        if (this.isPlayer) {
            // --- PLAYER MOVEMENT ---
            if (this.game.keys['w']) dy = -this.speed;
            if (this.game.keys['s']) dy = this.speed;
            if (this.game.keys['a']) dx = -this.speed;
            if (this.game.keys['d']) dx = this.speed;
        } else {
            // --- AI LOGIC (SMARTER) ---
            const player = this.game.player;
            const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
            
            // CAN I SEE THE PLAYER?
            // Visible if: Not in bush OR Player is very close (1.5 tiles = 75px)
            const isVisible = (!player.inBush) || (distToPlayer < 75);

            if (isVisible) {
                // CHASE MODE: I see you, run towards you!
                this.lastKnownTargetX = player.x;
                this.lastKnownTargetY = player.y;
                
                // Simple tracking
                if (this.x < player.x) dx = this.speed;
                if (this.x > player.x) dx = -this.speed;
                if (this.y < player.y) dy = this.speed;
                if (this.y > player.y) dy = -this.speed;
            } else {
                // SEARCH/WANDER MODE
                if (this.lastKnownTargetX !== null) {
                    // Walk to where I last saw you
                    if (Math.abs(this.x - this.lastKnownTargetX) > 10) dx = (this.lastKnownTargetX > this.x) ? this.speed : -this.speed;
                    if (Math.abs(this.y - this.lastKnownTargetY) > 10) dy = (this.lastKnownTargetY > this.y) ? this.speed : -this.speed;

                    // If I reached the spot, forget it and start wandering
                    if (Math.hypot(this.x - this.lastKnownTargetX, this.y - this.lastKnownTargetY) < 50) {
                        this.lastKnownTargetX = null;
                    }
                } else {
                    // Just patrol randomly "In the way"
                    this.wanderTimer++;
                    if (this.wanderTimer > 60) {
                        this.wanderAngle += (Math.random() - 0.5) * 2; // Turn slightly
                        this.wanderTimer = 0;
                    }
                    dx = Math.cos(this.wanderAngle) * (this.speed * 0.5);
                    dy = Math.sin(this.wanderAngle) * (this.speed * 0.5);
                }
            }
        }

        // Apply Physics
        if (dx !== 0 || dy !== 0) this.move(dx, dy);
    }

    checkBush() {
        // Center point of the entity
        const cx = this.x + 20;
        const cy = this.y + 20;
        this.inBush = false;

        // Check against all bush tiles
        for (let b of this.game.bushes) {
            if (cx > b.x && cx < b.x + CONFIG.TILE_SIZE &&
                cy > b.y && cy < b.y + CONFIG.TILE_SIZE) {
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
        // Opacity Logic: Only transparent if in bush AND is the player (so you know you are hiding)
        // Enemies in bushes should just disappear unless close (we can add that later), 
        // for now let's make them semitransparent too.
        if (this.inBush) ctx.globalAlpha = 0.5;
        else ctx.globalAlpha = 1.0;

        // Draw Shadow relative to Camera
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse((this.x - camX) + 20, (this.y - camY) + 40, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw Brawler
        ctx.fillStyle = '#fff'; 
        ctx.font = '40px serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.data.icon, (this.x - camX) + 20, (this.y - camY) + 35);
        
        // Reset Opacity for Health Bar
        ctx.globalAlpha = 1.0; 

        // Health Bar
        ctx.fillStyle = '#333';
        ctx.fillRect((this.x - camX), (this.y - camY) - 15, 40, 5);
        ctx.fillStyle = this.isPlayer ? '#00ff00' : '#ff0000';
        ctx.fillRect((this.x - camX), (this.y - camY) - 15, (this.hp / this.maxHp) * 40, 5);
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
        this.bushes = []; // New array for bushes
        
        // Camera Object
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
        
        if (!ascii) return;

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
                    this.bushes.push({ x, y }); // Add to bush list
                } else if (tile === 'P') {
                    this.player = new Entity(this.selectedBrawler, x, y, true, this);
                    this.entities.push(this.player);
                }
            }
        }
        
        // Spawn AI
        for(let i=0; i<3; i++) {
             // Spawn them far away
            let enemy = new Entity(BRAWLERS[0], 1000 + (i*100), 500 + (i*100), false, this);
            this.entities.push(enemy);
        }
    }

    updateCamera() {
        if (!this.player) return;

        // 1. Center Camera on Player
        // Target = Player position - Half Screen Size
        let targetX = this.player.x - (CONFIG.CANVAS_W / 2);
        let targetY = this.player.y - (CONFIG.CANVAS_H / 2);

        // 2. Smooth Movement (Lerp) - Optional, makes it feel pro
        this.camera.x = targetX; 
        this.camera.y = targetY;

        // 3. Clamp (Don't show black void outside map)
        // Note: We need map width/height. Assuming 60x40 from map file.
        // Map Width = 60 * 50 = 3000px
        // Map Height = 40 * 50 = 2000px
        this.camera.x = Math.max(0, Math.min(this.camera.x, 3000 - CONFIG.CANVAS_W));
        this.camera.y = Math.max(0, Math.min(this.camera.y, 2000 - CONFIG.CANVAS_H));
    }

    loop() {
        if (this.state !== 'GAME') return;

        // Update Logic
        this.entities.forEach(e => e.update());
        this.updateCamera();

        // Draw Background
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // DRAW WORLD (Subtract Camera X/Y)
        
        // 1. Bushes (Draw FIRST so they are on the floor)
        // ...actually in Brawl Stars bushes hide feet, so usually drawn on top? 
        // Let's draw floor bushes first for texture.
        
        // 2. Walls & Boxes
        this.walls.forEach(w => {
            let drawX = w.x - this.camera.x;
            let drawY = w.y - this.camera.y;
            
            // Optimization: Only draw if on screen
            if (drawX > -50 && drawX < CONFIG.CANVAS_W && drawY > -50 && drawY < CONFIG.CANVAS_H) {
                this.ctx.fillStyle = (w.type === 'wall') ? '#27ae60' : '#f39c12';
                this.ctx.fillRect(drawX, drawY, w.w, w.h);
                this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                this.ctx.strokeRect(drawX, drawY, w.w, w.h);
            }
        });

        // 3. Bushes (Floor Layer)
        this.ctx.fillStyle = '#2ecc71'; // Lighter green for bushes
        this.bushes.forEach(b => {
            let drawX = b.x - this.camera.x;
            let drawY = b.y - this.camera.y;
             if (drawX > -50 && drawX < CONFIG.CANVAS_W && drawY > -50 && drawY < CONFIG.CANVAS_H) {
                this.ctx.fillRect(drawX, drawY, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
             }
        });

        // 4. Entities
        this.entities.sort((a, b) => a.y - b.y);
        this.entities.forEach(e => e.draw(this.ctx, this.camera.x, this.camera.y));

        requestAnimationFrame(() => this.loop());
    }
}

const game = new Game();
window.onload = () => game.init();
