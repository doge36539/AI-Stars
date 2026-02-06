// js/combat/supers.js

export function performSuper(player, game, targetX, targetY) {
    const data = player.data;
    const name = data.name.toUpperCase();

    // 1. CALCULATE ANGLE
    const realTargetX = targetX + game.camera.x;
    const realTargetY = targetY + game.camera.y;
    const angle = Math.atan2(realTargetY - (player.y + 20), realTargetX - (player.x + 20));

    console.log(`ACTIVATING SUPER: ${name}`);

    switch (name) {
        /* --- WALL BREAKERS --- */
        case 'SHELLY':
            spawnSuperProjectile(game, player, angle, 9, 0.5, 15, 450, 400, { 
                color: '#e74c3c', size: 8, wallBreaker: true, knockback: 20 
            });
            break;

        case 'COLT':
        case 'RICO': 
            spawnBurstSuper(game, player, angle, 12, 50, 20, 800, 300, {
                color: '#e74c3c', size: 6, wallBreaker: true 
            });
            break;

        /* --- MOVEMENT SUPERS --- */
        case 'BULL':
            // Dash towards mouse
            performDash(game, player, angle, 600, 25);
            break;
        
        case 'EL PRIMO':
            // Jump to mouse cursor
            performJump(game, player, realTargetX, realTargetY, 1600);
            break;

        /* --- SPAWNERS --- */
        case 'NITA':
            spawnMinion(game, player, realTargetX, realTargetY, '🐻', 6000);
            break;

        /* --- LOBS --- */
        case 'DYNAMIKE':
        case 'BARLEY':
            spawnSuperProjectile(game, player, angle, 1, 0, 12, 500, 2000, {
                color: '#e74c3c', size: 25, type: 'lob', wallBreaker: true
            });
            break;

        /* --- SUPPORT --- */
        case 'POCO':
            player.hp = Math.min(player.maxHp, player.hp + 2000);
            spawnSuperProjectile(game, player, angle, 20, 1.5, 15, 600, 0, {
                color: '#2ecc71', size: 10 
            });
            break;

        case 'ROSA':
            player.hp += 3000; // Temporary Shield (HP Buff)
            break;

        default:
            // Fallback
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
    console.log("Bear Spawned! (Visual only for now)");
    // In the future, we can add: new Entity(BEAR_DATA, x, y, ...)
}

function performDash(game, player, angle, distance, speed) {
    let travelled = 0;
    const interval = setInterval(() => {
        // SAFETY CHECK: Stop if game over
        if (game.state !== 'GAME') { clearInterval(interval); return; }

        const dx = Math.cos(angle) * speed;
        const dy = Math.sin(angle) * speed;
        
        // Bypassing collision for the dash sensation
        player.x += dx;
        player.y += dy;
        travelled += speed;

        if (travelled >= distance) clearInterval(interval);
    }, 16);
}

function performJump(game, player, destX, destY, dmg) {
    const originalY = player.y;
    
    // Jump Delay
    setTimeout(() => {
        // SAFETY CHECK: Stop if game over
        if (game.state !== 'GAME') return;

        player.x = destX;
        player.y = destY;
        
        // Landing Explosion
        spawnSuperProjectile(game, player, 0, 8, 6.28, 10, 150, dmg, { color: '#e74c3c', size: 10 });
    }, 500); 
}
