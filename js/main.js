// js/main.js

// --- 1. DATA (Embedded to prevent loading errors) ---
const BRAWLERS = [
    { name: "SHELLY", icon: "🤠", hp: 3800, speed: 6, desc: "Shotgun fighter!" },
    { name: "COLT", icon: "👮", hp: 2800, speed: 7, desc: "Long range sharpshooter." },
    { name: "EL PRIMO", icon: "🤼", hp: 5000, speed: 7, desc: "Close range tank." }
];

// A 60x40 Map (Huge) to force camera scrolling
const GAME_MAP = [
    "############################################################",
    "#..........................................................#",
    "#......P.....................BBB...........................#",
    "#............................BBB...........................#",
    "#...XXXX......BBBB...........BBB...........................#",
    "#...XXXX......BBBB.........................................#",
    "#.......................#######............................#",
    "#.......................#######............................#",
    "#.......BBBBBB.............................................#",
    "#.......BBBBBB.............................................#",
    "#.......BBBBBB...........XXXXX..........BBBBBBBB...........#",
    "#........................XXXXX..........BBBBBBBB...........#",
    "#.......................................BBBBBBBB...........#",
    "#..........................................................#",
    "#...######.......BBBBBB.........BBBBBB.......######........#",
    "#...######.......BBBBBB.........BBBBBB.......######........#",
    "#..........................................................#",
    "#..........................................................#",
    "#.........XXXX...........................XXXX..............#",
    "#.........XXXX...........................XXXX..............#",
    "#..........................................................#",
    "############################################################"
];

const CONFIG = {
    TILE_SIZE: 50,
    CANVAS_W: 1600,
    CANVAS_H: 900,
    AI_SIGHT_RANGE: 600
};

// --- 2. ENTITY CLASS (Player & AI) ---
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
        this.speed = isPlayer ? data.speed : 3.5; 
        
        // State
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
            // AI Logic
            const player = this.game.player;
            const dist = Math.hypot(player.x - this.x, player.y - this.y);
            
            // Can I see the player? (Only if close OR player not in bush)
            const canSee = (dist < CONFIG.AI_SIGHT_RANGE) && (!player.inBush || dist < 100);

            if (canSee) {
                this.targetX = player.x;
                this.targetY = player.y;
                this.patrolTimer = 0;
            } else {
                // Patrol Logic
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
        return Math.hypot(this.targetX - this.x, this.targetY - this.y) < 50;
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
        let screenX = this.x - camX;
        let screenY = this.y - camY;

        // Visual Hiding Logic
        if (this.inBush) {
            if (this.isPlayer) ctx.globalAlpha = 0.5; // Player semi-transparent
            else return; // AI totally invisible in bush
        } else {
            ctx.globalAlpha = 1.0;
        }

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
        
        // Health Bar
        ctx.globalAlpha = 1.0; 
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX, screenY - 15, 40, 5);
        ctx.fillStyle = this.isPlayer ? '#00ff00' : '#ff0000';
        ctx.fillRect(screenX, screenY - 15, (this.hp / this.maxHp) * 40, 5);
    }
}

// --- 3. GAME ENGINE ---
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
        console.log("FIXED VERSION LOADED"); 

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
        this.loadMap(GAME_MAP);
        this.loop();
    }

    loadMap(ascii) {
        this.walls = [];
        this.bushes = [];
        this.entities = [];
        
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

    drawBush(ctx, x, y) {
        ctx.fillStyle = '#2ecc71'; 
        ctx.beginPath();
        ctx.arc(x + 25, y + 25, 30, 0, Math.PI * 2);
        ctx.arc(x + 10, y + 10, 20, 0, Math.PI * 2);
        ctx.arc(x + 40, y + 40, 20, 0, Math.PI * 2);
        ctx.fill();
    }

    loop() {
        if (this.state !== 'GAME') return;

        this.entities.forEach(e => e.update());
        this.updateCamera();

        // Background
        this.ctx.fillStyle = '#212f3c'; 
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Grid
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        const offsetX = -this.camera.x % 50;
        const offsetY = -this.camera.y % 50;
        for (let x = offsetX; x < this.canvas.width; x += 50) { this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.canvas.height); }
        for (let y = offsetY; y < this.canvas.height; y += 50) { this.ctx.moveTo(0, y); this.ctx.lineTo(this.canvas.width, y); }
        this.ctx.stroke();

        // Draw Walls & Boxes
        this.walls.forEach(w => {
            let drawX = w.x - this.camera.x;
            let drawY = w.y - this.camera.y;
            
            if (drawX > -60 && drawX < CONFIG.CANVAS_W && drawY > -60 && drawY < CONFIG.CANVAS_H) {
                if (w.type === 'wall') {
                     // FIX: Used this.ctx instead of ctx
                    this.ctx.fillStyle = '#145a32'; this.ctx.fillRect(drawX, drawY + 20, 50, 30);
                    this.ctx.fillStyle = '#27ae60'; this.ctx.fillRect(drawX, drawY, 50, 45);
                } else if (w.type === 'box') {
                    this.ctx.fillStyle = '#d35400'; this.ctx.fillRect(drawX + 5, drawY + 10, 40, 35);
                    this.ctx.fillStyle = '#e67e22'; this.ctx.fillRect(drawX + 5, drawY + 5, 40, 10);
                }
            }
        });

        // Draw Bushes
        this.bushes.forEach(b => {
            let drawX = b.x - this.camera.x;
            let drawY = b.y - this.camera.y;
            if (drawX > -60 && drawX < CONFIG.CANVAS_W && drawY > -60 && drawY < CONFIG.CANVAS_H) {
                this.drawBush(this.ctx, drawX, drawY);
            }
        });

        // Draw Entities
        this.entities.sort((a, b) => a.y - b.y);
        this.entities.forEach(e => e.draw(this.ctx, this.camera.x, this.camera.y));

        requestAnimationFrame(() => this.loop());
    }
}

const game = new Game();
window.onload = () => game.init();
