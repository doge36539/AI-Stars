import { Projectile } from './projectiles.js';

export function performAttack(player, game, mouseX, mouseY) {
    const data = player.data;
    const now = Date.now();
    const atkStats = data.atk;

    // 1. GLOBAL RELOAD CHECK
    // (We multiply reload by 10 to make the numbers from your list feel right in ms)
    if (player.lastShot && now - player.lastShot < (atkStats.reload * 10)) return;
    player.lastShot = now;

    // 2. CALCULATE ANGLE
    const realMouseX = mouseX + game.camera.x;
    const realMouseY = mouseY + game.camera.y;
    const angle = Math.atan2(realMouseY - player.y, realMouseX - player.x);

    // 3. ROUTER: WHICH BRAWLER IS THIS?
    // We switch based on the Name (or ID) to run custom code.
    const name = data.name.toUpperCase();

    switch (name) {
        case 'SHELLY':
            attackShelly(player, game, angle);
            break;
        case 'COLT':
            attackColt(player, game, angle);
            break;
        case 'NITA':
            attackNita(player, game, angle);
            break;
        case 'EL PRIMO':
            attackElPrimo(player, game, angle);
            break;
        case 'POCO':
            attackPoco(player, game, angle);
            break;
        case 'SPIKE':
            attackSpike(player, game, angle);
            break;
        default:
            // Default "Pea Shooter" for anyone we haven't coded yet
            spawnBullet(game, player, angle, 10, 600, 500); 
            break;
    }
}

// ==========================================
//    CUSTOM ATTACK FUNCTIONS
// ==========================================

function attackShelly(p, game, angle) {
    // Shotgun: 5 pellets, spread out
    const count = 5;
    const spread = 0.5; // Width of the cone
    const startAngle = angle - (spread / 2);
    const step = spread / (count - 1);

    for (let i = 0; i < count; i++) {
        spawnBullet(game, p, startAngle + (step * i), 12, 400, 420);
    }
}

function attackColt(p, game, angle) {
    // BURST FIRE: Shoots 6 bullets one after another
    let shotsFired = 0;
    const totalShots = 6;
    
    // We create a mini-timer to fire bullets every 100ms
    const interval = setInterval(() => {
        spawnBullet(game, p, angle, 14, 750, 540); // Fast speed (14), Long range (750)
        shotsFired++;
        if (shotsFired >= totalShots) clearInterval(interval);
    }, 100); 
}

function attackNita(p, game, angle) {
    // Shockwave: Pierces enemies (We need to add 'pierce' type support later)
    // For now, it's a medium range, slightly wide bullet
    spawnBullet(game, p, angle, 10, 450, 800, 'pierce');
}

function attackElPrimo(p, game, angle) {
    // Punch: Very short range, multiple "pellets" to simulate a fist width
    spawnBullet(game, p, angle, 15, 150, 300);
    spawnBullet(game, p, angle + 0.1, 15, 150, 300);
    spawnBullet(game, p, angle - 0.1, 15, 150, 300);
}

function attackPoco(p, game, angle) {
    // Music Wave: Fires MANY bullets in a wide arc to look like a wave
    const count = 10;
    const spread = 1.0; // Very wide
    const startAngle = angle - (spread / 2);
    const step = spread / (count - 1);

    for (let i = 0; i < count; i++) {
        spawnBullet(game, p, startAngle + (step * i), 9, 650, 700);
    }
}

function attackSpike(p, game, angle) {
    // Cactus Grenade: Shoots one ball, when it dies, it explodes
    // (We will need to add the explosion logic in projectiles.js later)
    spawnBullet(game, p, angle, 10, 500, 600, 'spike_grenade');
}

// ==========================================
//    HELPER: SPAWN BULLET
// ==========================================
function spawnBullet(game, owner, angle, speed, range, dmg, type='normal') {
    // This calls the Projectile class you made in step 2
    let bullet = new Projectile(
        game,
        owner.x + 20, // Start Center X
        owner.y + 20, // Start Center Y
        angle,
        speed,
        range,
        dmg,
        type
    );
    game.projectiles.push(bullet);
}
