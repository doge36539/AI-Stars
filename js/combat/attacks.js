// js/combat/attacks.js

export function performAttack(player, game, mouseX, mouseY) {
    if (!player || !player.data) return;

    const data = player.data;
    const stats = data.atk;

    // 1. CALCULATE ANGLE
    const realMouseX = mouseX + game.camera.x;
    const realMouseY = mouseY + game.camera.y;
    const angle = Math.atan2(realMouseY - (player.y + 20), realMouseX - (player.x + 20));
    
    // Use Name to switch (Upper Case for safety)
    const name = data.name.toUpperCase();

    // 2. DETAILED BRAWLER LOGIC
    switch (name) {
        /* ================= SHOTGUNNERS ================= */
        case 'SHELLY': 
            // Narrower cone, medium range
            spawnPattern(game, player, angle, 5, 0.4, 18, stats.range, stats.dmg, { color: '#e67e22', size: 5 });
            break;
        case 'BULL':
            // Wide cone, short range, heavy damage
            spawnPattern(game, player, angle, 5, 0.5, 18, stats.range, stats.dmg, { color: '#e74c3c', size: 5 });
            break;
        case 'DARRYL':
            // Double Shotgun Burst (2 waves of bullets)
            spawnBurst(game, player, angle, 2, 100, 18, stats.range, stats.dmg, { color: '#7f8c8d', size: 5, isShotgun: true });
            break;

        /* ================= SHARPSHOOTERS (BURST) ================= */
        case 'COLT':
            // Straight line, 6 bullets
            spawnBurst(game, player, angle, 6, 80, 22, stats.range, stats.dmg, { color: '#3498db', size: 4 });
            break;
        case 'RICO':
            // Bouncing bullets
            spawnBurst(game, player, angle, 5, 80, 22, stats.range, stats.dmg, { color: '#9b59b6', size: 5, bounce: true });
            break;
        case '8-BIT':
            // Slightly spread burst, looks like lasers
            spawnBurst(game, player, angle, 6, 90, 20, stats.range, stats.dmg, { color: '#ecf0f1', size: 4 });
            break;

        /* ================= SNIPERS (SINGLE SHOT) ================= */
        case 'PIPER':
            // Gold bullet, gets hotter (Red) further it goes
            spawnPattern(game, player, angle, 1, 0, 32, stats.range, stats.dmg, { color: '#FFD700', size: 6, type: 'piper' });
            break;
        case 'BEA':
            // Big slow bee sting
            spawnPattern(game, player, angle, 1, 0, 20, stats.range, stats.dmg, { color: '#f1c40f', size: 8 });
            break;
        case 'BROCK':
            // Rocket (Explodes on impact)
            spawnPattern(game, player, angle, 1, 0, 20, stats.range, stats.dmg, { color: '#333', size: 10, type: 'rocket' });
            break;

        /* ================= THROWERS (LOBS) ================= */
        case 'DYNAMIKE':
            // Throws 2 sticks slightly apart
            spawnPattern(game, player, angle - 0.1, 1, 0, 14, stats.range, stats.dmg, { color: '#c0392b', size: 6, type: 'lob' });
            spawnPattern(game, player, angle + 0.1, 1, 0, 14, stats.range, stats.dmg, { color: '#c0392b', size: 6, type: 'lob' });
            break;
        case 'BARLEY':
            // Bottle that leaves a puddle
            spawnPattern(game, player, angle, 1, 0, 14, stats.range, stats.dmg, { color: '#8e44ad', size: 7, type: 'lob_puddle' });
            break;
        case 'TICK':
            // Throws 3 mines in a triangle
            spawnPattern(game, player, angle, 3, 0.5, 14, stats.range, stats.dmg, { color: '#7f8c8d', size: 5, type: 'lob_mine' });
            break;

        /* ================= SPREAD / ARC ================= */
        case 'POCO':
            // Wide musical wave
            spawnPattern(game, player, angle, 5, 0.9, 15, stats.range, stats.dmg, { color: '#e67e22', size: 8 });
            break;
        case 'BO':
            // 3 Arrows, slight spread
            spawnPattern(game, player, angle, 3, 0.3, 20, stats.range, stats.dmg, { color: '#e67e22', size: 6 });
            break;
        case 'CROW':
            // 3 Poison Daggers
            spawnPattern(game, player, angle, 3, 0.4, 22, stats.range, stats.dmg, { color: '#2ecc71', size: 5, type: 'poison' });
            break;
        case 'LEON':
            // 4 Shurikens in an arc
            spawnPattern(game, player, angle, 4, 0.5, 24, stats.range, stats.dmg, { color: '#2ecc71', size: 5, type: 'shuriken' });
            break;
        case 'TARA':
            // 3 Cards, pierce enemies
            spawnPattern(game, player, angle, 3, 0.3, 20, stats.range, stats.dmg, { color: '#e91e63', size: 6, pierce: true });
            break;
        case 'SPIKE':
            // Spike ball (Splits logic would go in main.js, simplified here)
            spawnPattern(game, player, angle, 1, 0, 16, stats.range, stats.dmg, { color: '#27ae60', size: 8, type: 'spike' });
            break;
        case 'EMZ':
            // Hairspray cloud (Pierces and lingers)
            spawnPattern(game, player, angle, 3, 0.6, 12, stats.range, stats.dmg, { color: '#9b59b6', size: 10, pierce: true });
            break;

        /* ================= MELEE / SHORT RANGE ================= */
        case 'EL PRIMO':
        case 'ROSA':
            // Fast punch burst
            spawnBurst(game, player, angle, 4, 50, 18, stats.range, stats.dmg, { color: '#3498db', size: 10, pierce: true });
            break;
        case 'NITA':
            // Shockwave (Pierces)
            spawnPattern(game, player, angle, 1, 0, 18, stats.range, stats.dmg, { color: '#2ecc71', size: 20, pierce: true });
            break;
        case 'MORTIS':
            // Dash Attack (Move player)
            spawnPattern(game, player, angle, 1, 0, 20, 100, stats.dmg, { color: '#333', size: 30, pierce: true, visible: false }); // Hitbox only
            player.x += Math.cos(angle) * 150; // Manual Dash
            player.y += Math.sin(angle) * 150;
            break;
        case 'FRANK':
            // Delay then big shockwave
            setTimeout(() => {
                spawnPattern(game, player, angle, 5, 0.8, 18, stats.range, stats.dmg, { color: '#8e44ad', size: 12, pierce: true });
            }, 300); // 0.3s Windup
            break;
        case 'BIBI':
            // Wide swing (delayed)
            setTimeout(() => {
                spawnPattern(game, player, angle, 5, 1.2, 20, stats.range, stats.dmg, { color: '#34495e', size: 10, pierce: true });
            }, 300);
            break;

        default:
            // Fallback
            spawnPattern(game, player, angle, 1, 0, 15, stats.range, stats.dmg, { color: '#fff' });
            break;
    }
}

// --- HELPER FUNCTIONS ---

function spawnPattern(game, p, angle, count, spread, speed, range, dmg, custom) {
    const start = angle - (spread / 2);
    const step = count > 1 ? spread / (count - 1) : 0;
    
    for (let i = 0; i < count; i++) {
        const currentAngle = count === 1 ? angle : start + (step * i);
        
        // Randomize Lob distance slightly for realism
        let finalRange = range;
        if (custom.type && custom.type.includes('lob')) {
            finalRange = range - 50 + Math.random() * 100; 
        }

        game.projectiles.push(new game.ProjectileClass(
            p.x + 20, p.y + 20, currentAngle, speed, finalRange, dmg, p, custom
        ));
    }
}

function spawnBurst(game, p, angle, count, delay, speed, range, dmg, custom) {
    let fired = 0;
    const fireShot = () => {
        if (custom.isShotgun) {
            spawnPattern(game, p, angle, 4, 0.3, speed, range, dmg, custom);
        } else {
            game.projectiles.push(new game.ProjectileClass(
                p.x + 20, p.y + 20, angle, speed, range, dmg, p, custom
            ));
        }
    };
    fireShot();
    fired++;
    const interval = setInterval(() => {
        if (game.state !== 'GAME' || p.hp <= 0) { clearInterval(interval); return; }
        fireShot();
        fired++;
        if (fired >= count) clearInterval(interval);
    }, delay);
}
