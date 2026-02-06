// js/combat/attacks.js

export function performAttack(player, game, mouseX, mouseY) {
    if (!player || !player.data) return;

    const data = player.data;
    const stats = data.atk;

    // 1. CALCULATE ANGLE
    const realMouseX = mouseX + game.camera.x;
    const realMouseY = mouseY + game.camera.y;
    
    const angle = Math.atan2(realMouseY - (player.y + 20), realMouseX - (player.x + 20));
    const name = data.name.toUpperCase();

    // 2. ATTACK LOGIC
    switch (name) {
        /* --- SHOTGUNS --- */
        case 'SHELLY':
            spawnPattern(game, player, angle, stats.count, stats.spread, 12, stats.range, stats.dmg, { color: '#e67e22', size: 5 });
            break;
        case 'BULL':
            spawnPattern(game, player, angle, stats.count, stats.spread, 14, stats.range, stats.dmg, { color: '#e74c3c', size: 4 });
            break;
        case 'DARRYL':
            spawnBurst(game, player, angle, 2, 100, 13, stats.range, stats.dmg, { color: '#7f8c8d', size: 4, isShotgun: true });
            break;

        /* --- BURST --- */
        case 'COLT':
            spawnBurst(game, player, angle, stats.count, 80, 16, stats.range, stats.dmg, { color: '#3498db', size: 4 });
            break;
        case 'RICO':
            spawnBurst(game, player, angle, stats.count, 80, 16, stats.range, stats.dmg, { color: '#9b59b6', size: 5, bounce: true });
            break;
        case '8-BIT':
            spawnBurst(game, player, angle, stats.count, 90, 15, stats.range, stats.dmg, { color: '#ecf0f1', size: 4 });
            break;

        /* --- SINGLE --- */
        case 'PIPER':
        case 'BEA':
        case 'BROCK':
            spawnPattern(game, player, angle, 1, 0, 20, stats.range, stats.dmg, { color: '#e67e22', size: 8 });
            break;

        /* --- SPREAD --- */
        case 'POCO':
            spawnPattern(game, player, angle, 5, 0.8, 11, stats.range, stats.dmg, { color: '#e67e22', size: 8 });
            break;
        case 'EL PRIMO':
        case 'ROSA':
            spawnPattern(game, player, angle, stats.count, 0.4, 14, stats.range, stats.dmg, { color: '#3498db', size: 10 });
            break;
        case 'BARLEY':
        case 'DYNAMIKE':
        case 'TICK':
            spawnPattern(game, player, angle, 1, 0, 10, stats.range, stats.dmg, { color: '#FF0000', size: 6, type: 'lob' });
            break;

        default:
            spawnPattern(game, player, angle, 1, 0, 12, stats.range || 500, stats.dmg || 100, { color: '#fff' });
            break;
    }
}

function spawnPattern(game, p, angle, count, spread, speed, range, dmg, custom) {
    const start = angle - (spread / 2);
    const step = count > 1 ? spread / (count - 1) : 0;
    
    for (let i = 0; i < count; i++) {
        const currentAngle = count === 1 ? angle : start + (step * i);
        game.projectiles.push(new game.ProjectileClass(
            p.x + 20, p.y + 20, currentAngle, speed, range, dmg, p, custom
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
        if (game.state !== 'GAME') { clearInterval(interval); return; }
        fireShot();
        fired++;
        if (fired >= count) clearInterval(interval);
    }, delay);
}
