// js/main.js
import { BRAWLERS } from './data/brawler.js'; 

// --- 1. HARDCODED TEST MAP (To rule out maps.js issues) ---
const TEST_MAP = [
    "####################",
    "#..................#",
    "#...P..............#",  // P is where Player starts
    "#.......#..#.......#",
    "#.......#..#.......#",
    "#..................#",
    "####################"
];

// --- 2. THE GAME ENGINE ---
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1600;
        this.canvas.height = 900;
        this.selectedBrawler = null;
        this.keys = {};
        
        // Listen for keys
        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);
    }

    init() {
        console.log("Initializing...");
        
        // Wire the Play Button
        const playBtn = document.getElementById('play-btn');
        if (playBtn) {
            // Remove "disabled" attribute just in case
            playBtn.removeAttribute('disabled'); 
            
            playBtn.onclick = () => {
                alert("LAUNCHING GAME... (Click OK)"); // DEBUG ALERT
                this.startMatch();
            };
        } else {
            alert("FATAL: Could not find 'play-btn' in HTML");
        }

        // Wire Menu Buttons
        const btnSolo = document.getElementById('btn-showdown');
        if (btnSolo) {
            btnSolo.onclick = () => {
                document.getElementById('screen-home').style.display = 'none';
                document.getElementById('screen-select').classList.remove('hidden');
                document.getElementById('screen-select').style.display = 'flex';
                this.renderGrid();
            };
        }
    }

    renderGrid() {
        const grid = document.getElementById('grid');
        grid.innerHTML = '';
        BRAWLERS.forEach(b => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<div style="font-size:30px;">${b.icon}</div><div>${b.name}</div>`;
            card.onclick = () => {
                document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedBrawler = b;
                
                // Light up the button visually
                const btn = document.getElementById('play-btn');
                btn.disabled = false;
                btn.style.opacity = "1";
                btn.style.cursor = "pointer";
            };
            grid.appendChild(card);
        });
    }

    startMatch() {
        // 1. Force Hide Menu
        document.getElementById('screen-select').style.display = 'none';
        
        // 2. Setup Player
        // If no brawler selected, force Shelly just to test
        if (!this.selectedBrawler) this.selectedBrawler = BRAWLERS[0];
        
        this.player = {
            x: 200, y: 200,
            icon: this.selectedBrawler.icon,
            speed: 5
        };

        // 3. Start Loop
        this.loop();
    }

    loop() {
        // Update Logic
        if (this.keys['w']) this.player.y -= this.player.speed;
        if (this.keys['s']) this.player.y += this.player.speed;
        if (this.keys['a']) this.player.x -= this.player.speed;
        if (this.keys['d']) this.player.x += this.player.speed;

        // Draw Logic
        // Background
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, 1600, 900);

        // Map
        this.ctx.fillStyle = '#555';
        for(let r=0; r<TEST_MAP.length; r++) {
            for(let c=0; c<TEST_MAP[r].length; c++) {
                if(TEST_MAP[r][c] === '#') {
                    this.ctx.fillRect(c*50, r*50, 50, 50);
                }
            }
        }

        // Player
        this.ctx.font = "40px Arial";
        this.ctx.fillText(this.player.icon, this.player.x, this.player.y);

        requestAnimationFrame(() => this.loop());
    }
}

const game = new Game();
window.onload = () => game.init();
