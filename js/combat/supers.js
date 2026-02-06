// js/combat/supers.js

export function performSuper(player, game, targetX, targetY) {
    const data = player.data;
    const sup = data.sup;
    const name = data.name.toUpperCase();

    // 1. CALCULATE ANGLE
    const realTargetX = targetX + game.camera.x;
    const realTargetY = targetY + game.camera.y;
    const angle = Math.atan2(realTargetY - (player.y + 20), realTargetX - (player.x + 20));

    console.log(`ACTIVATING SUPER: ${name}`);

    switch (name) {
        /* --- WALL BREAKERS (Shelly, Colt, etc) --- */
        case 'SHELLY':
            // Super Shell: 9 bullets, breaks walls, pushes back
            spawnSuperProjectile(game, player, angle, 9, 0.5, 15, 450, 400, { 
                color: '#e74c3c', size: 8, wallBreaker: true, knockback: 20 
            });
            break;

        case 'COLT':
        case 'RICO': // Rico's super bounces, but for now we treat it like a mega blast
            // Bullet Storm: Fast, long range, breaks walls
            spawnBurstSuper(game, player, angle, 12, 50, 20, 800, 300, {
                color: '#e74c3c', size: 6, wallBreaker: true 
            });
            break;

        case 'BULL':
            // Bulldozer: For now, we simulate this as a fast Dash
            performDash(player, angle, 600, 25);
            break;
        
        case 'EL PRIMO':
            // Meteor Jump: Teleport to target + damage area
            performJump(game, player, realTargetX, realTargetY, 1600);
            break;

        /* --- SPAWNERS --- */
        case 'NITA':
            // Spawn Bear at cursor
            spawnMinion(game, player, realTargetX, realTargetY, '🐻', 6000);
            break;

        /* --- LOBS / BOMBS --- */
        case 'DYNAMIKE':
            // Big Bomb
            spawnSuperProjectile(game, player, angle, 1, 0, 12, 500, 2000, {
                color: '#e74c3c', size: 25, type: 'lob', wallBreaker: true
            });
            break;

        /* --- SUPPORT --- */
        case 'POCO':
            // Heal Wave (Heals self for now)
            player.hp = Math.min(player.maxHp, player.hp + 2000);
            spawnSuperProjectile(game, player, angle, 20, 1.5, 15, 600, 0, {
                color: '#2ecc71', size: 10 // Green visual wave
            });
            break;

        case 'ROSA':
            // Shield (Just give temporary HP for now)
            player.hp += 3000;
            break;

        default:
            // Generic Super Fireball
            spawnSuperProjectile(game, player, angle, 1, 0, 15, 600, 1000, {
                color: '#ff0000', size: 15, wallBreaker: true
            });
            break;
    }
}

// --- HELPER FUNCTIONS ---

function spawnSuperProjectile(game, p, angle, count, spread, speed, range, dmg, custom) {
    const start = angle - (spread / 2);
    const step = count > 1 ? spread / (count - 1) : 0;
    
    for (let i = 0; i < count; i++) {
        const currentAngle = count === 1 ? angle : start + (step * i);
        game.projectiles.push(new game.ProjectileClass(
            p.x + 20, p.y + 20, currentAngle, speed, range, dmg, p, custom
        ));
    }
}

function spawnBurstSuper(game, p, angle, count, delay, speed, range, dmg, custom) {
    let fired = 0;
    const interval = setInterval(() => {
        if (game.state !== 'GAME') { clearInterval(interval); return; }
        
        game.projectiles.push(new game.ProjectileClass(
            p.x + 20, p.y + 20, angle, speed, range, dmg, p, custom
        ));
        fired++;
        if (fired >= count) clearInterval(interval);
    }, delay);
}

function spawnMinion(game, owner, x, y, icon, hp) {
    // Create a dummy entity for the bear
    // In a real engine, we'd need a separate 'Minion' class, but we can hack Entity
    // We import Entity from main.js implicitly by creating it on the fly if needed
    // For now, let's just log it or spawn a stationary turret
    // To do this properly requires updating main.js to allow adding entities dynamically
    console.log("Bear Spawned! (Visual only for now)");
}

function performDash(player, angle, distance, speed) {
    // Simple dash logic: Force move player
    let travelled = 0;
    const interval = setInterval(() => {
        const dx = Math.cos(angle) * speed;
        const dy = Math.sin(angle) * speed;
        
        // We bypass collision for "Charge" supers usually
        player.x += dx;
        player.y += dy;
        travelled += speed;

        if (travelled >= distance) clearInterval(interval);
    }, 16);
}

function performJump(game, player, destX, destY, dmg) {
    // 1. "Hide" player (jump up)
    const originalY = player.y;
    
    // 2. Teleport after delay
    setTimeout(() => {
        player.x = destX;
        player.y = destY;
        
        // Impact Damage
        spawnSuperProjectile(game, player, 0, 8, 6.28, 10, 100, dmg, { color: '#e74c3c', size: 10 });
    }, 500); // 0.5s air time
}
