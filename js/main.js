import { performAttack } from './combat/attacks.js';
import { performSuper } from './combat/supers.js'; 
import { BRAWLERS } from './data/brawler.js'; 
import { MAP_SKULL_CREEK, MAP_OUT_OPEN } from './data/maps.js';

export const CONFIG = { TILE_SIZE: 50, CANVAS_W: window.innerWidth, CANVAS_H: window.innerHeight, AI_SIGHT_RANGE: 600 };

// --- HAZARD CLASS ---
class Hazard {
    constructor(x, y, radius, damage, owner) {
        this.x = x; this.y = y; this.radius = radius; this.damage = damage; this.owner = owner;
        this.life = 120; this.tickTimer = 0;
    }
    update(dt) {
        this.life -= 1 * dt; this.tickTimer += 1 * dt;
        if (this.tickTimer > 30) {
            this.tickTimer = 0;
            const entities = this.owner.game.entities;
            for (let e of entities) {
                if (e === this.owner) continue;
                if (Math.hypot(e.x - this.x, e.y - this.y) < this.radius) {
                    e.hp -= this.damage;
                    this.owner.game.showFloatText("-" + this.damage, e.x, e.y - 20, '#e74c3c');
                    if (e.hp <= 0) this.owner.game.handleDeath(e, this.owner);
                }
            }
        }
    }
    draw(ctx, camX, camY) {
        ctx.globalAlpha = 0.5; ctx.fillStyle = '#e67e22'; 
        ctx.beginPath(); ctx.arc(this.x - camX, this.y - camY, this.radius, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

class FloatingText {
    constructor(text, x, y, color) { this.text = text; this.x = x; this.y = y; this.color = color; this.life = 40; this.vy = -2; }
    update(dt) { this.y += this.vy * dt; this.life -= 1 * dt; }
    draw(ctx, camX, camY) {
        ctx.globalAlpha = Math.max(0, this.life / 40); ctx.fillStyle = this.color; ctx.font = 'bold 24px Arial';
        ctx.strokeStyle = 'black'; ctx.lineWidth = 4; ctx.strokeText(this.text, this.x - camX, this.y - camY); ctx.fillText(this.text, this.x - camX, this.y - camY);
        ctx.globalAlpha = 1.0;
    }
}

class Projectile {
    constructor(x, y, angle, speed, range, dmg, owner, custom = {}) {
        this.x = x; this.y = y; this.angle = angle; this.speed = speed; this.range = range; this.dmg = dmg; this.owner = owner;
        this.active = true; this.distanceTravelled = 0; this.custom = custom; Object.assign(this, custom);
    }
    update(dt) {
        if (!this.active) return;
        const moveStep = this.speed * dt;
        this.x += Math.cos(this.angle) * moveStep; this.y += Math.sin(this.angle) * moveStep;
        this.distanceTravelled += moveStep;
        if (this.distanceTravelled >= this.range) {
            this.active = false;
            if (this.spawnPool) this.owner.game.hazards.push(new Hazard(this.x, this.y, 40, this.dmg, this.owner));
        }
        if (this.owner.game.checkWallCollision(this.x, this.y, true)) {
            if (this.custom.lob) { } else if (this.custom.bounce) { this.angle += Math.PI / 2; } 
            else if (this.custom.wallBreaker) { this.owner.game.destroyWall(this.x, this.y); } 
            else { this.active = false; }
        }
        this.checkEntityHit();
    }
    checkEntityHit() {
        if (!this.active || (this.custom.lob && this.distanceTravelled < this.range - 20)) return;
        const entities = this.owner.game.entities;
        for (let e of entities) {
            if (e === this.owner) continue; 
            if (this.x > e.x && this.x < e.x + 40 && this.y > e.y && this.y < e.y + 40) {
                if (!this.custom.pierce) this.active = false;
                e.hp -= this.dmg;
                this.owner.game.showFloatText("-" + this.dmg, e.x, e.y - 20, '#fff');
                if (this.custom.poison) { e.poisonTicks = 4; e.poisonOwner = this.owner; this.owner.game.showFloatText("POISON!", e.x, e.y - 40, '#2ecc71'); }
                if (this.owner.superCharge < 100) {
                    this.owner.superCharge += 20; if (this.owner.superCharge > 100) this.owner.superCharge = 100;
                    if (this.owner.isPlayer) {
                         this.owner.game.updateSuperButton(this.owner.superCharge);
                         if (this.owner.superCharge >= 100) this.owner.game.showFloatText("SUPER READY!", this.owner.x, this.owner.y - 50, '#f1c40f');
                    }
                }
                if (e.hp <= 0) this.owner.game.handleDeath(e, this.owner);
                return; 
            }
        }
    }
    draw(ctx, camX, camY) {
        ctx.fillStyle = this.color || '#f1c40f'; ctx.beginPath(); ctx.arc(this.x - camX, this.y - camY, this.size || 5, 0, Math.PI * 2); ctx.fill();
    }
}

class Entity {
    constructor(data, x, y, isPlayer, game) {
        this.data = data; this.x = x; this.y = y; this.w = 40; this.h = 40; this.isPlayer = isPlayer; this.game = game;
        this.hp = data.hp; this.maxHp = data.hp; this.speed = isPlayer ? (data.speed || 6) : 3.5; 
        this.inBush = false; this.targetX = null; this.targetY = null; this.patrolTimer = 0;
        const stats = data.atk || {};
        this.maxAmmo = Number(stats.ammo) || 3; this.currentAmmo = this.maxAmmo;
        this.reloadSpeed = Number(stats.reload) || 1000; this.shotCooldown = Number(stats.cd) || 200;
        this.reloadTimer = 0; this.lastAttackTime = 0; this.superCharge = 0; this.gasTimer = 0;
        this.poisonTicks = 0; this.poisonTimer = 0;
    }
    update(dt) {
        if (this.currentAmmo < this.maxAmmo) {
            this.reloadTimer += (16.6 * dt); 
            if (this.reloadTimer >= this.reloadSpeed) { this.currentAmmo++; this.reloadTimer = 0; }
            if (this.isPlayer) this.game.updateAmmoUI(); 
        }
        this.checkGasDamage(dt); this.updatePoison(dt); this.checkBush();
        
        let dx = 0, dy = 0;
        if (this.isPlayer) {
            if (this.game.keys['w']) dy = -this.speed; if (this.game.keys['s']) dy = this.speed;
            if (this.game.keys['a']) dx = -this.speed; if (this.game.keys['d']) dx = this.speed;
        } else {
            const player = this.game.player;
            if (player) {
                const dist = Math.hypot(player.x - this.x, player.y - this.y);
                const canSee = (dist < CONFIG.AI_SIGHT_RANGE) && (!player.inBush || dist < 100);
                if (canSee) { this.targetX = player.x; this.targetY = player.y; this.patrolTimer = 0; } 
                else if (this.targetX === null || this.hasReachedTarget()) { this.pickRandomPatrolPoint(); }
                if (this.targetX !== null) {
                    const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
                    dx = Math.cos(angle) * this.speed; dy = Math.sin(angle) * this.speed;
                }
            }
        }
        if (dx !== 0 || dy !== 0) this.move(dx * dt, dy * dt);
    }
    updatePoison(dt) {
        if (this.poisonTicks > 0) {
            this.poisonTimer += 1 * dt;
            if (this.poisonTimer > 60) {
                this.hp -= 200; this.poisonTicks--; this.poisonTimer = 0;
                this.game.showFloatText("-200", this.x, this.y - 40, '#2ecc71');
                if (this.hp <= 0) this.game.handleDeath(this, this.poisonOwner);
            }
        }
    }
    checkGasDamage(dt) {
        const gas = this.game.gas; if (!gas || !gas.active) return;
        const inSafeZone = this.x > gas.inset && this.x < this.game.mapWidth - gas.inset && this.y > gas.inset && this.y < this.game.mapHeight - gas.inset;
        if (!inSafeZone) {
            this.gasTimer += (16.6 * dt);
            if (this.gasTimer > 1000) { 
                const dmg = Math.floor(this.maxHp * 0.20); this.hp -= dmg;
                this.game.showFloatText("-" + dmg, this.x, this.y - 40, '#2ecc71');
                this.gasTimer = 0;
                if (this.hp <= 0) this.game.handleDeath(this, null); 
            }
        } else { this.gasTimer = 0; }
    }
    hasReachedTarget() { return this.targetX === null || Math.hypot(this.targetX - this.x, this.targetY - this.y) < 50; }
    pickRandomPatrolPoint() { this.targetX = Math.random() * this.game.mapWidth; this.targetY = Math.random() * this.game.mapHeight; }
    checkBush() {
        const cx = this.x + 20; const cy = this.y + 20; this.inBush = false;
        for (let b of this.game.bushes) { if (cx > b.x && cx < b.x + 50 && cy > b.y && cy < b.y + 50) { this.inBush = true; break; } }
    }
    move(dx, dy) {
        if (!this.checkCollision(this.x + dx, this.y)) this.x += dx;
        if (!this.checkCollision(this.x, this.y + dy)) this.y += dy;
        if (dx !== 0) this.lastMoveX = dx;
    }
    checkCollision(newX, newY) {
        for (let w of this.game.walls) { if (newX < w.x + w.w && newX + this.w > w.x && newY < w.y + w.h && newY + this.h > w.y) return true; }
        return false;
    }
    draw(ctx, camX, camY) {
        let screenX = this.x - camX; let screenY = this.y - camY;
        ctx.globalAlpha = this.inBush ? (this.isPlayer ? 0.6 : 0) : 1.0; 
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(screenX + 20, screenY + 45, 18, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000000'; ctx.font = '40px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.save();
        if (this.lastMoveX < 0) { ctx.scale(-1, 1); ctx.fillText(this.data.icon, -(screenX + 20), screenY + 25); } 
        else { ctx.fillText(this.data.icon, screenX + 20, screenY + 25); }
        ctx.restore();
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#333'; ctx.fillRect(screenX, screenY - 15, 40, 6); 
        ctx.fillStyle = this.isPlayer ? '#2ecc71' : '#e74c3c'; 
        ctx.fillRect(screenX, screenY - 15, Math.max(0, this.hp / this.maxHp) * 40, 6);
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas'); this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CONFIG.CANVAS_W; this.canvas.height = CONFIG.CANVAS_H;
        this.state = 'LOADING'; this.selectedBrawler = null; this.mode = 'showdown';
        this.keys = {}; this.entities = []; this.walls = []; this.bushes = []; this.hazards = [];
        this.camera = { x: 0, y: 0 }; this.projectiles = []; this.floatingTexts = [];
        this.mouseX = 0; this.mouseY = 0; this.ProjectileClass = Projectile;
        this.lastTime = 0; this.targetFPS = 60; this.timestep = 1000 / 60;
        this.gas = { active: false, inset: 0, speed: 15, damage: 1000, delay: 5000 };
        this.globalTime = 0; 
        window.addEventListener('keydown', (e) => { const key = e.key.toLowerCase(); this.keys[key] = true; if (key === 'e') this.tryUseSuper(); });
        window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);
        window.addEventListener('mousemove', (e) => { const rect = this.canvas.getBoundingClientRect(); this.mouseX = e.clientX - rect.left; this.mouseY = e.clientY - rect.top; });
        window.addEventListener('mousedown', () => {
            if (this.state === 'GAME' && this.player) {
                const now = Date.now();
                if (now - this.player.lastAttackTime < this.player.shotCooldown) return;
                if (this.player.currentAmmo >= 1) {
                    performAttack(this.player, this, this.mouseX, this.mouseY);
                    this.player.currentAmmo--; this.player.lastAttackTime = now; this.player.reloadTimer = 0; this.updateAmmoUI();
                } else { this.showFloatText("NO AMMO!", this.player.x + 20, this.player.y - 10, '#e74c3c'); }
            }
        });
    }

    handleDeath(deadEntity, killer) {
        if (deadEntity.dead) return; deadEntity.dead = true;
        this.createExplosion(deadEntity.x+20, deadEntity.y+20, 60, 0, '#aaa', null);
        const idx = this.entities.indexOf(deadEntity); if (idx > -1) this.entities.splice(idx, 1);
        this.updateAliveUI();
        let killerName = killer ? (killer.isPlayer ? "YOU" : "Bot") : "GAS";
        let victimName = deadEntity.isPlayer ? "YOU" : "Bot";
        this.addKillMessage(`${killerName} eliminated ${victimName}`);
        
        // WIN/LOSS LOGIC
        if (deadEntity.isPlayer) {
            setTimeout(() => this.showResult(false), 1000);
        } else if (this.entities.length === 1 && this.entities[0].isPlayer) {
            setTimeout(() => this.showResult(true), 1000);
        }
    }

    showResult(victory) {
        this.state = 'GAMEOVER';
        const screen = document.getElementById('screen-result');
        const title = document.getElementById('result-title');
        const msg = document.getElementById('result-message');
        screen.classList.remove('hidden'); screen.style.display = 'flex';
        if (victory) { title.innerText = "VICTORY!"; title.style.color = "#f1c40f"; msg.innerText = "Rank #1"; }
        else { title.innerText = "DEFEAT"; title.style.color = "#e74c3c"; msg.innerText = `Rank #${this.entities.length+1}`; }
    }

    resetGame() {
        document.getElementById('screen-result').classList.add('hidden');
        document.getElementById('screen-result').style.display = 'none';
        document.getElementById('screen-home').style.display = 'flex';
        this.state = 'MENU';
        this.entities = []; this.projectiles = []; this.hazards = [];
        this.floatingTexts = []; this.walls = []; this.bushes = [];
        this.player = null; this.camera = {x:0, y:0};
        this.ctx.fillStyle='#222'; this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    }

    addKillMessage(msg) {
        const feed = document.getElementById('hud-killfeed'); const div = document.createElement('div');
        div.className = 'kill-msg'; div.innerText = msg; feed.appendChild(div); setTimeout(() => div.remove(), 4000);
    }

    updateAliveUI() {
        const el = document.getElementById('hud-alive');
        const count = this.entities.filter(e => !e.owner).length; el.innerText = `Brawlers Left: ${count}`;
    }

    createExplosion(x, y, radius, damage, color, owner) {
        this.showFloatText("BOOM!", x, y, color);
        for(let e of this.entities) {
             if (e === owner) continue; 
             if (Math.hypot(e.x - x, e.y - y) < radius) {
                 e.hp -= damage; this.showFloatText("-" + damage, e.x, e.y - 20, '#fff');
                 if (owner && owner.superCharge < 100 && owner.isPlayer) { 
                     owner.superCharge += 20; if(owner.superCharge>100) owner.superCharge=100; this.updateSuperButton(owner.superCharge); 
                 }
                 if (e.hp <= 0) this.handleDeath(e, owner);
             }
        }
    }

    showFloatText(text, x, y, color) { this.floatingTexts.push(new FloatingText(text, x, y, color)); }

    updateSuperButton(percent) {
        const btn = document.getElementById('super-btn'); if (!btn) return;
        if (percent >= 100) { btn.classList.add('super-charged'); btn.innerText = "SUPER"; btn.style.background = ""; } 
        else { btn.classList.remove('super-charged'); btn.innerText = "SUPER"; btn.style.background = `linear-gradient(to top, #f1c40f ${percent}%, #444 ${percent}%)`; }
    }

    tryUseSuper() {
        if (this.state === 'GAME' && this.player) {
            if (this.player.superCharge >= 100) {
                this.showFloatText("SUPER USED!", this.player.x + 20, this.player.y - 20, '#f1c40f');
                performSuper(this.player, this, this.mouseX, this.mouseY);
                this.player.superCharge = 0; this.updateSuperButton(0); 
            } else { this.showFloatText("NOT READY!", this.player.x + 20, this.player.y - 20, '#95a5a6'); }
        }
    }

    init() { console.log("ENGINE LINKED."); this.setupMenu(); }

    checkWallCollision(x, y, isProjectile = false) {
        for (let w of this.walls) {
            if (isProjectile && w.type === 'water') continue;
            if (x > w.x && x < w.x + w.w && y > w.y && y < w.y + w.h) return true;
        }
        return false;
    }

    destroyWall(x, y) {
        for (let i = this.walls.length - 1; i >= 0; i--) {
            let w = this.walls[i];
            if (x > w.x && x < w.x + w.w && y > w.y && y < w.y + w.h) {
                if (w.type === 'wall' || w.type === 'box') { this.showFloatText("CRASH!", w.x, w.y, '#fff'); this.walls.splice(i, 1); }
                return;
            }
        }
    }

    loadAssets() { return Promise.resolve(); }

    setupMenu() {
        this.state = 'MENU';
        const setupBtn = (id, cb) => { const el = document.getElementById(id); if(el) el.onclick = cb; };
        setupBtn('play-btn', () => { if(this.selectedBrawler) this.startMatch(); });
        setupBtn('btn-showdown', () => { this.mode='showdown'; this.openMenu(); });
        setupBtn('btn-knockout', () => { this.mode='knockout'; this.openMenu(); });
        setupBtn('btn-menu', () => { this.resetGame(); }); // Wire up new button
        const superBtn = document.getElementById('super-btn');
        if(superBtn) superBtn.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); this.tryUseSuper(); };
    }

    updateAmmoUI() {
        if (!this.player) return;
        let reloadPercent = (this.player.currentAmmo < this.player.maxAmmo) ? (this.player.reloadTimer / this.player.reloadSpeed) * 100 : 0;
        for (let i = 1; i <= 3; i++) {
            const el = document.getElementById('ammo' + i);
            if (el) {
                if (i <= this.player.currentAmmo) { el.style.background = '#e67e22'; el.style.boxShadow = "0 0 5px #e67e22"; }
                else if (i === this.player.currentAmmo + 1) { el.style.background = `linear-gradient(to right, #e67e22 ${reloadPercent}%, #333 ${reloadPercent}%)`; el.style.boxShadow = "none"; }
                else { el.style.background = '#333'; el.style.boxShadow = "none"; }
            }
        }
    }

    openMenu() {
        document.getElementById('screen-home').style.display = 'none';
        const s = document.getElementById('screen-select'); s.classList.remove('hidden'); s.style.display = 'flex';
        this.renderGrid();
    }

    renderGrid() {
        const grid = document.getElementById('grid'); grid.innerHTML = ''; 
        grid.style.maxHeight = '500px'; grid.style.overflowY = 'auto'; grid.style.display = 'flex'; grid.style.flexWrap = 'wrap'; grid.style.justifyContent = 'center';
        BRAWLERS.forEach(b => {
            const card = document.createElement('div'); card.className = 'card';
            card.innerHTML = `<div style="font-size:40px;">${b.icon || '❓'}</div><div>${b.name}</div>`;
            card.onclick = () => {
                document.querySelectorAll('.card').forEach(c => c.classList.remove('selected')); card.classList.add('selected');
                this.selectedBrawler = b; document.getElementById('brawler-desc').innerText = b.desc;
                const p = document.getElementById('play-btn'); p.disabled = false; p.style.opacity = "1"; p.style.cursor = "pointer";
            };
            grid.appendChild(card);
        });
    }

    startMatch() {
        document.getElementById('screen-select').style.display = 'none'; this.state = 'GAME';
        if (this.mode === 'knockout') this.loadMap(MAP_OUT_OPEN); else this.loadMap(MAP_SKULL_CREEK);
        this.lastTime = Date.now(); this.loop();
        if(this.player) { this.player.superCharge = 0; this.updateSuperButton(0); this.updateAmmoUI(); }
        this.gas = { active: true, inset: 0, speed: 15, damage: 1000, delay: 5000 };
        this.updateAliveUI();
    }

    loadMap(ascii) {
        if (!ascii) return;
        this.walls=[]; this.bushes=[]; this.entities=[]; this.hazards=[];
        const mapW = ascii[0].length; const border = "Z".repeat(mapW+2);
        let fullMap = [border, ...ascii.map(r=>"Z"+r+"Z"), border];
        this.mapWidth = fullMap[0].length * CONFIG.TILE_SIZE; this.mapHeight = fullMap.length * CONFIG.TILE_SIZE;

        for (let r=0; r<fullMap.length; r++) {
            for (let c=0; c<fullMap[r].length; c++) {
                let x=c*CONFIG.TILE_SIZE, y=r*CONFIG.TILE_SIZE, tile=fullMap[r][c];
                if (tile==='#') this.walls.push({x,y,w:CONFIG.TILE_SIZE,h:CONFIG.TILE_SIZE,type:'wall'});
                else if (tile==='Z') this.walls.push({x,y,w:CONFIG.TILE_SIZE,h:CONFIG.TILE_SIZE,type:'bedrock'});
                else if (tile==='X') this.walls.push({x,y,w:CONFIG.TILE_SIZE,h:CONFIG.TILE_SIZE,type:'box'});
                else if (tile==='W') this.walls.push({x,y,w:CONFIG.TILE_SIZE,h:CONFIG.TILE_SIZE,type:'water'});
                else if (tile==='B') this.bushes.push({x,y});
                else if (tile==='P') { this.player = new Entity(this.selectedBrawler,x,y,true,this); this.entities.push(this.player); }
            }
        }
        for(let i=0; i<3; i++) this.entities.push(new Entity(BRAWLERS[0], this.mapWidth-300, 300+(i*200), false, this));
    }

    updateCamera() {
        if (!this.player) return;
        let tx = this.player.x - CONFIG.CANVAS_W/2, ty = this.player.y - CONFIG.CANVAS_H/2;
        this.camera.x = Math.max(0, Math.min(tx, this.mapWidth - CONFIG.CANVAS_W));
        this.camera.y = Math.max(0, Math.min(ty, this.mapHeight - CONFIG.CANVAS_H));
    }

    drawWall(x, y, type) {
        if (type === 'bedrock') { this.ctx.fillStyle='#5d4037'; this.ctx.fillRect(x,y,50,50); this.ctx.fillStyle='#3e2723'; this.ctx.fillRect(x+5,y+5,40,40); return; }
        this.ctx.fillStyle='#d35400'; this.ctx.fillRect(x,y,50,40); 
        this.ctx.fillStyle='#e67e22'; this.ctx.fillRect(x,y,50,10); 
        this.ctx.fillStyle='#a04000'; this.ctx.fillRect(x,y+40,50,10); 
    }
    drawWater(x, y) {
        this.ctx.fillStyle='#2980b9'; this.ctx.fillRect(x,y,50,50);
        const offset = Math.sin(this.globalTime * 0.005 + x * 0.1) * 3;
        this.ctx.fillStyle='rgba(255,255,255,0.2)'; this.ctx.fillRect(x, y+20+offset, 50, 5);
    }
    drawBush(x, y) {
        const cx = x+25, cy = y+25;
        this.ctx.fillStyle='#2ecc71'; this.ctx.beginPath(); this.ctx.arc(cx, cy, 25, 0, Math.PI*2); this.ctx.fill(); 
        this.ctx.fillStyle='#27ae60'; this.ctx.beginPath(); this.ctx.arc(cx-10, cy-5, 15, 0, Math.PI*2); this.ctx.fill(); 
        this.ctx.beginPath(); this.ctx.arc(cx+10, cy+5, 12, 0, Math.PI*2); this.ctx.fill(); 
    }
    drawGas() {
        if (!this.gas.active || this.gas.inset <= 0) return;
        const i = this.gas.inset, cx=this.camera.x, cy=this.camera.y, W=this.mapWidth, H=this.mapHeight;
        this.ctx.fillStyle='rgba(46,204,113,0.3)'; 
        this.ctx.fillRect(-cx, -cy, W, i); this.ctx.fillRect(-cx, H-i-cy, W, i); this.ctx.fillRect(-cx, i-cy, i, H-i*2); this.ctx.fillRect(W-i-cx, i-cy, i, H-i*2); 
    }

    loop() {
        if (this.state !== 'GAME') return;
        requestAnimationFrame(() => this.loop());
        const now = Date.now(); let elapsed = now - this.lastTime;
        if (elapsed > 100) elapsed = 100; const dt = elapsed / this.timestep; this.lastTime = now;
        this.globalTime += elapsed; 

        if (this.gas.active) {
            if (this.gas.delay > 0) this.gas.delay -= elapsed;
            else { this.gas.inset += (this.gas.speed * dt) * 0.016; const max = Math.min(this.mapWidth, this.mapHeight)/2 - 150; if (this.gas.inset > max) this.gas.inset = max; }
        }

        this.entities.forEach(e => e.update(dt)); this.hazards.forEach(h => h.update(dt)); 
        for (let i=this.hazards.length-1; i>=0; i--) if (this.hazards[i].life <= 0) this.hazards.splice(i,1);
        for (let i=this.projectiles.length-1; i>=0; i--) { this.projectiles[i].update(dt); if (!this.projectiles[i].active) this.projectiles.splice(i,1); }
        for (let i=this.floatingTexts.length-1; i>=0; i--) { this.floatingTexts[i].update(dt); if (this.floatingTexts[i].life <= 0) this.floatingTexts.splice(i,1); }
        this.updateCamera();

        this.ctx.fillStyle = '#e8d6b4'; this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
        this.ctx.strokeStyle = 'rgba(0,0,0,0.05)'; this.ctx.lineWidth = 1; this.ctx.beginPath();
        const gridSize = CONFIG.TILE_SIZE, offsetX = -this.camera.x % gridSize, offsetY = -this.camera.y % gridSize;
        for (let x = offsetX; x < this.canvas.width; x += gridSize) { this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.canvas.height); }
        for (let y = offsetY; y < this.canvas.height; y += gridSize) { this.ctx.moveTo(0, y); this.ctx.lineTo(this.canvas.width, y); }
        this.ctx.stroke();

        this.hazards.forEach(h => h.draw(this.ctx, this.camera.x, this.camera.y));
        this.walls.forEach(w => {
            let dx = w.x - this.camera.x, dy = w.y - this.camera.y;
            if (dx > -60 && dx < CONFIG.CANVAS_W+60 && dy > -60 && dy < CONFIG.CANVAS_H+60) {
                if (w.type === 'wall' || w.type === 'bedrock') this.drawWall(dx, dy, w.type);
                else if (w.type === 'box') { this.ctx.fillStyle=ASSETS.box; this.ctx.fillRect(dx+5,dy+10,40,35); }
                else if (w.type === 'water') this.drawWater(dx, dy);
            }
        });
        this.bushes.forEach(b => { let dx = b.x-this.camera.x, dy=b.y-this.camera.y; this.drawBush(dx, dy); });
        this.entities.sort((a,b) => a.y - b.y);
        this.entities.forEach(e => e.draw(this.ctx, this.camera.x, this.camera.y));
        this.projectiles.forEach(p => p.draw(this.ctx, this.camera.x, this.camera.y));
        this.floatingTexts.forEach(t => t.draw(this.ctx, this.camera.x, this.camera.y));
        this.drawGas();
        if (this.player) {
            this.ctx.strokeStyle = 'rgba(255,255,255,0.5)'; this.ctx.lineWidth = 2;
            this.ctx.beginPath(); this.ctx.moveTo(this.player.x+20-this.camera.x, this.player.y+20-this.camera.y);
            this.ctx.lineTo(this.mouseX, this.mouseY); this.ctx.stroke();
        }
    }
}

const game = new Game();
window.gameInstance = game; 
window.onload = () => game.init();
