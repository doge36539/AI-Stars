// js/classes/Bullet.js

export class Bullet {
    constructor(x, y, a, dmg, range, type, owner, GameReference) {
        this.x = x; 
        this.y = y; 
        this.dmg = dmg; 
        this.max = range; 
        this.dist = 0; 
        this.type = type; 
        this.owner = owner; 
        this.active = true;
        this.Game = GameReference; // Reference to the main game object

        // Bullet Speed Logic
        this.speed = 15;
        if (type === 'sniper') this.speed = 22;
        if (type === 'melee' || type === 'body_slam') {
            this.speed = 0;
            this.max = 1; // Instant hit
        }

        this.vx = Math.cos(a) * this.speed;
        this.vy = Math.sin(a) * this.speed;
    }
    
    update() {
        if (!this.active) return;

        if (this.type !== 'melee') {
            this.x += this.vx;
            this.y += this.vy;
            this.dist += this.speed;
        } else {
            this.dist++;
        }
        
        if (this.dist >= this.max) this.active = false;
        
        // --- Wall Collision ---
        let hitWall = this.Game.walls.find(w => 
            this.x > w.x && this.x < w.x + w.w && 
            this.y > w.y && this.y < w.y + w.h
        );

        if (hitWall) {
            // Supers and Bull charge break walls
            if (this.type.includes('break') || this.type === 'body_slam') {
                hitWall.hp = 0; 
                // We'll trigger particles here later
            }
            
            // Pierce/Wave go through walls, normal bullets disappear
            if (!['pierce', 'wave', 'wave_super', 'body_slam'].includes(this.type)) {
                this.active = false;
            }
        }
        
        // --- Entity Collision ---
        this.Game.entities.forEach(e => {
            if (e.team !== this.owner.team && e.airTime <= 0 && Math.hypot(e.x - this.x, e.y - this.y) < 30) {
                
                // Prevent multi-hits on the same frame (important for Frank/Wave)
                if (this.type.includes('wave') && e.invulnFrame === this.Game.frameCount) return;
                e.invulnFrame = this.Game.frameCount;

                let finalDmg = this.dmg;
                // Piper damage scaling (farther = more damage)
                if (this.type === 'sniper') {
                    finalDmg = this.dmg * (0.4 + 0.6 * (this.dist / this.max));
                }
                
                e.takeDamage(finalDmg, this.owner);
                
                // --- Special Effects ---
                if (this.type === 'poison') e.poisoned = 240; 
                
                if (this.type === 'spike') {
                    // Spike split logic: Create 6 small needles
                    for (let i = 0; i < 6; i++) {
                        this.Game.bullets.push(new Bullet(this.x, this.y, (Math.PI*2/6)*i, 800, 150, 'needle', this.owner, this.Game));
                    }
                }

                if (this.type === 'wave_super') e.stunned = 120; // Frank Stun
                
                if (this.owner.data.name === 'SHELLY' && this.type.includes('super')) { 
                    // Knockback
                    e.x += this.vx * 0.5; 
                    e.y += this.vy * 0.5; 
                }
                
                // If it doesn't pierce, destroy the bullet
                if (!['pierce', 'wave', 'wave_super', 'body_slam'].includes(this.type)) {
                    this.active = false;
                }
            }
        });
    }
    
    draw(ctx, playerTeam) {
        if (this.type === 'melee') return; // Melee is an invisible hitbox

        // Blue for allies, Red for enemies, Yellow for supers
        ctx.fillStyle = (this.owner.team === playerTeam) ? '#00ccff' : '#ff4444';
        if (this.type.includes('super')) ctx.fillStyle = '#ffeb3b';
        if (this.type === 'poison') ctx.fillStyle = '#2ecc71';
        
        ctx.beginPath(); 
        ctx.arc(this.x, this.y, (this.type.includes('wave') ? 10 : 6), 0, Math.PI * 2); 
        ctx.fill();
    }
}
