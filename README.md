<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>AI stars V 0.5</title>
<style>
    /* =========================================================================
       SECTION: CSS STYLES
       ========================================================================= */
    body { margin: 0; overflow: hidden; background: #000; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; user-select: none; }
    
    #game-wrapper {
        position: relative; width: 100vw; height: 56.25vw;
        max-height: 100vh; max-width: 177.78vh;
        background: #151515; box-shadow: 0 0 50px #000;
    }
    canvas { width: 100%; height: 100%; display: block; }
    
    .screen { position: absolute; top:0; left:0; width:100%; height:100%; background:rgba(20,20,30,0.95); display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:20; }
    .hidden { display: none !important; }
    h1 { color: #f1c40f; font-size: 5vw; margin: 0; text-shadow: 4px 4px 0 #000; -webkit-text-stroke: 2px black; }
    
    .btn { background: #3498db; border: 2px solid white; padding: 1vw 3vw; font-size: 1.5vw; color: white; margin: 10px; cursor: pointer; font-weight: bold; }
    .btn-yel { background: #f1c40f; color: black; }
    
    .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1vw; padding: 20px; background: rgba(0,0,0,0.5); }
    .card { width: 6vw; height: 7vw; background: #333; border: 3px solid #555; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; }
    .card.selected { border-color: #f1c40f; background: #444; }
    .emoji { font-size: 3.5vw; }
    
    #hud { position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; display:none; }
    #super-btn { position: absolute; bottom: 8%; right: 8%; width: 10vw; height: 10vw; border-radius: 50%; background: rgba(0,0,0,0.5); border: 4px solid #777; pointer-events: auto; display: flex; align-items: center; justify-content: center; font-size: 2vw; color: #aaa; font-weight: bold; }
    #super-btn.ready { background: radial-gradient(#ffff00, #ff8800); border-color: white; color: black; animation: pulse 1s infinite; cursor: pointer; }
    @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
    
    #ammo-bar { position: absolute; bottom: 18%; right: 22%; width: 12vw; height: 1.5vw; display: flex; gap: 4px; }
    .slot { flex: 1; background: #444; border: 2px solid black; }
    .fill { background: #e67e22; height: 100%; width: 100%; }
    
    #kill-feed { position: absolute; top: 20px; left: 20px; color: white; font-size: 1.2vw; text-shadow: 1px 1px 0 #000; }
    #info { position: absolute; top: 10px; width: 100%; text-align: center; color: white; font-size: 2vw; font-weight: bold; text-shadow: 2px 2px 0 black; }
</style>
</head>
<body>

<div id="game-wrapper">
    <canvas id="gameCanvas"></canvas>
    <div id="hud">
        <div id="info"></div>
        <div id="kill-feed"></div>
        <div id="ammo-bar"><div class="slot"><div class="fill" id="a1"></div></div><div class="slot"><div class="fill" id="a2"></div></div><div class="slot"><div class="fill" id="a3"></div></div></div>
        <div id="super-btn">SUPER</div>
    </div>
    
    <div id="screen-home" class="screen">
        <h1>BRAWL EMOJI</h1>
        <div style="display:flex;">
            <button class="btn btn-yel" onclick="Game.setMode('showdown')">SOLO SHOWDOWN</button>
            <button class="btn" onclick="Game.setMode('knockout')">KNOCKOUT 3v3</button>
        </div>
    </div>

    <div id="screen-select" class="screen hidden">
        <h2>SELECT BRAWLER</h2>
        <div class="grid" id="grid"></div>
        <div id="desc" style="color:#ccc; margin:20px; font-size:1.2vw; min-height:30px;"></div>
        <button class="btn btn-yel" onclick="Game.start()">READY</button>
    </div>

    <div id="screen-result" class="screen hidden">
        <h1 id="result-text">VICTORY!</h1>
        <button class="btn" onclick="Game.goHome()">EXIT</button>
    </div>
</div>

<script>
/* =========================================================================
   SECTION: CONFIGURATION
   ========================================================================= */
const CANVAS_W = 1600;
const CANVAS_H = 900;
const TILE_SIZE = 50;
const BUSH_RANGE = 140;

/* =========================================================================
   SECTION: BRAWLERS
   Edit stats, damage, icons, and descriptions here.
   ========================================================================= */
const BRAWLERS = [
    
    // -------------------------------------------------------------------------
    // SUB: SHELLY
    // -------------------------------------------------------------------------
    { 
      id: 0, icon: '🔫', name: "SHELLY", hp: 7400, speed: 3.0, rarity: 'common',
      atk: { dmg: 600, count: 5, range: 380, spread: 0.5, reload: 60, type: 'cone' }, 
      sup: { dmg: 360, count: 9, range: 450, spread: 0.6, push: 20, break: true, charge: 100, type: 'cone' },
      desc: "Super destroys walls and knocks enemies back." 
    },

    // -------------------------------------------------------------------------
    // SUB: NITA
    // -------------------------------------------------------------------------
    { 
      id: 1, icon: '🐻', name: "NITA", hp: 8000, speed: 3.0, rarity: 'common',
      atk: { dmg: 1920, count: 1, range: 320, width: 60, reload: 45, type: 'pierce' },
      sup: { type: 'spawn', hp: 8000, dmg: 800, charge: 120 },
      desc: "Shockwave pierces. Bear hunts enemies." 
    },

    // -------------------------------------------------------------------------
    // SUB: COLT
    // -------------------------------------------------------------------------
    { 
      id: 2, icon: '🤠', name: "COLT", hp: 5600, speed: 3.0, rarity: 'uncommon',
      atk: { dmg: 540, count: 6, range: 600, spread: 0.05, reload: 50, delay: 5, type: 'line' },
      sup: { dmg: 540, count: 12, range: 750, break: true, charge: 140, type: 'line' },
      desc: "Bursts of bullets. Super breaks walls." 
    },

    // -------------------------------------------------------------------------
    // SUB: BULL
    // -------------------------------------------------------------------------
    { 
      id: 3, icon: '🐂', name: "BULL", hp: 10000, speed: 3.1, rarity: 'uncommon',
      atk: { dmg: 880, count: 5, range: 250, spread: 0.4, reload: 65, type: 'cone' },
      sup: { type: 'charge', dmg: 1600, range: 600, speed: 12, charge: 90, break: true },
      desc: "High HP shotgunner. Super charges through walls." 
    },

    // -------------------------------------------------------------------------
    // SUB: PIPER
    // -------------------------------------------------------------------------
    { 
      id: 4, icon: '☂️', name: "PIPER", hp: 4800, speed: 2.9, rarity: 'epic',
      atk: { dmg: 3400, count: 1, range: 800, reload: 90, type: 'sniper' },
      sup: { type: 'jump', dmg: 1800, range: 400, charge: 130 },
      desc: "Deals more damage at max range. Super escapes." 
    },

    // -------------------------------------------------------------------------
    // SUB: FRANK
    // -------------------------------------------------------------------------
    { 
      id: 5, icon: '🧟', name: "FRANK", hp: 14000, speed: 3.1, rarity: 'epic',
      atk: { dmg: 2480, count: 1, range: 380, width: 80, reload: 45, stop: true, delay: 30, type: 'wave' },
      sup: { dmg: 2480, range: 420, width: 90, stun: 120, stop: true, delay: 45, charge: 100, type: 'wave_super', break:true },
      desc: "Stops to attack. Super stuns and breaks walls." 
    },

    // -------------------------------------------------------------------------
    // SUB: MORTIS
    // -------------------------------------------------------------------------
    { 
      id: 6, icon: '🦇', name: "MORTIS", hp: 7600, speed: 3.6, rarity: 'mythic',
      atk: { dmg: 1880, range: 250, reload: 100, type: 'dash' },
      sup: { type: 'lifesteal', dmg: 1800, range: 500, charge: 120 },
      desc: "Dashes to move. Super heals himself." 
    },

    // -------------------------------------------------------------------------
    // SUB: TARA
    // -------------------------------------------------------------------------
    { 
      id: 7, icon: '🔮', name: "TARA", hp: 6400, speed: 3.0, rarity: 'mythic',
      atk: { dmg: 960, count: 3, range: 480, spread: 0.15, reload: 65, type: 'pierce' },
      sup: { type: 'blackhole', dmg: 1600, range: 250, charge: 140 },
      desc: "Cards pierce enemies. Super pulls them together." 
    },

    // -------------------------------------------------------------------------
    // SUB: SPIKE
    // -------------------------------------------------------------------------
    { 
      id: 8, icon: '🌵', name: "SPIKE", hp: 4800, speed: 2.9, rarity: 'legendary',
      atk: { dmg: 1540, range: 500, reload: 60, type: 'spike' },
      sup: { type: 'slow_field', dmg: 800, range: 350, charge: 110 },
      desc: "Grenade splits into needles. Super slows." 
    },

    // -------------------------------------------------------------------------
    // SUB: CROW
    // -------------------------------------------------------------------------
    { 
      id: 9, icon: '🐦', name: "CROW", hp: 4800, speed: 3.6, rarity: 'legendary',
      atk: { dmg: 640, count: 3, range: 520, spread: 0.3, reload: 50, type: 'poison' },
      sup: { type: 'crow_jump', dmg: 640, range: 450, charge: 150 },
      desc: "Poisons enemies. Super jumps (launches/lands daggers)." 
    }
];

/* =========================================================================
   SECTION: MAPS
   Edit ASCII art to change layout. #=Wall, ~=Bush, .=Ground
   ========================================================================= */

// -------------------------------------------------------------------------
// SUB: SKULL CREEK (Showdown)
// -------------------------------------------------------------------------
const MAP_SKULL = [
"########################################",
"#......................................#",
"#..###..~~~~~..######..~~~~~..###......#",
"#..#~#..~...~..#....#..~...~..#~#......#",
"#..###..~~~~~..#....#..~~~~~..###......#",
"#......................................#",
"#.~~~~~..####............####..~~~~~...#",
"#.~...~..#..#............#..#..~...~...#",
"#.~~~~~..####.....##.....####..~~~~~...#",
"#.................##...................#",
"#...###...........##...........###.....#",
"#...#~#..####.....##.....####..#~#.....#",
"#...###..#..#............#..#..###.....#",
"#........####............####..........#",
"#......................................#",
"#..~~~~~..######..~~..######..~~~~~....#",
"#..~...~..#....#..~~..#....#..~...~....#",
"#..~~~~~..######..~~..######..~~~~~....#",
"#......................................#",
"########################################"
];

// -------------------------------------------------------------------------
// SUB: OUT IN THE OPEN (Knockout)
// -------------------------------------------------------------------------
const MAP_OPEN = [
"########################################",
"#......................................#",
"#..###..........................###....#",
"#..#~#..........................#~#....#",
"#..###..........................###....#",
"#......................................#",
"#.......##..................##.........#",
"#.......##..................##.........#",
"#......................................#",
"#......................................#",
"#......................................#",
"#......................................#",
"#.......##..................##.........#",
"#.......##..................##.........#",
"#......................................#",
"#..###..........................###....#",
"#..#~#..........................#~#....#",
"#..###..........................###....#",
"#......................................#",
"########################################"
];

/* =========================================================================
   SECTION: GAME ENGINE
   Controls inputs, rendering loops, and game states.
   ========================================================================= */
const Game = {
    canvas: null, ctx: null, mode: 'showdown', state: 'MENU',
    entities: [], bullets: [], walls: [], bushes: [], particles: [],
    mapW: 0, mapH: 0, camera: {x:0, y:0},
    keys: {}, mouse: {x:0, y:0, down:false},
    player: null, selected: BRAWLERS[0],

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_W; this.canvas.height = CANVAS_H;
        
        window.onkeydown = e => this.keys[e.key.toLowerCase()] = true;
        window.onkeyup = e => {
            this.keys[e.key.toLowerCase()] = false;
            if(e.code === 'Space') this.triggerSuper();
        };
        this.canvas.onmousemove = e => {
            const r = this.canvas.getBoundingClientRect();
            this.mouse.x = (e.clientX - r.left) * (CANVAS_W/r.width);
            this.mouse.y = (e.clientY - r.top) * (CANVAS_H/r.height);
        };
        this.canvas.onmousedown = () => { this.mouse.down = true; if(this.player) this.player.tryShoot(); };
        this.canvas.onmouseup = () => this.mouse.down = false;
        
        document.getElementById('super-btn').onclick = () => this.triggerSuper();
        
        this.renderGrid();
        requestAnimationFrame(t => this.loop(t));
    },

    setMode(m) { this.mode = m; document.getElementById('screen-home').classList.add('hidden'); document.getElementById('screen-select').classList.remove('hidden'); },
    goHome() { location.reload(); },
    
    renderGrid() {
        const g = document.getElementById('grid');
        BRAWLERS.forEach(b => {
            const d = document.createElement('div');
            d.className = 'card';
            d.innerHTML = `<div class="emoji">${b.icon}</div>`;
            d.onclick = () => {
                document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
                d.classList.add('selected');
                this.selected = b;
                document.getElementById('desc').innerText = b.name + ": " + b.desc;
            };
            g.appendChild(d);
        });
        document.querySelector('.card').click();
    },

    /* -------------------------------------------------------------------------
       SUB: START GAME LOGIC (MODE SPAWNING)
       ------------------------------------------------------------------------- */
    start() {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById('hud').style.display = 'block';
        this.state = 'GAME';
        this.loadMap(this.mode === 'showdown' ? MAP_SKULL : MAP_OPEN);
        
        // Spawn Player
        this.player = new Entity(this.selected, 0, 0, 0, true);
        this.spawn(this.player, 0);
        this.entities.push(this.player);
        
        // Mode: Showdown Spawning
        if(this.mode === 'showdown') {
            document.getElementById('info').innerText = "SOLO SHOWDOWN";
            for(let i=1; i<10; i++) {
                let e = new Entity(BRAWLERS[Math.floor(Math.random()*BRAWLERS.length)], 0, 0, i, false);
                this.spawn(e, i); this.entities.push(e);
            }
        } 
        // Mode: Knockout Spawning
        else {
            document.getElementById('info').innerText = "KNOCKOUT";
            for(let i=0; i<5; i++) {
                let team = i < 2 ? 0 : 1;
                let e = new Entity(BRAWLERS[Math.floor(Math.random()*BRAWLERS.length)], 0, 0, team, false);
                this.spawn(e, team); this.entities.push(e);
            }
        }
    },

    loadMap(m) {
        this.entities=[]; this.bullets=[]; this.walls=[]; this.bushes=[];
        this.mapW = m[0].length * TILE_SIZE; this.mapH = m.length * TILE_SIZE;
        for(let r=0; r<m.length; r++) {
            for(let c=0; c<m[0].length; c++) {
                let x = c*TILE_SIZE, y = r*TILE_SIZE;
                if(m[r][c] === '#') this.walls.push({x,y,w:TILE_SIZE,h:TILE_SIZE,hp:3000});
                if(m[r][c] === '~') this.bushes.push({x,y,w:TILE_SIZE,h:TILE_SIZE});
            }
        }
    },

    spawn(e, id) {
        if(this.mode === 'showdown') {
            let a = (id/10)*Math.PI*2, r = (this.mapW/2)-200;
            e.x = this.mapW/2 + Math.cos(a)*r; e.y = this.mapH/2 + Math.sin(a)*r;
        } else {
            e.x = this.mapW/2 + (Math.random()-0.5)*500;
            e.y = e.team === 0 ? this.mapH-150 : 150;
        }
    },

    /* -------------------------------------------------------------------------
       SUB: MAIN GAME LOOP
       ------------------------------------------------------------------------- */
    loop(t) {
        const dt = 1; 
        if(this.state === 'GAME') {
            // Camera Logic
            if(this.player) {
                this.camera.x += (this.player.x - CANVAS_W/2 - this.camera.x) * 0.1;
                this.camera.y += (this.player.y - CANVAS_H/2 - this.camera.y) * 0.1;
            }
            
            // Bush & Visibility Logic
            this.entities.forEach(e => {
                let inBush = this.bushes.some(b => e.x > b.x && e.x < b.x+b.w && e.y > b.y && e.y < b.y+b.h);
                e.hidden = inBush && e.revealT <= 0 && e.team !== (this.player ? this.player.team : 0) && (!this.player || Math.hypot(e.x-this.player.x, e.y-this.player.y) > BUSH_RANGE);
                if(!inBush && e.revealT <= 0 && e.airTime <= 0) e.hidden = false;
                if(e.revealT > 0) e.revealT--;
            });

            this.entities.forEach(e => e.update());
            this.bullets.forEach(b => b.update());
            this.particles.forEach(p => p.update());
            
            // Cleanup Dead/Destroyed
            this.entities = this.entities.filter(e => e.hp > 0);
            this.bullets = this.bullets.filter(b => b.active);
            this.walls = this.walls.filter(w => w.hp > 0);
            this.particles = this.particles.filter(p => p.life > 0);
            
            // UI Updates
            if(this.player) {
                for(let i=1; i<=3; i++) document.getElementById('a'+i).style.width = Math.min(1, Math.max(0, this.player.ammo - (i-1))) * 100 + '%';
                const sbtn = document.getElementById('super-btn');
                if(this.player.charge >= 100) sbtn.classList.add('ready'); else sbtn.classList.remove('ready');
            }
            
            // Victory Condition Logic
            if(this.mode === 'showdown' && this.entities.length <= 1) this.end(this.player && this.player.hp > 0);
            else {
                let t0 = this.entities.filter(e => e.team === 0).length;
                let t1 = this.entities.filter(e => e.team === 1).length;
                if(t0 === 0 || t1 === 0) this.end(t0 > 0);
            }
            if(this.mode === 'showdown') document.getElementById('info').innerText = "ALIVE: " + this.entities.length;
        }
        
        this.draw();
        requestAnimationFrame(t => this.loop(t));
    },

    draw() {
        this.ctx.fillStyle = '#222'; this.ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Grid
        this.ctx.strokeStyle = '#333'; this.ctx.lineWidth=2;
        for(let x=0; x<=this.mapW; x+=TILE_SIZE) { this.ctx.beginPath(); this.ctx.moveTo(x,0); this.ctx.lineTo(x,this.mapH); this.ctx.stroke(); }
        for(let y=0; y<=this.mapH; y+=TILE_SIZE) { this.ctx.beginPath(); this.ctx.moveTo(0,y); this.ctx.lineTo(this.mapW,y); this.ctx.stroke(); }
        
        this.bushes.forEach(b => { this.ctx.fillStyle='#27ae60'; this.ctx.fillRect(b.x,b.y,b.w+1,b.h+1); });
        this.walls.forEach(w => { 
            this.ctx.fillStyle='#7f8c8d'; this.ctx.fillRect(w.x,w.y,w.w,w.h); 
            this.ctx.fillStyle='#95a5a6'; this.ctx.fillRect(w.x,w.y-10,w.w,10);
        });

        const list = [...this.entities, ...this.bullets, ...this.particles].sort((a,b) => (a.y||0) - (b.y||0));
        list.forEach(o => {
            if(o.hidden) { return; }
            o.draw(this.ctx);
        });
        
        // Aim Guide
        if(this.player && this.player.hp > 0) {
            const mx = this.mouse.x + this.camera.x, my = this.mouse.y + this.camera.y;
            const ang = Math.atan2(my - this.player.y, mx - this.player.x);
            this.ctx.globalAlpha = 0.3; this.ctx.fillStyle = 'white'; this.ctx.strokeStyle = 'white'; this.ctx.lineWidth = 2;
            const r = this.player.data.atk.range;
            this.ctx.beginPath();
            if(this.player.data.atk.type === 'cone' || this.player.data.atk.type === 'wave') {
                this.ctx.moveTo(this.player.x, this.player.y); this.ctx.arc(this.player.x, this.player.y, r, ang-0.4, ang+0.4); this.ctx.fill();
            } else {
                this.ctx.moveTo(this.player.x, this.player.y); this.ctx.lineTo(this.player.x+Math.cos(ang)*r, this.player.y+Math.sin(ang)*r); this.ctx.stroke();
            }
            this.ctx.globalAlpha = 1;
        }

        this.ctx.restore();
    },
    
    end(win) { this.state='MENU'; document.getElementById('screen-result').classList.remove('hidden'); document.getElementById('result-text').innerText = win ? "VICTORY" : "DEFEAT"; document.getElementById('hud').style.display = 'none'; },
    triggerSuper() { if(this.player) this.player.useSuper(); }
};

/* =========================================================================
   SECTION: ENTITY CLASS & AI
   Handles Player/Bot movement, logic, and rendering.
   ========================================================================= */
class Entity {
    constructor(data, x, y, team, isPlayer) {
        this.data = data; this.x = x; this.y = y; this.team = team; this.isPlayer = isPlayer;
        this.hp = data.hp; this.maxHp = data.hp; this.ammo = 3; this.charge = 0;
        this.vx=0; this.vy=0; this.angle=0; this.reloadT=0; this.revealT=0;
        this.stunned=0; this.slowed=0; this.poisoned=0; this.airTime=0;
        this.stopT=0; 
        this.aiState='ROAM'; this.aiT=0;
    }

    update() {
        // Status Effects
        if(this.stunned > 0) { this.stunned--; return; }
        if(this.stopT > 0) { this.stopT--; if(this.stopT===0 && this.onAttackFinish) this.onAttackFinish(); if(this.stopT>0) return; }
        
        // Poison Logic
        if(this.poisoned > 0) {
            this.poisoned--;
            if(this.poisoned % 60 === 0) this.takeDamage(160, null);
        }
        
        // Air Logic (Jumping mechanics)
        if(this.airTime > 0) {
            this.airTime--;
            this.x += this.vx; this.y += this.vy; 
            if(this.airTime === 0) { // On Land
                this.vx = 0; this.vy = 0;
                // SUB: Crow Landing
                if(this.data.name === 'CROW') {
                    for(let i=0; i<14; i++) Game.bullets.push(new Bullet(this.x, this.y, (Math.PI*2/14)*i, 640, 300, 'poison', this));
                }
            }
            return; 
        }

        // Heal Logic
        if(this.noDmgT > 180 && this.hp < this.maxHp) this.hp += this.maxHp*0.005;
        this.noDmgT++;

        let spd = this.data.speed * (this.slowed>0 ? 0.6 : 1);
        if(this.slowed>0) this.slowed--;

        // Player vs AI Movement
        if(this.isPlayer) {
            let dx=0, dy=0;
            if(Game.keys['w']) dy--; if(Game.keys['s']) dy++; if(Game.keys['a']) dx--; if(Game.keys['d']) dx++;
            let l = Math.hypot(dx,dy);
            if(l>0) { this.vx = (dx/l)*spd; this.vy = (dy/l)*spd; } else { this.vx=0; this.vy=0; }
            this.angle = Math.atan2(Game.mouse.y+Game.camera.y - this.y, Game.mouse.x+Game.camera.x - this.x);
        } else {
            this.runAI(spd);
        }

        this.x += this.vx; this.y += this.vy;

        // Wall Collision
        Game.walls.forEach(w => {
            if(this.x > w.x-20 && this.x < w.x+w.w+20 && this.y > w.y-20 && this.y < w.y+w.h+20) {
                let dx = this.x - (w.x+w.w/2), dy = this.y - (w.y+w.h/2);
                if(Math.abs(dx) > Math.abs(dy)) this.x = dx>0 ? w.x+w.w+20 : w.x-20; else this.y = dy>0 ? w.y+w.h+20 : w.y-20;
            }
        });

        // Ammo Reload
        if(this.ammo < 3) { this.reloadT++; if(this.reloadT > this.data.atk.reload) { this.ammo++; this.reloadT=0; } }
    }
    
    /* -------------------------------------------------------------------------
       SUB: AI LOGIC
       ------------------------------------------------------------------------- */
    runAI(spd) {
        this.aiT--;
        let target = Game.entities.find(e => e.team !== this.team && !e.hidden && e.airTime <= 0);
        
        // 1. Determine State
        if(this.hp < this.maxHp*0.4) this.aiState = 'RETREAT';
        else if(target) this.aiState = 'FIGHT';
        else this.aiState = 'ROAM';
        
        // 2. Execute State
        if(this.aiState === 'RETREAT') {
             if(target) {
                 let a = Math.atan2(this.y - target.y, this.x - target.x);
                 this.vx = Math.cos(a)*spd; this.vy = Math.sin(a)*spd;
             }
        } else if(this.aiState === 'FIGHT') {
             let d = Math.hypot(target.x-this.x, target.y-this.y);
             this.angle = Math.atan2(target.y-this.y, target.x-this.x);
             
             if(d > this.data.atk.range*0.8) { this.vx = Math.cos(this.angle)*spd; this.vy = Math.sin(this.angle)*spd; }
             else if(d < this.data.atk.range*0.4 && this.data.name !== 'BULL') { this.vx = -Math.cos(this.angle)*spd; this.vy = -Math.sin(this.angle)*spd; } // Kite
             else { this.vx=0; this.vy=0; }
             
             if(this.ammo >= 1 && Math.random()<0.05) this.tryShoot();
             if(this.charge >= 100 && Math.random()<0.02) this.useSuper();
        } else {
            if(this.aiT <= 0) { this.aiT = 60; this.tempA = Math.random()*6.28; }
            this.vx = Math.cos(this.tempA)*spd*0.5; this.vy = Math.sin(this.tempA)*spd*0.5;
        }
    }

    tryShoot() {
        if(this.ammo < 1) return;
        if(this.data.atk.stop) {
            this.stopT = this.data.atk.delay;
            this.ammo--;
            this.revealT = 120;
            this.onAttackFinish = () => this.fire(this.data.atk, this.angle);
        } else {
            this.ammo--;
            this.revealT = 120;
            this.fire(this.data.atk, this.angle);
        }
    }

    /* -------------------------------------------------------------------------
       SUB: SUPER ABILITY LOGIC
       ------------------------------------------------------------------------- */
    useSuper() {
        if(this.charge < this.data.sup.charge) return;
        this.charge = 0;
        this.revealT = 120;
        Game.particles.push(new Particle(this.x, this.y, "SUPER!", '#ff0', true));

        const sup = this.data.sup;
        
        // Crow Jump
        if(sup.type === 'crow_jump') {
            this.airTime = 90; 
            this.vx = Math.cos(this.angle) * 5; this.vy = Math.sin(this.angle) * 5;
            for(let i=0; i<14; i++) Game.bullets.push(new Bullet(this.x, this.y, (Math.PI*2/14)*i, 640, 300, 'poison', this));
        } 
        // Nita Bear
        else if(sup.type === 'spawn') {
            let b = new Entity(BRAWLERS[1], this.x, this.y, this.team, false);
            b.hp = 8000; b.maxHp=8000; b.data.speed=3.2; b.data.atk={dmg:800, range:60, reload:30, type:'melee'}; b.data.icon='🐻';
            Game.entities.push(b);
        } 
        // Piper Jump
        else if(sup.type === 'jump') {
            this.airTime = 60; this.vx = Math.cos(this.angle)*7; this.vy = Math.sin(this.angle)*7;
            for(let i=0; i<4; i++) Game.bullets.push(new Bullet(this.x, this.y, i*1.5, 1800, 50, 'grenade', this));
        } 
        // Bull Charge
        else if(sup.type === 'charge') {
             this.stopT = 60; this.vx=Math.cos(this.angle)*sup.speed; this.vy=Math.sin(this.angle)*sup.speed;
             this.onAttackFinish = () => { this.vx=0; this.vy=0; }
             Game.bullets.push(new Bullet(this.x, this.y, this.angle, sup.dmg, sup.range, 'body_slam', this));
        } 
        // Logic for Delayed Supers (Frank)
        else if(sup.stop) {
            this.stopT = sup.delay;
            this.onAttackFinish = () => this.fire(sup, this.angle);
        } else {
            this.fire(sup, this.angle);
        }
    }

    fire(stats, angle) {
        if(stats.type === 'dash') {
            this.vx = Math.cos(angle)*15; this.vy = Math.sin(angle)*15; this.stopT = 15;
            Game.bullets.push(new Bullet(this.x, this.y, angle, stats.dmg, stats.range, 'melee', this));
            return;
        }
        
        let cnt = stats.count || 1;
        let spr = stats.spread || 0;
        
        for(let i=0; i<cnt; i++) {
            let a = angle;
            if(cnt > 1) {
               if(stats.type === 'cone' || stats.type === 'wave') a = angle + (Math.random()-0.5)*spr;
               else a = angle - spr/2 + (i * spr/(cnt-1));
            }
            if(stats.type === 'wave' || stats.type === 'wave_super') {
                 for(let w=-0.2; w<=0.2; w+=0.2) {
                     Game.bullets.push(new Bullet(this.x, this.y, a+w, stats.dmg, stats.range, stats.type, this));
                 }
            } else {
                 Game.bullets.push(new Bullet(this.x, this.y, a, stats.dmg, stats.range, stats.type, this));
            }
        }
    }

    takeDamage(amt, src) {
        if(this.airTime > 0) return; 
        this.hp -= amt;
        this.noDmgT = 0;
        this.revealT = 120;
        Game.particles.push(new Particle(this.x, this.y-40, Math.floor(amt), '#fff', true));
        if(src && src.charge < 100) src.charge += src.data.sup.charge/5;
        if(this.hp <= 0 && src) {
             const feed = document.getElementById('kill-feed');
             feed.innerHTML = `<div>${src.data.name} killed ${this.data.name}</div>` + feed.innerHTML;
        }
    }

    draw(ctx) {
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.ellipse(this.x, this.y+(this.airTime>0?60:15), 20, 10, 0, 0, Math.PI*2); ctx.fill();
        
        // Emoji Icon
        let yOff = this.airTime > 0 ? -this.airTime*2 : Math.sin(Date.now()/200)*3;
        ctx.font = '50px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(this.data.icon, this.x, this.y + yOff);
        
        // Health Bar
        if(this.airTime <= 0) {
            ctx.fillStyle = '#111'; ctx.fillRect(this.x-25, this.y-45, 50, 8);
            ctx.fillStyle = this.team === (Game.player?Game.player.team:0) ? '#4cd137' : '#e74c3c';
            ctx.fillRect(this.x-24, this.y-44, 48*(Math.max(0,this.hp)/this.maxHp), 6);
            ctx.font='10px sans-serif'; ctx.fillStyle='#fff'; ctx.fillText(this.data.name, this.x, this.y-55);
        }
        
        if(this.poisoned > 0) { ctx.font='20px serif'; ctx.fillText('☠️', this.x+20, this.y-20); }
    }
}

/* =========================================================================
   SECTION: PROJECTILES (BULLETS)
   Handles hit detection and specialized bullet types.
   ========================================================================= */
class Bullet {
    constructor(x, y, a, dmg, range, type, owner) {
        this.x=x; this.y=y; this.dmg=dmg; this.max=range; this.dist=0; this.type=type; this.owner=owner; this.active=true;
        this.vx = Math.cos(a)*15; this.vy = Math.sin(a)*15;
        if(type === 'sniper') { this.vx *= 1.5; this.vy *= 1.5; }
        if(type === 'melee' || type === 'body_slam') { this.vx=0; this.vy=0; this.max=1; }
    }
    
    update() {
        if(!this.active) return;
        if(this.type !== 'melee') {
            this.x += this.vx; this.y += this.vy;
            this.dist += 15;
        } else this.dist++;
        
        if(this.dist >= this.max) this.active = false;
        
        // Wall Collision
        let hitWall = Game.walls.find(w => this.x > w.x && this.x < w.x+w.w && this.y > w.y && this.y < w.y+w.h);
        if(hitWall) {
            if(this.type === 'cone' || this.type === 'wave' || this.type === 'wave_super' && !this.type.includes('super')) this.active = false;
            if(this.type.includes('break') || this.type === 'body_slam') { hitWall.hp = 0; Game.particles.push(new Particle(hitWall.x+25, hitWall.y+25, "💥", '#fff', true)); }
            if(!this.type.includes('break') && this.type !== 'pierce' && this.type !== 'wave' && this.type !== 'wave_super' && this.type !== 'body_slam') this.active=false;
        }
        
        // Entity Collision
        Game.entities.forEach(e => {
            if(e.team !== this.owner.team && e.airTime <= 0 && Math.hypot(e.x-this.x, e.y-this.y) < 30) {
                if(this.type.includes('wave') && e.invulnFrame === Game.frameCount) return;
                e.invulnFrame = Game.frameCount;

                let d = this.dmg;
                if(this.type === 'sniper') d = this.dmg * (0.4 + 0.6*(this.dist/this.max));
                
                e.takeDamage(d, this.owner);
                
                // Bullet Special Effects
                if(this.type === 'poison') e.poisoned = 240; // 4 ticks
                if(this.type === 'spike') for(let i=0;i<6;i++) Game.bullets.push(new Bullet(this.x,this.y,i,800,150,'needle',this.owner));
                if(this.type === 'wave_super') e.stunned = 120;
                if(this.owner.data.name === 'SHELLY' && this.type.includes('super')) { e.x += this.vx; e.y += this.vy; } // Push
                
                if(!['pierce','wave','wave_super','body_slam'].includes(this.type)) this.active = false;
            }
        });
    }
    
    draw(ctx) {
        if(this.type === 'melee') return;
        ctx.fillStyle = this.owner.team === (Game.player?Game.player.team:0) ? '#00ccff' : '#ff4444';
        if(this.type.includes('super')) ctx.fillStyle = '#ffeb3b';
        if(this.type === 'poison') ctx.fillStyle = '#2ecc71';
        ctx.beginPath(); ctx.arc(this.x, this.y, (this.type.includes('wave')?10:6), 0, Math.PI*2); ctx.fill();
    }
}

/* =========================================================================
   SECTION: VISUAL EFFECTS (PARTICLES)
   ========================================================================= */
class Particle {
    constructor(x,y,t,c,txt) { this.x=x; this.y=y; this.t=t; this.c=c; this.txt=txt; this.life=1; this.vy=-2; }
    update() { this.y+=this.vy; this.life-=0.02; }
    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life);
        if(this.txt) { ctx.fillStyle=this.c; ctx.font='bold 20px sans-serif'; ctx.strokeStyle='black'; ctx.strokeText(this.t,this.x,this.y); ctx.fillText(this.t,this.x,this.y); }
        else { ctx.fillStyle=this.c; ctx.fillRect(this.x,this.y,5,5); }
        ctx.globalAlpha = 1;
    }
}

window.onload = () => Game.init();
</script>
</body>
</html>
