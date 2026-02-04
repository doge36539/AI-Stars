// js/classes/game.js
import { Entity } from './entity.js';
import { CONFIG } from '../main.js';

export class Game {
    constructor(brawlersData, mapData) {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.brawlersData = brawlersData;
        this.mapData = mapData;

        this.entities = [];
        this.bullets = [];
        this.particles = [];
        this.walls = [];
        this.bushes = [];
        
        this.state = 'MENU';
        this.mode = 'showdown';
        this.camera = { x: 0, y: 0 };
        this.frameCount = 0;
    }

    // SUB: INIT
    init() {
        this.setupEventListeners();
        // Trigger the menu grid rendering
        this.renderMenuGrid();
    }

    // SUB: START GAME LOGIC
    start(selectedBrawler) {
        this.state = 'GAME';
        this.entities = [];
        this.bullets = [];
        this.walls = [];
        this.bushes = [];

        const currentMap = this.mode === 'showdown' ? this.mapData.showdown : this.mapData.knockout;
        this.loadMap(currentMap);

        // Spawn Player
        const player = new Entity(selectedBrawler, 0, 0, 0, true, this);
        this.spawnEntity(player, 0);
        this.entities.push(player);
        this.player = player;

        // Spawn Bots based on mode
        this.spawnBots();
    }

    loadMap(asciiMap) {
        this.mapW = asciiMap[0].length * CONFIG.TILE_SIZE;
        this.mapH = asciiMap.length * CONFIG.TILE_SIZE;

        for (let r = 0; r < asciiMap.length; r++) {
            for (let c = 0; c < asciiMap[0].length; c++) {
                let x = c * CONFIG.TILE_SIZE;
                let y = r * CONFIG.TILE_SIZE;
                if (asciiMap[r][c] === '#') this.walls.push({ x, y, w: CONFIG.TILE_SIZE, h: CONFIG.TILE_SIZE, hp: 3000 });
                if (asciiMap[r][c] === '~') this.bushes.push({ x, y, w: CONFIG.TILE_SIZE, h: CONFIG.TILE_SIZE });
            }
        }
    }

    spawnEntity(ent, id) {
        if (this.mode === 'showdown') {
            let a = (id / 10) * Math.PI * 2, r = (this.mapW / 2) - 200;
            ent.x = this.mapW / 2 + Math.cos(a) * r;
            ent.y = this.mapH / 2 + Math.sin(a) * r;
        } else {
            ent.x = this.mapW / 2 + (Math.random() - 0.5) * 500;
            ent.y = ent.team === 0 ? this.mapH - 150 : 150;
        }
    }

    spawnBots() {
        const count = this.mode === 'showdown' ? 9 : 5;
        for (let i = 1; i <= count; i++) {
            let team = this.mode === 'showdown' ? i : (i < 3 ? 0 : 1);
            let randomBrawler = this.brawlersData[Math.floor(Math.random() * this.brawlersData.length)];
            let bot = new Entity(randomBrawler, 0, 0, team, false, this);
            this.spawnEntity(bot, i);
            this.entities.push(bot);
        }
    }

    // SUB: MAIN GAME LOOP
    update() {
        if (this.state !== 'GAME') return;
        this.frameCount++;

        // Camera following player
        this.camera.x += (this.player.x - this.canvas.width / 2 - this.camera.x) * 0.1;
        this.camera.y += (this.player.y - this.canvas.height / 2 - this.camera.y) * 0.1;

        this.entities.forEach(e => e.update());
        this.bullets.forEach(b => b.update());
        this.particles.forEach(p => p.update());

        // Cleanup
        this.entities = this.entities.filter(e => e.hp > 0);
        this.bullets = this.bullets.filter(b => b.active);
        this.particles = this.particles.filter(p => p.life > 0);
        this.walls = this.walls.filter(w => w.hp > 0);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Draw Map Elements
        this.bushes.forEach(b => { this.ctx.fillStyle = '#27ae60'; this.ctx.fillRect(b.x, b.y, b.w + 1, b.h + 1); });
        this.walls.forEach(w => { this.ctx.fillStyle = '#7f8c8d'; this.ctx.fillRect(w.x, w.y, w.w, w.h); });

        // Draw entities and bullets
        this.entities.forEach(e => e.draw(this.ctx));
        this.bullets.forEach(b => b.draw(this.ctx, this.player.team));
        this.particles.forEach(p => p.draw(this.ctx));

        this.ctx.restore();
    }

    setupEventListeners() {
        // Implementation of key/mouse listeners
    }

    renderMenuGrid() {
        // Logic to build the brawler select screen
    }
}
