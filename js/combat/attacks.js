// js/combat/attacks.js

export function performAttack(player, game, mouseX, mouseY) {
    // 0. SAFETY & STATE CHECKS
    if (!player || !player.data) return;
    if (game.state !== 'GAME') return; // Prevent shooting in menus/pause

    const now = Date.now();
    const data = player.data;
    const stats = data.atk;

    // 1. DYNAMIC RELOAD
    // Multiplied by 10 for milliseconds (e.g., 60 reload = 600ms)
    if (player.lastShot && now - player.lastShot < (stats.reload * 10)) return;
    
    player.lastShot = now;

    // 2. ANGLE CALCULATION
    // Assumes +20 is the center of the player sprite
    const realMouseX = mouseX + game.camera.x;
    const realMouseY = mouseY + game.camera.y;
    const angle = Math.atan2(realMouseY - (player.y + 20), realMouseX - (player.x + 20));

    const name = data.name.toUpperCase();

    // 3. HAND-CODED LOGIC
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

        /* --- SNIPERS / RANGED --- */
        case 'COLT':
            spawnBurst(game, player, angle, stats.count, 100, 18, stats.range, stats.dmg, { color: '#ffffff', size: 3 });
            break;
        case 'RICO':
            spawnBurst(game, player, angle, stats.count, 90, 18, stats.range, stats.dmg, { color: '#00ccff', size: 4, bounce: true });
            break;
        case 'PIPER':
            spawnPattern(game, player, angle, 1, 0, 24, stats.range, stats.dmg, { color: '#5dade2', size: 3 });
            break;
        case 'BEA':
            spawnPattern(game, player, angle, 1, 0, 22, stats.range, stats.dmg, { color: '#f1c40f', size: 3 });
            break;
        case 'BROCK':
            spawnPattern(game, player, angle, 1, 0, 11, stats.range, stats.dmg, { color: '#e67e22', size: 10, type: 'rocket' });
            break;
        case '8-BIT':
            spawnBurst(game, player, angle, stats.count, 80, 17, stats.range, stats.dmg, { color: '#ecf0f1', size: 3 });
            break;

        /* --- AREA / WAVES --- */
        case 'POCO':
            spawnPattern(game, player, angle, 7, 1.1, 10, stats.range, stats.dmg, { color: '#9b59b6', size: 12, isRect: true });
            break;
        case 'NITA':
            spawnPattern(game, player, angle, 1, 0, 10, stats.range, stats.dmg, { color: '#e74c3c', size: 15, isRect: true });
            break;
        case 'FRANK':
            // Delay attack (Wind up)
            setTimeout(() => {
                // Ensure game is still running and player exists
                if (game.state === 'GAME' && player && !player.dead) {
                    spawnPattern(game, player, angle, 1, 0, 14, stats.range, stats.dmg, { color: '#8e44ad', size: 25, isRect: true });
                }
            }, 300);
            break;
        case 'EMZ':
            spawnPattern(game, player, angle, 1, 0, 9, stats.range, stats.dmg, { color: '#d980fa', size: 15, isRect: true, type: 'cloud' });
            break;
        case 'TARA':
            spawnPattern(game, player, angle, stats.count, stats.spread, 15, stats.range, stats.dmg, { color: '#9b59b6', size: 4, type: 'pierce' });
            break;

        /* --- THROWERS --- */
        case 'DYNAMIKE':
            spawnPattern(game, player, angle, stats.count, stats.spread, 10, stats.range, stats.dmg, { color: '#f39c12', size: 8, type: 'lob' });
            break;
        case 'TICK':
            spawnPattern(game, player, angle, stats.count, stats.spread, 9, stats.range, stats.dmg, { color: '#34495e', size: 6, type: 'lob_mines' });
            break;
        case 'BARLEY':
            spawnPattern(game, player, angle, 1, 0, 10, stats.range, stats.dmg, { color: '#f1c40f', size: 7, type: 'puddle' });
            break;

        /* --- ASSASSINS / SPECIALS --- */
        case 'MORTIS':
            spawnPattern(game, player, angle, 1, 0, 18, stats.range, stats.dmg, { color: 'rgba(155, 89, 182, 0.4)', size: 20, isRect: true });
            break;
        case 'CROW':
            spawnPattern(game, player, angle, stats.count, stats.spread, 16, stats.range, stats.dmg, { color: '#2ecc71', size: 3, type: 'poison' });
            break;
        case 'SPIKE':
            spawnPattern(game, player, angle, 1, 0, 11, stats.range, stats.dmg, { color: '#2ecc71', size: 12, type: 'spike' });
            break;
        case 'LEON':
            spawnPattern(game, player, angle, stats.count, stats.spread, 16, stats.range, stats.dmg, { color: '#27ae60', size: 4 });
            break;
        case 'BO':
            spawnBurst(game, player, angle, stats.count, 150, 15, stats.range, stats.dmg, { color: '#d35400', size: 4 });
            break;
        case 'PENNY':
             spawnPattern(game, player, angle, 1, 0, 12, stats.range, stats.dmg, { color: '#f1c40f', size: 7, type: 'coin_bag' });
             break;
        case 'EL PRIMO':
        case 'ROSA':
            spawnBurst(game, player, angle, stats.count, 100, 18, stats.range, stats.dmg, { color: '#3498db', size: 10 });
            break;

        default:
            // Fallback that uses stats from JSON
            spawnPattern(game, player, angle, 1, 0, 12, stats.range || 500, stats.dmg || 100, { color: '#fff' });
            break;
    }
}

// --- HELPER 1: SPREAD (Shotguns, etc) ---
function spawnPattern(game, p, angle, count, spread, speed, range, dmg, custom) {
    // Calculate start angle (centered around the mouse aim)
    const start = angle - (spread / 2);
    const step = count > 1 ? spread / (count - 1) : 0;
    
    for (let i = 0; i < count; i++) {
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

// --- HELPER 2: BURST (Colt, etc) ---
function spawnBurst(game, p, angle, count, delay, speed, range, dmg, custom) {
    let fired = 0;
    
    // Initial shot
    fireBurstShot();
    fired++;

    // Subsequent shots
    const interval = setInterval(() => {
        if (game.state !== 'GAME' || p.dead) {
            clearInterval(interval);
            return;
        }
        
        fireBurstShot();
        fired++;
        
        if (fired >= count) clearInterval(interval);
    }, delay);

    function fireBurstShot() {
        // Special logic for Darryl's double-shotgun inside a burst
        if (custom.isShotgun) {
            spawnPattern(game, p, angle, 4, 0.3, speed, range, dmg, custom);
        } else {
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
        }
    }
}
