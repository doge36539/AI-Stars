// js/combat/attacks.js

export function performAttack(player, game, mouseX, mouseY) {
    const data = player.data;
    const now = Date.now();
    const stats = data.atk;

    // 1. DYNAMIC RELOAD
    if (player.lastShot && now - player.lastShot < (stats.reload * 10)) return;
    player.lastShot = now;

    // 2. ANGLE CALCULATION
    const realMouseX = mouseX + game.camera.x;
    const realMouseY = mouseY + game.camera.y;
    const angle = Math.atan2(realMouseY - (player.y + 20), realMouseX - (player.x + 20));

    const name = data.name.toUpperCase();

    // 3. THE FULL ROSTER SWITCH
    switch (name) {
        case 'SHELLY':
            spawnPattern(game, player, angle, stats.count, stats.spread, 12, stats.range, stats.dmg, { color: '#e67e22', size: 4 });
            break;
        case 'NITA':
            spawnPattern(game, player, angle, 1, 0, 10, stats.range, stats.dmg, { color: '#e74c3c', size: stats.width / 4, isRect: true });
            break;
        case 'COLT':
            spawnBurst(game, player, angle, stats.count, 100, 18, stats.range, stats.dmg, { color: '#ffffff', size: 3 });
            break;
        case 'BULL':
            spawnPattern(game, player, angle, stats.count, stats.spread, 14, stats.range, stats.dmg, { color: '#95a5a6', size: 3 });
            break;
        case 'PIPER':
            spawnPattern(game, player, angle, 1, 0, 24, stats.range, stats.dmg, { color: '#5dade2', size: 3 });
            break;
        case 'FRANK':
            setTimeout(() => {
                spawnPattern(game, player, angle, 1, 0, 14, stats.range, stats.dmg, { color: '#8e44ad', size: stats.width / 3, isRect: true });
            }, 300); 
            break;
        case 'MORTIS':
            spawnPattern(game, player, angle, 1, 0, 20, stats.range, stats.dmg, { color: 'rgba(155, 89, 182, 0.4)', size: 20, isRect: true });
            break;
        case 'TARA':
            spawnPattern(game, player, angle, stats.count, stats.spread, 15, stats.range, stats.dmg, { color: '#9b59b6', size: 4, type: 'pierce' });
            break;
        case 'SPIKE':
            spawnPattern(game, player, angle, 1, 0, 11, stats.range, stats.dmg, { color: '#2ecc71', size: 12, type: 'spike' });
            break;
        case 'CROW':
            spawnPattern(game, player, angle, stats.count, stats.spread, 16, stats.range, stats.dmg, { color: '#2ecc71', size: 3, type: 'poison' });
            break;
        case 'LEON':
            spawnPattern(game, player, angle, stats.count, stats.spread, 16, stats.range, stats.dmg, { color: '#27ae60', size: 4 });
            break;
        case 'DYNAMIKE':
            spawnPattern(game, player, angle, stats.count, stats.spread, 10, stats.range, stats.dmg, { color: '#f39c12', size: 8, type: 'lob' });
            break;
        case 'BO':
            spawnBurst(game, player, angle, stats.count, 150, 15, stats.range, stats.dmg, { color: '#d35400', size: 4 });
            break;
        case 'TICK':
            spawnPattern(game, player, angle, stats.count, stats.spread, 9, stats.range, stats.dmg, { color: '#34495e', size: 6, type: 'lob_mines' });
            break;
        case '8-BIT':
            spawnBurst(game, player, angle, stats.count, 80, 17, stats.range, stats.dmg, { color: '#ecf0f1', size: 3 });
            break;
        case 'EMZ':
            spawnPattern(game, player, angle, 1, 0, 8, stats.range, stats.dmg, { color: '#d980fa', size: stats.width / 4, isRect: true, type: 'cloud' });
            break;
        case 'EL PRIMO':
        case 'ROSA':
            spawnBurst(game, player, angle, stats.count, 100, 18, stats.range, stats.dmg, { color: '#3498db', size: 10 });
            break;
        case 'BARLEY':
            spawnPattern(game, player, angle, 1, 0, 10, stats.range, stats.dmg, { color: '#f1c40f', size: 7, type: 'puddle' });
            break;
        case 'POCO':
            spawnPattern(game, player, angle, 1, 0, 10, stats.range, stats.dmg, { color: '#9b59b6', size: stats.width / 4, isRect: true });
            break;
        case 'RICO':
            spawnBurst(game, player, angle, stats.count, 90, 18, stats.range, stats.dmg, { color: '#00ccff', size: 4, bounce: true });
            break;
        default:
            spawnPattern(game, player, angle, 1, 0, 12, 500, 500, { color: '#fff' });
            break;
    }
}

// --- HELPER: SPREAD PATTERNS ---
function spawnPattern(game, p, angle, count, spread, speed, range, dmg, custom) {
    const start = angle - (spread / 2);
    const step = count > 1 ? spread / (count - 1) : 0;
    for (let i = 0; i < count; i++) {
        // USE THE BRIDGE HERE: game.ProjectileClass
        game.projectiles.push(new game.ProjectileClass(
            p.x + 20, 
            p.y + 20, 
            start + (step * i), 
            speed, 
            range, 
            dmg, 
            p, 
            custom
        ));
    }
}

// --- HELPER: BURST FIRE ---
function spawnBurst(game, p, angle, count, delay, speed, range, dmg, custom) {
    let fired = 0;
    const interval = setInterval(() => {
        if (game.state !== 'GAME') return clearInterval(interval);
        
        // USE THE BRIDGE HERE: game.ProjectileClass
        game.projectiles.push(new game.ProjectileClass(
            p.x + 20, 
            p.y + 20, 
            angle, 
            speed, 
            range, 
            dmg, 
            p, 
            custom
        ));
        
        fired++;
        if (fired >= count) clearInterval(interval);
    }, delay);
}
