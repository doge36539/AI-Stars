// js/combat/attacks.js

export function performAttack(player, game, mouseX, mouseY) {
    // 0. SAFETY CHECKS
    if (!player || !player.data) return;
    if (game.state !== 'GAME') return;

    const now = Date.now();
    const data = player.data;
    const stats = data.atk;

    // 1. RELOAD LOGIC
    // (reload is in frames/ticks, multiply by 10 for ms)
    if (player.lastShot && now - player.lastShot < (stats.reload * 10)) return;
    player.lastShot = now;

    // 2. CALCULATE ANGLE
    const realMouseX = mouseX + game.camera.x;
    const realMouseY = mouseY + game.camera.y;
    // +20 centers the shot on the player sprite
    const angle = Math.atan2(realMouseY - (player.y + 20), realMouseX - (player.x + 20));
    const name = data.name.toUpperCase();

    // 3. ATTACK LOGIC
    switch (name) {
        /* --- SHOTGUNS --- */
        case 'SHELLY':
            spawnPattern(game, player, angle, stats.count, stats.spread, 12, stats.range, stats.dmg, { color: '#e67e22', size: 4 });
            break;
        case 'BULL':
            spawnPattern(game, player, angle, stats.count, stats.spread, 14, stats.range, stats.dmg, { color: '#95a5a6', size: 3 });
            break;
        case 'DARRYL':
            spawnBurst(game, player, angle, 2, 150, 13, stats.range, stats.dmg, { color: '#7f8c8d', size: 3, isShotgun: true });
            break;

        /* --- SNIPERS --- */
        case 'COLT':
            spawnBurst(game, player, angle, stats.count, 100, 18, stats.range, stats.dmg, { color: '#ffffff', size: 3 });
            break;
        case 'RICO':
            spawnBurst(game, player, angle, stats.count, 90, 18, stats.range, stats.dmg, { color: '#00ccff', size: 4, bounce: true });
            break;
        case 'PIPER':
        case 'BEA':
            spawnPattern(game, player, angle, 1, 0, 24, stats.range, stats.dmg, { color: '#5dade2', size: 3 });
            break;
        case 'BROCK':
            spawnPattern(game, player, angle, 1, 0, 11, stats.range, stats.dmg, { color: '#e67e22', size: 10, type: 'rocket' });
            break;
        case '8-BIT':
            spawnBurst(game, player, angle, stats.count, 80, 17, stats.range, stats.dmg, { color: '#ecf0f1', size: 3 });
            break;

        /* --- AREA / SPECIALS --- */
        case 'POCO':
            spawnPattern(game, player, angle, 5, 0.8, 10, stats.range, stats.dmg, { color: '#9b59b6', size: 12, isRect: true });
            break;
        case 'EL PRIMO':
        case 'ROSA':
            spawnPattern(game, player, angle, stats.count, 0.5, 15, stats.range, stats.dmg, { color: '#3498db', size: 8 });
            break;
        case 'BARLEY':
        case 'DYNAMIKE':
            spawnPattern(game, player, angle, 1, 0, 10, stats.range, stats.dmg, { color: '#f1c40f', size: 7, type: 'lob' });
            break;

        default:
            // Fallback for anyone else
            spawnPattern(game, player, angle, 1, 0, 12, stats.range || 500, stats.dmg || 100, { color: '#fff' });
            break;
    }
}

// --- HELPERS ---

function spawnPattern(game, p, angle, count, spread, speed, range, dmg, custom) {
    const start = angle - (spread / 2);
    const step = count > 1 ? spread / (count - 1) : 0;
    
    for (let i = 0; i < count; i++) {
        game.projectiles.push(new game.ProjectileClass(
            p.x + 20, p.y + 20, 
            start + (step * i), 
            speed, range, dmg, p, custom
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

    fireShot(); // First shot immediately
    fired++;

    const interval = setInterval(() => {
        if (game.state !== 'GAME' || p.dead) {
            clearInterval(interval);
            return;
        }
        fireShot();
        fired++;
        if (fired >= count) clearInterval(interval);
    }, delay);
}
