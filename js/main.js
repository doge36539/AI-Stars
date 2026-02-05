// js/main.js
import { performAttack } from './combat/attacks.js';
import { BRAWLERS } from './data/brawler.js'; 
import { MAP_SKULL_CREEK, MAP_OUT_OPEN } from './data/maps.js';

// ADD 'export' HERE:
export const CONFIG = {
    TILE_SIZE: 50,
    CANVAS_W: 1600,
    CANVAS_H: 900,
    AI_SIGHT_RANGE: 600
};
// 2. ASSET PATHS (Make sure these images exist or it uses squares)
const ASSETS = {
    'wall': 'images/wall.png',
    'bush': 'images/bush.png',
    'box':  'images/box.png',
    'water': 'images/water.png'
};
const IMAGES = {};

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
            const canSee = (dist < CONFIG.AI_SIGHT_RANGE) && (!player.inBush || dist < 100);

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
        if (!this.checkCollision(this.x + dx, this.y)) this.x += dx;
        if (!this.checkCollision(this.x, this.y + dy)) this.y += dy;
    }

    checkCollision(newX, newY) {
        for (let w of this.game.walls) {
            if (newX < w.x + w.w && newX + this.w > w.x &&
                newY < w.y + w.h && newY + this.h > w.y) {
                return true; // Hit Wall OR Water
            }
        }
        return false;
    }

    draw(ctx, camX, camY) {
        let screenX = this.x - camX;
        let screenY = this.y - camY;

        if (this.inBush) {
            if (this.isPlayer) ctx.globalAlpha = 0.5;
            else return; 
        } else {
            ctx.globalAlpha = 1.0;
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(screenX + 20, screenY + 40, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Icon/Image
        let charName = this.data.name.toLowerCase(); 
        let img = IMAGES[charName] || IMAGES['shelly']; 

        if (img) {
            ctx.drawImage(img, screenX, screenY, 40, 40);
        } else {
            ctx.fillStyle = '#fff'; 
            ctx.font = '40px serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.data.icon, screenX + 20, screenY + 35);
        }
        
        // Health Bar
        ctx.globalAlpha = 1.0; 
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX, screenY - 15, 40, 5);
        ctx.fillStyle = this.isPlayer ? '#00ff00' : '#ff0000';
        ctx.fillRect(screenX, screenY - 15, (this.hp / this.maxHp) * 40, 5);
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
        
        // --- NEW COMBAT VARIABLES (Add these!) ---
        this.projectiles = []; 
        this.mouseX = 0;
        this.mouseY = 0;
        
        // KEYBOARD LISTENERS
        window.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);

        // --- NEW MOUSE LISTENERS (Add these!) ---
        // 1. Track Mouse Position
        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        // 2. Detect Click to Shoot
        window.addEventListener('mousedown', () => {
            if (this.state === 'GAME' && this.player) {
                // Ensure you imported performAttack at the top of the file!
                performAttack(this.player, this, this.mouseX, this.mouseY);
            }
        });
    }

    init() {
        console.log("ENGINE LINKED TO MAPS.JS");
        this.loadAssets().then(() => {
            this.setupMenu();
        });
    }
    checkWallCollision(x, y) {
        for (let w of this.walls) {
            // Check if x,y is inside a wall box
            if (x > w.x && x < w.x + w.w && y > w.y && y < w.y + w.h) {
                return true;
            }
        }
        return false;
    }

    loop() {
        if (this.state !== 'GAME') return;

        // 1. UPDATE
        this.entities.forEach(e => e.update());
        this.updateCamera();

        // Update Bullets
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            p.update();
            if (!p.active) this.projectiles.splice(i, 1);
        }

        // 2. CLEAR & DRAW MAP
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw Walls
        this.walls.forEach(w => {
            let drawX = w.x - this.camera.x;
            let drawY = w.y - this.camera.y;
            if (drawX > -60 && drawX < CONFIG.CANVAS_W && drawY > -60 && drawY < CONFIG.CANVAS_H) {
                if (w.type === 'wall') {
                    if(IMAGES['wall']) this.ctx.drawImage(IMAGES['wall'], drawX, drawY, 50, 50);
                    else this.drawWall(drawX, drawY);
                } else if (w.type === 'box') {
                    if(IMAGES['box']) this.ctx.drawImage(IMAGES['box'], drawX, drawY, 50, 50);
                    else {
                        this.ctx.fillStyle = '#d35400'; this.ctx.fillRect(drawX+5, drawY+10, 40, 35);
                        this.ctx.fillStyle = '#e67e22'; this.ctx.fillRect(drawX+5, drawY+5, 40, 10);
                    }
                } else if (w.type === 'water') this.drawWater(drawX, drawY);
            }
        });

        // Draw Bushes
        this.bushes.forEach(b => {
            let drawX = b.x - this.camera.x;
            let drawY = b.y - this.camera.y;
            if (drawX > -60 && drawX < CONFIG.CANVAS_W && drawY > -60 && drawY < CONFIG.CANVAS_H) {
                if(IMAGES['bush']) this.ctx.drawImage(IMAGES['bush'], drawX, drawY, 50, 50);
                else this.drawBush(drawX, drawY);
            }
        });

        // 3. DRAW ENTITIES & BULLETS
        this.entities.sort((a, b) => a.y - b.y);
        this.entities.forEach(e => e.draw(this.ctx, this.camera.x, this.camera.y));
        this.projectiles.forEach(p => p.draw(this.ctx, this.camera.x, this.camera.y));

        // 4. 
        if (this.player) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.player.x + 20 - this.camera.x, this.player.y + 20 - this.camera.y);
            this.ctx.lineTo(this.mouseX, this.mouseY);
            this.ctx.stroke();
        }

        requestAnimationFrame(() => this.loop());
    }

    loadAssets() {
        return new Promise((resolve) => {
            let loadedCount = 0;
            const total = Object.keys(ASSETS).length;
            if (total === 0) resolve();

            for (let key in ASSETS) {
                const img = new Image();
                img.src = ASSETS[key];
                img.onload = () => { IMAGES[key] = img; loadedCount++; if (loadedCount === total) resolve(); };
                img.onerror = () => { loadedCount++; if (loadedCount === total) resolve(); };
            }
        });
    }

setupMenu() {
        this.state = 'MENU';
        
        // 1. Find the buttons in your HTML
        const btnSolo = document.getElementById('btn-showdown'); // The Skull Creek button
        const btnKnock = document.getElementById('btn-knockout'); // The Out in Open button

        // 2. Tell the Solo button what to do
        if (btnSolo) {
            btnSolo.onclick = () => {
                console.log("Solo button clicked!"); // Check your console for this!
                this.openMenu('showdown');
            };
        }

        // 3. Tell the Knockout button what to do
        if (btnKnock) {
            btnKnock.onclick = () => {
                console.log("Knockout button clicked!");
                this.openMenu('knockout');
            };
        }
    }

    openMenu(mode) {
        this.mode = mode;
        
        // 1. Hide the Home Screen
        const home = document.getElementById('screen-home');
        if (home) home.style.display = 'none';

        // 2. Show the Selection Screen
        const select = document.getElementById('screen-select');
        if (select) {
            select.classList.remove('hidden'); // Remove the hidden class
            select.style.display = 'flex';     // Force it to show as flex
        }

        // 3. Load the Brawlers into the grid
        this.renderGrid();
    }
 renderGrid() {
        const grid = document.getElementById('grid');
        grid.innerHTML = ''; 

        // --- SCROLLBAR SETTINGS ---
        // This forces the grid to stay inside the box and scroll if needed
        grid.style.maxHeight = '500px';  // Stop it from getting taller than 500px
        grid.style.overflowY = 'auto';   // Add a vertical scrollbar
        grid.style.display = 'flex';     // Ensure cards sit next to each other
        grid.style.flexWrap = 'wrap';    // Wrap to next line
        grid.style.justifyContent = 'center';

        BRAWLERS.forEach(b => {
            const card = document.createElement('div');
            card.className = 'card';
            
            // Handle Images or Emojis
            // We use the ID if it exists, otherwise the Name
            let charID = (b.id !== undefined) ? b.id : b.name.toLowerCase();
            let imgHTML = IMAGES[charID] 
                ? `<img src="${ASSETS[charID]}" style="width:50px;">` 
                : `<div style="font-size:40px;">${b.icon}</div>`;

            card.innerHTML = `${imgHTML}<div>${b.name}</div>`;
            
            card.onclick = () => {
                document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedBrawler = b;
                
                const descLabel = document.getElementById('brawler-desc');
                if(descLabel) descLabel.innerText = b.desc;
                
                // Enable Play Button
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

        // Choose map based on the mode selected in the menu
        if (this.mode === 'knockout') {
            console.log("Loading: Out in the Open");
            this.loadMap(MAP_OUT_OPEN);
        } else {
            console.log("Loading: Skull Creek");
            this.loadMap(MAP_SKULL_CREEK);
        }

        this.loop();
    }

    loadMap(originalAscii) {
        this.walls = [];
        this.bushes = [];
        this.entities = [];
        
        if (!originalAscii) return;

        // 1. ADD BORDERS (The 'Z' Walls)
        const mapW = originalAscii[0].length;
        const borderRow = "Z".repeat(mapW + 2); 
        
        let ascii = [];
        ascii.push(borderRow); // Top Border
        for(let row of originalAscii) {
            ascii.push("Z" + row + "Z"); // Side Borders
        }
        ascii.push(borderRow); // Bottom Border

        // 2. SAVE THE NEW SIZE
        this.mapWidth = ascii[0].length * CONFIG.TILE_SIZE;
        this.mapHeight = ascii.length * CONFIG.TILE_SIZE;

        // 3. GENERATE TILES
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
        
        // 4. SPAWN ENEMIES (Now inside the function where it belongs!)
        for(let i=0; i<3; i++) {
            let enemy = new Entity(BRAWLERS[0], this.mapWidth - 300, 300 + (i*200), false, this);
            this.entities.push(enemy);
        }
    } // This closes loadMap

    updateCamera() {
        if (!this.player || !this.mapWidth) return;
        let targetX = this.player.x - (CONFIG.CANVAS_W / 2);
        let targetY = this.player.y - (CONFIG.CANVAS_H / 2);
        const maxCamX = this.mapWidth - CONFIG.CANVAS_W;
        const maxCamY = this.mapHeight - CONFIG.CANVAS_H;
        this.camera.x = Math.max(0, Math.min(targetX, maxCamX));
        this.camera.y = Math.max(0, Math.min(targetY, maxCamY));
    }

    drawWall(x, y) {
        this.ctx.fillStyle = '#a04000'; 
        this.ctx.fillRect(x, y + 20, 50, 30);
        this.ctx.fillStyle = '#e67e22'; 
        this.ctx.fillRect(x, y, 50, 45); 
        this.ctx.fillStyle = '#f39c12';
        this.ctx.fillRect(x, y, 50, 5);
    }

    drawWater(x, y) {
        this.ctx.fillStyle = '#2980b9';
        this.ctx.fillRect(x, y, 50, 50);
    }

    drawBush(x, y) {
        this.ctx.fillStyle = '#2ecc71'; 
        this.ctx.beginPath();
        this.ctx.arc(x + 25, y + 25, 30, 0, Math.PI * 2);
        this.ctx.fill();
    }

    loop() {
        if (this.state !== 'GAME') return;

        this.entities.forEach(e => e.update());
        this.updateCamera();

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            p.update();
            if (!p.active) this.projectiles.splice(i, 1);
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.walls.forEach(w => {
            let drawX = w.x - this.camera.x;
            let drawY = w.y - this.camera.y;
            if (drawX > -60 && drawX < CONFIG.CANVAS_W && drawY > -60 && drawY < CONFIG.CANVAS_H) {
                if (w.type === 'wall') this.drawWall(drawX, drawY);
                else if (w.type === 'box') {
                    this.ctx.fillStyle = '#d35400'; this.ctx.fillRect(drawX + 5, drawY + 10, 40, 35);
                }
                else if (w.type === 'water') this.drawWater(drawX, drawY);
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

        if (this.player) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.player.x + 20 - this.camera.x, this.player.y + 20 - this.camera.y);
            this.ctx.lineTo(this.mouseX, this.mouseY);
            this.ctx.stroke();
        }

        requestAnimationFrame(() => this.loop());
    }
} // <--- This closes the Game class

const game = new Game();
window.onload = () => game.init();
