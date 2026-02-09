// js/main.js
import { drawReticle } from './combat/reticles.js';
import { performAttack } from './combat/attacks.js';
import { performSuper } from './combat/supers.js'; 
import { BRAWLERS } from './data/brawler.js'; 
import { MAP_SKULL_CREEK, MAP_OUT_OPEN } from './data/maps.js';

export const CONFIG = {
    TILE_SIZE: 50,
    CANVAS_W: window.innerWidth, 
    CANVAS_H: window.innerHeight, 
    AI_SIGHT_RANGE: 600
};

// --- FLOATING TEXT CLASS ---
class FloatingText {
    constructor(text, x, y, color) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.color = color;
        this.life = 40; 
        this.vy = -2;   
    }
    update(dt) {
        this.y += this.vy * dt;
        this.life -= 1 * dt;
    }
    draw(ctx, camX, camY) {
        ctx.globalAlpha = Math.max(0, this.life / 40);
        ctx.fillStyle = this.color;
        ctx.font = 'bold 24px Arial';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.strokeText(this.text, this.x - camX, this.y - camY);
        ctx.fillText(this.text, this.x - camX, this.y - camY);
        ctx.globalAlpha = 1.0;
    }
}

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
        this.wallBreaker = custom.wallBreaker || false;
        Object.assign(this, custom);
    }

    update(dt) {
        if (!this.active) return;
        
        const moveStep = this.speed * dt;
        this.x += Math.cos(this.angle) * moveStep;
        this.y += Math.sin(this.angle) * moveStep;
        this.distanceTravelled += moveStep;
        
        if (this.distanceTravelled >= this.range) this.active = false;
        
        // Pass 'true' to indicate this is a projectile (ignores water)
        if (this.owner.game.checkWallCollision(this.x, this.y, true)) {
            if (this.wallBreaker) {
                this.owner.game.destroyWall(this.x, this.y);
            } else {
                this.active = false;
            }
        }

        this.checkEntityHit();
    }

    checkEntityHit() {
        if (!this.active) return;
        const entities = this.owner.game.entities;
        
        for (let e of entities) {
            if (e === this.owner) continue; 
            
            if (this.x > e.x && this.x < e.x + 40 &&
                this.y > e.y && this.y < e.y + 40) {
                
                this.active = false;
                e.hp -= this.dmg;
                
                this.owner.game.showFloatText("-" + this.dmg, e.x, e.y - 20, '#fff');

                // Charge Super
                if (this.owner.superCharge < 100) {
                    this.owner.superCharge += 20; 
                    if (this.owner.superCharge > 100) this.owner.superCharge = 100;
                    if (this.owner.isPlayer) {
                         this.owner.game.updateSuperButton(this.owner.superCharge);
                         if (this.owner.superCharge >= 100) {
                             this.owner.game.showFloatText("SUPER READY!", this.owner.x, this.owner.y - 50, '#f1c40f');
                         }
                    }
                }

                if (e.hp <= 0) {
                     this.owner.game.handleDeath(e, this.owner);
                }
                return; 
            }
        }
    }

    draw(ctx, camX, camY) {
        ctx.fillStyle = this.color || '#f1c40f';
        let size = this.size || 5;
        ctx.beginPath();
        ctx.arc(this.x - camX, this.y - camY, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

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

        // STATS
        const stats = data.atk || {};
        this.maxAmmo = 3; 
        if (stats.ammo) this.maxAmmo = Number(stats.ammo);
        this.currentAmmo = this.maxAmmo;
        
        this.reloadSpeed = 1000; 
        if (stats.reload) {
            let r = Number(stats.reload);
            this.reloadSpeed = (r < 100) ? r * 16 : r;
        }

        this.shotCooldown = Number(stats.cd) || 200;
        
        this.reloadTimer = 0;
        this.lastAttackTime = 0;
        this.superCharge = 0; 
        this.superMax = 100;
        this.gasTimer = 0;
    }

    update(dt) {
        // AMMO LOGIC
        if (this.currentAmmo < this.maxAmmo) {
            this.reloadTimer += (16.6 * dt); 
            if (this.reloadTimer >= this.reloadSpeed) {
                this.currentAmmo++;
                this.reloadTimer = 0;
            }
            if (this.isPlayer) this.game.updateAmmoUI(); 
        }

        this.checkGasDamage(dt);
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

        if (dx !== 0 || dy !== 0) this.move(dx * dt, dy * dt);
    }

    checkGasDamage(dt) {
        const gas = this.game.gas;
        if (!gas || !gas.active) return;

        const inSafeZone = 
            this.x > gas.inset && 
            this.x < this.game.mapWidth - gas.inset &&
            this.y > gas.inset && 
            this.y < this.game.mapHeight - gas.inset;

        if (!inSafeZone) {
            this.gasTimer += (16.6 * dt);
            if (this.gasTimer > 1000) { 
                // DEAL 20% MAX HP DAMAGE
                const dmg = Math.floor(this.maxHp * 0.20);
                this.hp -= dmg;
                
                this.game.showFloatText("-" + dmg, this.x, this.y - 40, '#2ecc71');
                this.gasTimer = 0;
                
                if (this.hp <= 0) {
                     this.game.showFloatText("LOST IN SMOKE", this.x, this.y, '#e74c3c');
                     this.game.handleDeath(this, null);
                }
            }
        } else {
            this.gasTimer = 0; 
        }
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

        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(screenX + 20, screenY + 45, 15, 6, 0, 0, Math.PI * 2);
        ctx.fill();

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
        this.floatingTexts = []; 
        this.mouseX = 0;
        this.mouseY = 0;
        this.ProjectileClass = Projectile;
        
        this.lastTime = 0;
        this.targetFPS = 60;
        this.timestep = 1000 / 60; 

        this.gas = {
            active: false,
            inset: 0,
            speed: 15,
            damage: 1000,
            delay: 5000
        };

        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            if (key === 'e') this.tryUseSuper();
        });
        
        window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);

        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        window.addEventListener('mousedown', () => {
            if (this.state === 'GAME' && this.player) {
                const now = Date.now();
                if (now - this.player.lastAttackTime < this.player.shotCooldown) return;

                if (this.player.currentAmmo >= 1) {
                    performAttack(this.player, this, this.mouseX, this.mouseY);
                    this.player.currentAmmo--;
                    this.player.lastAttackTime = now;
                    this.player.reloadTimer = 0; 
                    this.updateAmmoUI();
                } else {
                    this.showFloatText("NO AMMO!", this.player.x + 20, this.player.y - 10, '#e74c3c');
                }
            }
        });
    }

    showFloatText(text, x, y, color) {
        this.floatingTexts.push(new FloatingText(text, x, y, color));
    }

    updateSuperButton(percent) {
        const btn = document.getElementById('super-btn');
        if (!btn) return;

        if (percent >= 100) {
            btn.classList.add('super-charged');
            btn.innerText = "SUPER"; 
            btn.style.background = ""; 
        } else {
            btn.classList.remove('super-charged');
            btn.innerText = "SUPER";
            btn.style.background = `linear-gradient(to top, #f1c40f ${percent}%, #444 ${percent}%)`;
        }
    }

    tryUseSuper() {
        if (this.state === 'GAME' && this.player) {
            if (this.player.superCharge >= 100) {
                this.showFloatText("SUPER USED!", this.player.x + 20, this.player.y - 20, '#f1c40f');
                performSuper(this.player, this, this.mouseX, this.mouseY);
                this.player.superCharge = 0; 
                this.updateSuperButton(0); 
            } else {
                this.showFloatText("NOT READY!", this.player.x + 20, this.player.y - 20, '#95a5a6');
            }
        }
    }

    init() {
        console.log("ENGINE LINKED. ASSETS READY.");
        this.setupMenu();
    }

    checkWallCollision(x, y, isProjectile = false) {
        for (let w of this.walls) {
            // Projectiles fly over water
            if (isProjectile && w.type === 'water') continue;

            if (x > w.x && x < w.x + w.w && y > w.y && y < w.y + w.h) {
                return true;
            }
        }
        return false;
    }

    destroyWall(x, y) {
        for (let i = this.walls.length - 1; i >= 0; i--) {
            let w = this.walls[i];
            if (x > w.x && x < w.x + w.w && y > w.y && y < w.y + w.h) {
                // *** BEDROCK PROTECTION: Only break walls/boxes ***
                if (w.type === 'wall' || w.type === 'box') {
                    this.showFloatText("CRASH!", w.x, w.y, '#fff');
                    this.walls.splice(i, 1);
                }
                return;
            }
        }
    }

    loadAssets() {
        return Promise.resolve();
    }

    setupMenu() {
        this.state = 'MENU';
        const btnSolo = document.getElementById('btn-showdown');
        const btnKnock = document.getElementById('btn-knockout');
        const btnPlay = document.getElementById('play-btn');
        const btnSuper = document.getElementById('super-btn'); 
        const btnMenu = document.getElementById('btn-menu'); // NEW: Main Menu Button

        // RESET GAME LISTENER
        if (btnMenu) {
            btnMenu.onclick = () => {
                this.resetGame();
            };
        }

        if (btnSuper) {
            btnSuper.onmousedown = (e) => {
                e.preventDefault(); 
                e.stopPropagation(); 
                this.tryUseSuper(); 
            };
        }

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
    }

    // *** NEW: RESET GAME LOGIC ***
    resetGame() {
        document.getElementById('screen-result').classList.add('hidden');
        document.getElementById('screen-home').style.display = 'block';
        
        this.state = 'MENU';
        this.entities = [];
        this.projectiles = [];
        this.floatingTexts = [];
        this.walls = [];
        this.bushes = [];
        this.player = null;
        this.camera = { x: 0, y: 0 };
        
        // Clear Canvas
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    updateAmmoUI() {
        if (!this.player) return;
        
        let reloadPercent = 0;
        if (this.player.currentAmmo < this.player.maxAmmo) {
            reloadPercent = (this.player.reloadTimer / this.player.reloadSpeed) * 100;
        }

        for (let i = 1; i <= 3; i++) {
            const el = document.getElementById('ammo' + i);
            if (el) {
                if (i <= this.player.currentAmmo) {
                    el.style.background = '#e67e22'; 
                    el.style.boxShadow = "0 0 5px #e67e22";
                } else if (i === this.player.currentAmmo + 1) {
                    el.style.background = `linear-gradient(to right, #e67e22 ${reloadPercent}%, #333 ${reloadPercent}%)`;
                    el.style.boxShadow = "none";
                } else {
                    el.style.background = '#333'; 
                    el.style.boxShadow = "none";
                }
            }
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
        if (this.mode === 'knockout') this.loadMap(MAP_OUT_OPEN);
        else this.loadMap(MAP_SKULL_CREEK);
        
        this.lastTime = Date.now();
        this.loop();
        
        if(this.player) {
            this.player.superCharge = 0;
            this.updateSuperButton(0); 
            this.updateAmmoUI();
        }

        // RESET GAS
        this.gas = {
            active: true,
            inset: 0,
            speed: 15,
            damage: 1000,
            delay: 5000 // 5 Seconds wait
        };
        
        this.updateAliveUI();
    }

    // *** UPDATED: WIN/LOSE LOGIC ***
    handleDeath(deadEntity, killer) {
        if (deadEntity.dead) return;
        deadEntity.dead = true;
        
        this.showFloatText("ELIMINATED!", deadEntity.x, deadEntity.y, '#e74c3c');
        const idx = this.entities.indexOf(deadEntity);
        if (idx > -1) this.entities.splice(idx, 1);
        
        this.updateAliveUI();

        // Check Win/Loss
        if (deadEntity.isPlayer) {
            // LOSE
            setTimeout(() => this.showResult(false), 1000);
        } else if (this.entities.length === 1 && this.entities[0].isPlayer) {
            // WIN
            setTimeout(() => this.showResult(true), 1000);
        }
    }

    showResult(victory) {
        this.state = 'GAMEOVER';
        const screen = document.getElementById('screen-result');
        const title = document.getElementById('result-title');
        const msg = document.getElementById('result-msg');
        
        screen.classList.remove('hidden');
        screen.style.display = 'flex';

        if (victory) {
            title.innerText = "VICTORY!";
            title.style.color = "#f1c40f";
            msg.innerText = "Rank #1";
        } else {
            title.innerText = "DEFEAT";
            title.style.color = "#e74c3c";
            msg.innerText = `Rank #${this.entities.length + 1}`;
        }
    }

    updateAliveUI() {
        const el = document.getElementById('hud-alive');
        if (el) el.innerText = `Brawlers: ${this.entities.length}`;
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

                if (tile === '#') {
                    this.walls.push({ x, y, w: CONFIG.TILE_SIZE, h: CONFIG.TILE_SIZE, type: 'wall' });
                } else if (tile === 'Z') {
                    // Bedrock (Unbreakable)
                    this.walls.push({ x, y, w: CONFIG.TILE_SIZE, h: CONFIG.TILE_SIZE, type: 'bedrock' });
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

    drawWall(x, y, type) {
        if (type === 'bedrock') {
             this.ctx.fillStyle = '#a04000'; // Darker
             this.ctx.fillRect(x, y, 50, 50);
             this.ctx.fillStyle = '#6e2c00'; // Dark border
             this.ctx.fillRect(x + 5, y + 5, 40, 40);
             return;
        }

        // Normal Walls
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

    drawGas() {
        if (!this.gas.active || this.gas.inset <= 0) return;
        const inset = this.gas.inset;
        const mapW = this.mapWidth;
        const mapH = this.mapHeight;
        const cx = this.camera.x;
        const cy = this.camera.y;

        this.ctx.fillStyle = 'rgba(46, 204, 113, 0.4)'; 
        
        this.ctx.fillRect(0 - cx, 0 - cy, mapW, inset); // Top
        this.ctx.fillRect(0 - cx, mapH - inset - cy, mapW, inset); // Bottom
        this.ctx.fillRect(0 - cx, inset - cy, inset, mapH - (inset * 2)); // Left
        this.ctx.fillRect(mapW - inset - cx, inset - cy, inset, mapH - (inset * 2)); // Right
    }

    loop() {
        if (this.state !== 'GAME') return;

        requestAnimationFrame(() => this.loop());

        const now = Date.now();
        let elapsed = now - this.lastTime;
        if (elapsed > 100) elapsed = 100;
        const dt = elapsed / this.timestep;
        this.lastTime = now;

        // GAS UPDATE
        if (this.gas.active) {
            if (this.gas.delay > 0) {
                this.gas.delay -= elapsed;
            } else {
                this.gas.inset += (this.gas.speed * dt) * 0.016; 
                const maxInset = Math.min(this.mapWidth, this.mapHeight) / 2 - 150;
                if (this.gas.inset > maxInset) this.gas.inset = maxInset;
            }
        }

        this.entities.forEach(e => e.update(dt)); 
        
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            p.update(dt); 
            if (!p.active) this.projectiles.splice(i, 1);
        }

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            let ft = this.floatingTexts[i];
            ft.update(dt); 
            if (ft.life <= 0) this.floatingTexts.splice(i, 1);
        }

        this.updateCamera();

        // RENDER
        this.ctx.globalAlpha = 1.0; 
        this.ctx.fillStyle = ASSETS.floor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.walls.forEach(w => {
            let drawX = w.x - this.camera.x;
            let drawY = w.y - this.camera.y;
            if (drawX > -60 && drawX < CONFIG.CANVAS_W + 60 && drawY > -60 && drawY < CONFIG.CANVAS_H + 60) {
                if (w.type === 'wall' || w.type === 'bedrock') {
                    this.drawWall(drawX, drawY, w.type);
                }
                else if (w.type === 'box') {
                    this.ctx.fillStyle = ASSETS.box; 
                    this.ctx.fillRect(drawX + 5, drawY + 10, 40, 35);
                }
                else if (w.type === 'water') {
                    this.drawWater(drawX, drawY);
                }
            }
        });

        this.bushes.forEach(b => {
            let drawX = b.x - this.camera.x;
            let drawY = b.y - this.camera.y;
            this.drawBush(drawX, drawY);
        });

        this.entities.sort((a, b) => a.y - b.y);
        this.entities.forEach(e => e.draw(this.ctx, this.camera.x, this.camera.y));
        this.projectiles.forEach(p => p.draw(this.ctx, this.camera.x, this.camera.y));
        this.floatingTexts.forEach(ft => ft.draw(this.ctx, this.camera.x, this.camera.y));
        
        this.drawGas();

        if (this.player) {
            // Draw the new advanced reticle
            drawReticle(this.ctx, this.player, this, this.mouseX, this.mouseY);
        }
    }
}

const game = new Game();
window.gameInstance = game; 
window.onload = () => game.init();
