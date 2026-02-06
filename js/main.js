// js/main.js
import { performAttack } from './combat/attacks.js';
import { performSuper } from './combat/supers.js'; 
import { BRAWLERS } from './data/brawler.js'; 
import { MAP_SKULL_CREEK, MAP_OUT_OPEN } from './data/maps.js';

// 1. DYNAMIC CONFIG
export const CONFIG = {
    TILE_SIZE: 50,
    CANVAS_W: window.innerWidth, 
    CANVAS_H: window.innerHeight, 
    AI_SIGHT_RANGE: 600
};

// --- PROJECTILE ENGINE ---
class Projectile {
    constructor(x, y, angle, speed, range, dmg, owner, custom = {}) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.range = range;
        this.dmg = dmg;
        this.owner = owner;
        this.active = true;
        this.distanceTravelled = 0;
        Object.assign(this, custom);
    }

    update() {
        if (!this.active) return;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.distanceTravelled += this.speed;
        if (this.distanceTravelled >= this.range) this.active = false;
        if (this.owner.game.checkWallCollision(this.x, this.y)) this.active = false;
    }

    draw(ctx, camX, camY) {
        ctx.fillStyle = this.color || '#f1c40f';
        let size = this.size || 5;
        ctx.beginPath();
        ctx.arc(this.x - camX, this.y - camY, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 2. ASSET COLORS
const ASSETS = {
    'wall':  '#d35400', 
    'bush':  '#2ecc71', 
    'water': '#2980b9', 
    'box':   '#8e44ad', 
    'floor': '#f3e5ab'  
};

class Entity {
    constructor(data, x, y, isPlayer, game) {
        this.data = data;
        this.x = x; 
        this.y = y;
        this.w = 40; 
        this.h = 40;
        this.isPlayer = isPlayer;
        this.game = game;
        this.hp = data.hp;
        this.maxHp = data.hp;
        this.speed = isPlayer ? (data.speed || 6) : 3.5; 
        
        this.inBush = false;
        this.targetX = null;
        this.targetY = null;
        this.patrolTimer = 0;
        this.lastMoveX = 1; 

        // AMMO & COOLDOWN
        const stats = data.atk || {};
        this.maxAmmo = stats.ammo || 3;
        this.currentAmmo = this.maxAmmo;
        this.reloadSpeed = stats.reload || 1000; 
        this.shotCooldown = stats.cd || 500;
        
        this.reloadTimer = 0;
        this.lastAttackTime = 0;
        this.superCharge = 100; // Start at 100 for testing!

        this.lastUpdate = Date.now();
    }

    update() {
        const now = Date.now();
        const dt = now - this.lastUpdate;
        this.lastUpdate = now;

        // 1. REGENERATE AMMO
        if (this.currentAmmo < this.maxAmmo) {
            this.reloadTimer += dt; 
            if (this.reloadTimer >= this.reloadSpeed) {
                this.currentAmmo++;
                this.reloadTimer = 0;
                if (this.isPlayer) this.game.updateAmmoUI(); 
            }
        }

        // 2. MOVEMENT
        this.checkBush();
        let dx = 0;
        let dy = 0;

        if (this.isPlayer) {
            if (this.game.keys['w']) dy = -this.speed;
            if (this.game.keys['s']) dy = this.speed;
            if (this.game.keys['a']) dx = -this.speed;
            if (this.game.keys['d']) dx = this.speed;
        } else {
            const player = this.game.player;
            if (player) {
                const dist = Math.hypot(player.x - this.x, player.y - this.y);
                const canSee = (dist < CONFIG.AI_SIGHT_RANGE) && (!player.inBush || dist < 100);
                if (canSee) {
                    this.targetX = player.x;
                    this.targetY = player.y;
                    this.patrolTimer = 0;
                } else if (this.targetX === null || this.hasReachedTarget()) {
                    this.pickRandomPatrolPoint();
                }
                if (this.targetX !== null) {
                    const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
                    dx = Math.cos(angle) * this.speed;
                    dy = Math.sin(angle) * this.speed;
                }
            }
        }

        if (dx !== 0 || dy !== 0) this.move(dx, dy);
    }

    hasReachedTarget() {
        if (this.targetX === null) return true;
        return Math.hypot(this.targetX - this.x, this.targetY - this.y) < 50;
    }

    pickRandomPatrolPoint() {
        this.patrolTimer++;
        if (this.patrolTimer < 50) return;
        this.targetX = Math.random() * (this.game.mapWidth || 2000);
        this.targetY = Math.random() * (this.game.mapHeight || 1500);
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
        if (dx !== 0) this.lastMoveX = dx;
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

        ctx.globalAlpha = 1.0; 
        if (this.inBush) {
            if (this.isPlayer) ctx.globalAlpha = 0.6; 
            else return; 
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(screenX + 20, screenY + 45, 15, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Emoji
        ctx.fillStyle = '#000000'; 
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let sprite = this.data.icon || '😐'; 
        ctx.save();
        if (this.lastMoveX < 0) { 
            ctx.scale(-1, 1); 
            ctx.fillText(sprite, -(screenX + 20), screenY + 25);
        } else {
            ctx.fillText(sprite, screenX + 20, screenY + 25);
        }
        ctx.restore();

        // Health Bar
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX, screenY - 15, 40, 6); 
        ctx.fillStyle = this.isPlayer ? '#2ecc71' : '#e74c3c'; 
        let hpPercent = Math.max(0, this.hp / this.maxHp);
        ctx.fillRect(screenX, screenY - 15, hpPercent * 40, 6);
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.width = CONFIG.CANVAS_W;
        this.canvas.height = CONFIG.CANVAS_H;
        this.state = 'LOADING';
        this.selectedBrawler = null;
        this.mode = 'showdown';
        this.keys = {};
        this.entities = [];
        this.walls = [];
        this.bushes = [];
        this.camera = { x: 0, y: 0 };
        this.mapWidth = 2000;
        this.mapHeight = 1500;
        
        this.projectiles = []; 
        this.mouseX = 0;
        this.mouseY = 0;
        this.ProjectileClass = Projectile;
        
        // SAVE BUTTON REF
        this.btnSuper = document.getElementById('super-btn');

        window.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);

        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        // Mouse Down for Shooting
        window.addEventListener('mousedown', () => {
            if (this.state === 'GAME' && this.player) {
                const now = Date.now();
                
                // 1. CHECK COOLDOWN
                if (now - this.player.lastAttackTime < this.player.shotCooldown) {
                    return;
                }

                // 2. CHECK AMMO
                if (this.player.currentAmmo > 0) {
                    performAttack(this.player, this, this.mouseX, this.mouseY);
                    this.player.currentAmmo--;
                    this.player.lastAttackTime = now;
                    this.player.reloadTimer = 0; 
                    this.updateAmmoUI();
                } else {
                    console.log("Out of Ammo!");
                }
            }
        });
    }

    init() {
        console.log("ENGINE LINKED. ASSETS READY.");
        this.setupMenu();
    }

    checkWallCollision(x, y) {
        for (let w of this.walls) {
            if (x > w.x && x < w.x + w.w && y > w.y && y < w.y + w.h) {
                return true;
            }
        }
        return false;
    }

    loadAssets() {
        return Promise.resolve();
    }

    setupMenu() {
        this.state = 'MENU';
        const btnSolo = document.getElementById('btn-showdown');
        const btnKnock = document.getElementById('btn-knockout');
        const btnPlay = document.getElementById('play-btn');

        if (btnPlay) {
            btnPlay.onclick = () => {
                if (this.selectedBrawler) {
                    this.startMatch();
                } else {
                    console.log("Select a brawler first!");
                }
            };
        }

        if (btnSolo) {
            btnSolo.onclick = () => {
                this.mode = 'showdown';
                this.openMenu();
            };
        }

        if (btnKnock) {
            btnKnock.onclick = () => {
                this.mode = 'knockout';
                this.openMenu();
            };
        }

        // SUPER BUTTON CLICK
        if (this.btnSuper) {
            this.btnSuper.onclick = (e) => {
                e.stopPropagation(); 

                if (this.player && this.player.superCharge >= 100) {
                    performSuper(this.player, this, this.mouseX, this.mouseY);
                    this.player.superCharge = 0;
                    this.btnSuper.style.filter = "grayscale(100%)";
                    this.btnSuper.style.animation = "none";
                } else {
                    console.log("Super not ready yet!");
                }
            };
        }
    }

    openMenu() {
        document.getElementById('screen-home').style.display = 'none';
        const selectScreen = document.getElementById('screen-select');
        selectScreen.classList.remove('hidden');
        selectScreen.style.display = 'flex';
        this.renderGrid();
    }

    renderGrid() {
        const grid = document.getElementById('grid');
        grid.innerHTML = ''; 

        grid.style.maxHeight = '500px'; 
        grid.style.overflowY = 'auto';   
        grid.style.display = 'flex';     
        grid.style.flexWrap = 'wrap';    
        grid.style.justifyContent = 'center';

        BRAWLERS.forEach(b => {
            const card = document.createElement('div');
            card.className = 'card';
            
            let imgHTML = `<div style="font-size:40px;">${b.icon || '❓'}</div>`;
            card.innerHTML = `${imgHTML}<div>${b.name}</div>`;
            
            card.onclick = () => {
                document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedBrawler = b;
                
                const descLabel = document.getElementById('brawler-desc');
                if(descLabel) descLabel.innerText = b.desc;
                
                const playBtn = document.getElementById('play-btn');
                if(playBtn) {
                    playBtn.disabled = false;
                    playBtn.style.opacity = "1";
                    playBtn.style.cursor = "pointer";
                }
            };
            grid.appendChild(card);
        });
    }

    startMatch() {
        document.getElementById('screen-select').style.display = 'none';
        this.state = 'GAME';

        if (this.mode === 'knockout') {
            this.loadMap(MAP_OUT_OPEN);
        } else {
            this.loadMap(MAP_SKULL_CREEK);
        }

        this.loop();
    }

    loadMap(originalAscii) {
        this.walls = [];
        this.bushes = [];
        this.entities = [];
        
        if (!originalAscii) return;

        const mapW = originalAscii[0].length;
        const borderRow = "Z".repeat(mapW + 2); 
        
        let ascii = [];
        ascii.push(borderRow); 
        for(let row of originalAscii) {
            ascii.push("Z" + row + "Z");
        }
        ascii.push(borderRow); 

        this.mapWidth = ascii[0].length * CONFIG.TILE_SIZE;
        this.mapHeight = ascii.length * CONFIG.TILE_SIZE;

        for (let r = 0; r < ascii.length; r++) {
            for (let c = 0; c < ascii[r].length; c++) {
                let x = c * CONFIG.TILE_SIZE;
                let y = r * CONFIG.TILE_SIZE;
                let tile = ascii[r][c];

                if (tile === '#' || tile === 'Z') {
                    this.walls.push({ x, y, w: CONFIG.TILE_SIZE, h: CONFIG.TILE_SIZE, type: 'wall' });
                } else if (tile === 'X') {
                    this.walls.push({ x, y, w: CONFIG.TILE_SIZE, h: CONFIG.TILE_SIZE, type: 'box' });
                } else if (tile === 'W') {
                    this.walls.push({ x, y, w: CONFIG.TILE_SIZE, h: CONFIG.TILE_SIZE, type: 'water' });
                } else if (tile === 'B') {
                    this.bushes.push({ x, y });
                } else if (tile === 'P') {
                    this.player = new Entity(this.selectedBrawler, x, y, true, this);
                    this.entities.push(this.player);
                }
            }
        }
        
        // Spawn AI
        for(let i=0; i<3; i++) {
            let enemy = new Entity(BRAWLERS[0], this.mapWidth - 300, 300 + (i*200), false, this);
            this.entities.push(enemy);
        }
    }

    updateCamera() {
        if (!this.player || !this.mapWidth) return;
        
        let targetX = this.player.x - (CONFIG.CANVAS_W / 2);
        let targetY = this.player.y - (CONFIG.CANVAS_H / 2);

        const maxCamX = this.mapWidth - CONFIG.CANVAS_W;
        const maxCamY = this.mapHeight - CONFIG.CANVAS_H;

        this.camera.x = Math.max(0, Math.min(targetX, Math.max(0, maxCamX)));
        this.camera.y = Math.max(0, Math.min(targetY, Math.max(0, maxCamY)));
    }

    updateAmmoUI() {
        if (!this.player) return;
        
        for (let i = 1; i <= 3; i++) {
            const el = document.getElementById('ammo' + i);
            if (el) {
                if (i <= this.player.currentAmmo) {
                    el.style.backgroundColor = '#e67e22'; 
                    el.style.boxShadow = "0 0 5px #e67e22";
                } else {
                    el.style.backgroundColor = '#333'; 
                    el.style.boxShadow = "none";
                }
            }
        }
    }

    drawWall(x, y) {
        this.ctx.fillStyle = '#d35400'; 
        this.ctx.fillRect(x, y, 50, 40);
        this.ctx.fillStyle = '#a04000'; 
        this.ctx.fillRect(x, y + 40, 50, 10);
        this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
        this.ctx.fillRect(x + 10, y + 10, 5, 20);
        this.ctx.fillRect(x + 30, y + 5, 10, 5);
    }

    drawWater(x, y) {
        this.ctx.fillStyle = '#2980b9';
        this.ctx.fillRect(x, y, 50, 50);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(x + 10, y + 15, 25, 4);
        this.ctx.fillRect(x + 5, y + 35, 10, 4);
    }

    drawBush(x, y) {
        this.ctx.fillStyle = '#2ecc71'; 
        this.ctx.beginPath();
        this.ctx.arc(x + 15, y + 15, 20, 0, Math.PI * 2);
        this.ctx.arc(x + 35, y + 15, 20, 0, Math.PI * 2);
        this.ctx.arc(x + 25, y + 35, 18, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#27ae60';
        this.ctx.beginPath();
        this.ctx.arc(x + 25, y + 25, 10, 0, Math.PI * 2);
        this.ctx.fill();
    }

    loop() {
        if (this.state !== 'GAME') return;

        this.ctx.globalAlpha = 1.0; 

        // 1. CLEAR SCREEN (Sand Floor)
        this.ctx.fillStyle = ASSETS.floor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. UPDATE
        this.entities.forEach(e => e.update());
        this.updateCamera();

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            p.update();
            if (!p.active) this.projectiles.splice(i, 1);
        }

        // 3. DRAW MAP
        this.walls.forEach(w => {
            let drawX = w.x - this.camera.x;
            let drawY = w.y - this.camera.y;
            if (drawX > -60 && drawX < CONFIG.CANVAS_W + 60 && drawY > -60 && drawY < CONFIG.CANVAS_H + 60) {
                if (w.type === 'wall') this.drawWall(drawX, drawY);
                else if (w.type === 'box') {
                    this.ctx.fillStyle = ASSETS.box; 
                    this.ctx.fillRect(drawX + 5, drawY + 10, 40, 35);
                }
                else if (w.type === 'water') this.drawWater(drawX, drawY);
            }
        });

        this.bushes.forEach(b => {
            let drawX = b.x - this.camera.x;
            let drawY = b.y - this.camera.y;
            this.drawBush(drawX, drawY);
        });

        // 4. DRAW ENTITIES
        this.entities.sort((a, b) => a.y - b.y);
        this.entities.forEach(e => e.draw(this.ctx, this.camera.x, this.camera.y));
        this.projectiles.forEach(p => p.draw(this.ctx, this.camera.x, this.camera.y));

        // 5. AIM LINE
        if (this.player) {
            this.ctx.globalAlpha = 1.0; 
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.player.x + 20 - this.camera.x, this.player.y + 20 - this.camera.y);
            this.ctx.lineTo(this.mouseX, this.mouseY);
            this.ctx.stroke();
        }

        requestAnimationFrame(() => this.loop());
    }
}

const game = new Game();
window.gameInstance = game; 
window.onload = () => game.init();
