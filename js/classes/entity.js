// js/classes/Entity.js
import { Bullet } from './bullet.js';
import { Particle } from './particle.js';

export class Entity {
    constructor(data, x, y, team, isPlayer, GameRef) {
        this.data = data;
        this.x = x;
        this.y = y;
        this.team = team;
        this.isPlayer = isPlayer;
        this.Game = GameRef;

        this.hp = data.hp;
        this.maxHp = data.hp;
        this.ammo = 3;
        this.charge = 0; // Super charge %
        
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        
        this.reloadT = 0;
        this.revealT = 0;   // How long they stay visible in bushes after attacking
        this.noDmgT = 0;    // Time since last damage (for healing)
        
        this.stunned = 0;
        this.slowed = 0;
        this.poisoned = 0;
        this.airTime = 0;   // For Crow/Piper jumps
        this.stopT = 0;     // For Frank's windup
        
        this.aiState = 'ROAM';
        this.aiT = 0;
    }

    // SUB: UPDATE
    update() {
        if (this.stunned > 0) { this.stunned--; return; }
        if (this.stopT > 0) { 
            this.stopT--; 
            if (this.stopT === 0 && this.onAttackFinish) this.onAttackFinish(); 
            return; 
        }

        // Handle Air/Jump Logic
        if (this.airTime > 0) {
            this.airTime--;
            this.x += this.vx;
            this.y += this.vy;
            if (this.airTime === 0) {
                if (this.data.name === 'CROW') this.spawnCrowDaggers();
            }
            return;
        }

        // Passive Healing (starts after 3 seconds of no damage)
        if (this.noDmgT > 180 && this.hp < this.maxHp) {
            this.hp += this.maxHp * 0.005; 
        }
        this.noDmgT++;

        // SUB: RUN AI
        if (!this.isPlayer) this.runSmartAI();

        this.x += this.vx;
        this.y += this.vy;

        // Simple Reload
        if (this.ammo < 3) {
            this.reloadT++;
            if (this.reloadT > this.data.atk.reload) {
                this.ammo++;
                this.reloadT = 0;
            }
        }
    }

    runSmartAI() {
        // AI implementation of Kiting and Retreating
        let target = this.Game.entities.find(e => e.team !== this.team && !e.hidden);
        if (!target) { this.vx = 0; this.vy = 0; return; }

        let dist = Math.hypot(target.x - this.x, target.y - this.y);
        this.angle = Math.atan2(target.y - this.y, target.x - this.x);

        if (this.hp < this.maxHp * 0.3) {
            // RETREAT
            this.vx = -Math.cos(this.angle) * this.data.speed;
            this.vy = -Math.sin(this.angle) * this.data.speed;
        } else if (dist > this.data.atk.range * 0.7) {
            // CHASE
            this.vx = Math.cos(this.angle) * this.data.speed;
            this.vy = Math.sin(this.angle) * this.data.speed;
        } else {
            // KITE/STOP
            this.vx = 0; this.vy = 0;
            if (this.ammo >= 1 && Math.random() < 0.05) this.tryShoot();
        }
    }

    tryShoot() {
        if (this.ammo < 1) return;
        this.ammo--;
        this.revealT = 120;
        
        const bullet = new Bullet(this.x, this.y, this.angle, this.data.atk.dmg, this.data.atk.range, this.data.atk.type, this, this.Game);
        this.Game.bullets.push(bullet);
    }

    takeDamage(amt, src) {
        this.hp -= amt;
        this.noDmgT = 0;
        this.Game.particles.push(new Particle(this.x, this.y - 40, Math.floor(amt), 'white', true));
        if (src && src.charge < 100) src.charge += 20; // 5 hits for super
    }

    draw(ctx) {
        ctx.font = '40px serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.data.icon, this.x, this.y);
        
        // HP Bar
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 20, this.y - 40, 40, 5);
        ctx.fillStyle = this.team === 0 ? '#4cd137' : '#e74c3c';
        ctx.fillRect(this.x - 20, this.y - 40, 40 * (this.hp / this.maxHp), 5);
    }
}
