// js/combat/supers.js

export function performSuper(player, game, targetX, targetY) {
    const data = player.data;
    const name = data.name.toUpperCase();
    
    // --- 1. CALCULATE ANGLES & TARGETS ---
    const realTargetX = targetX + game.camera.x;
    const realTargetY = targetY + game.camera.y;
    const angle = Math.atan2(realTargetY - (player.y + 20), realTargetX - (player.x + 20));
    const dist = Math.hypot(realTargetX - player.x, realTargetY - player.y);

    console.log(`[SUPER] ${name} activated!`);

    // --- HELPER WRAPPERS ---
    // Shortens the code below so we can write more logic
    const spawnProj = (props) => {
        game.projectiles.push(new game.ProjectileClass(
            player.x + 20, player.y + 20, 
            props.angle || angle, 
            props.speed || 15, 
            props.range || 800, 
            props.dmg || (data.sup ? data.sup.dmg : 1000), 
            player, 
            props.custom || {}
        ));
    };

    switch (name) {
        // =========================================
        // TROPHY ROAD / COMMON
        // =========================================
        case 'SHELLY': // SUPER SHELL (Wall Break + Knockback)
            for(let i = -4; i <= 4; i++) {
                spawnProj({ 
                    angle: angle + (i * 0.08), 
                    speed: 18, range: 450, 
                    dmg: 400, // Per pellet
                    custom: { 
                        color: '#e74c3c', size: 10, 
                        wallBreaker: true, knockback: 40 
                    }
                });
            }
            break;

        case 'NITA': // BIG BABY BEAR
            spawnMinion(game, player, realTargetX, realTargetY, {
                name: "Bruce", icon: "🐻", hp: 6000, speed: 4.5,
                atk: { dmg: 600, range: 60, reload: 600 }
            });
            break;

        case 'COLT': // BULLET STORM (Wall Break)
            fireBurst(game, player, angle, 12, 60, {
                speed: 22, range: 900, dmg: 400,
                color: '#f1c40f', size: 12, wallBreaker: true
            });
            break;

        case 'BULL': // BULLDOZER (Charge)
            performDash(game, player, angle, 800, 25, true); // true = breaks walls
            break;

        case 'JESSIE': // SCRAPPY (Turret)
            spawnMinion(game, player, realTargetX, realTargetY, {
                name: "Scrappy", icon: "🐶", hp: 4500, speed: 0, // Stationary
                atk: { dmg: 350, range: 700, reload: 250 } // Fast shooter
            });
            break;

        case 'BROCK': // ROCKET RAIN (Area Lobs)
            fireCluster(game, player, realTargetX, realTargetY, 9, 150, {
                color: '#e74c3c', size: 20, lob: true, wallBreaker: true, dmg: 800
            });
            break;

        case 'DYNAMIKE': // BIG BARREL O' BOOM
            spawnProj({ 
                speed: 10, range: dist, 
                custom: { 
                    color: '#c0392b', size: 40, lob: true, wallBreaker: true, 
                    explosionRadius: 150 // Big boom logic handled in Projectile death
                }
            });
            break;

        case 'BO': // CATCH A FOX (Mines)
            // Spawns 3 mines in a triangle
            createMine(game, player, realTargetX, realTargetY);
            createMine(game, player, realTargetX - 50, realTargetY - 50);
            createMine(game, player, realTargetX + 50, realTargetY - 50);
            break;

        case 'TICK': // HEADFIRST (Homing Head)
            spawnMinion(game, player, player.x, player.y, {
                name: "Head", icon: "💣", hp: 2000, speed: 9, // Very fast
                atk: { dmg: 2500, range: 20, reload: 0, suicide: true } // Explodes on contact
            });
            break;

        case '8-BIT': // DAMAGE BOOSTER
            spawnMinion(game, player, player.x, player.y, {
                name: "Turret", icon: "👾", hp: 4000, speed: 0,
                atk: { dmg: 0, range: 0, reload: 9999 } // Just a shield for now
            });
            game.showFloatText("BUFFED!", player.x, player.y, '#9b59b6');
            break;

        case 'EMZ': // CAUSTIC CHARISMA (Moving Hazard)
            // Attach a hazard to the player that follows them
            createAttachedHazard(game, player, 200, 300); // Radius 200, Dmg 300
            break;

        // =========================================
        // RARE
        // =========================================
        case 'EL PRIMO': // FLYING ELBOW (Jump)
            performJump(game, player, realTargetX, realTargetY, 1000, true); // true = breaks walls
            break;

        case 'BARLEY': // LAST CALL (Huge area of puddles)
            for(let i=0; i<5; i++) {
                // Random spread around target
                let rx = realTargetX + (Math.random() * 150 - 75);
                let ry = realTargetY + (Math.random() * 150 - 75);
                let rAngle = Math.atan2(ry - player.y, rx - player.x);
                let rDist = Math.hypot(rx - player.x, ry - player.y);
                
                spawnProj({ 
                    angle: rAngle, speed: 10, range: rDist, dmg: 800,
                    custom: { color: '#e67e22', lob: true, spawnPool: true }
                });
            }
            break;

        case 'POCO': // ENCORE (Heal Wave)
            player.hp = Math.min(player.maxHp, player.hp + 3000); // Heal Self
            game.showFloatText("+3000", player.x, player.y - 40, '#2ecc71');
            
            // Visual Wave
            for(let i=-5; i<=5; i++) {
                spawnProj({ 
                    angle: angle + (i * 0.1), speed: 20, range: 800, dmg: 0,
                    custom: { color: '#2ecc71', size: 15, pierce: true } // Heals not impl yet, looks cool
                });
            }
            break;

        case 'ROSA': // STRONG STUFF (Shield)
            player.hp += 4000; // Temp HP for now
            game.showFloatText("SHIELD UP!", player.x, player.y - 40, '#fff');
            player.data.icon = "🛡️"; // Visual change
            setTimeout(() => player.data.icon = "🥊", 5000);
            break;

        // =========================================
        // SUPER RARE
        // =========================================
        case 'RICO': // TRICK SHOT (Bouncing Burst)
            fireBurst(game, player, angle, 12, 50, {
                speed: 20, range: 1000, dmg: 400,
                color: '#8e44ad', size: 10, bounce: true, pierce: true
            });
            break;

        case 'DARRYL': // BARREL ROLL
            performDash(game, player, angle, 900, 30, false, true); // Bounce off walls
            break;

        case 'PENNY': // OLD LOBBER (Mortar)
            spawnMinion(game, player, player.x, player.y, {
                name: "Mortar", icon: "💣", hp: 3500, speed: 0,
                atk: { dmg: 1500, range: 1000, reload: 2000, type: 'lob' } // Slow heavy lob
            });
            break;

        case 'CARL': // TAILSPIN (Speed + AOE)
            player.speed *= 2; // Speed up
            game.showFloatText("SPIN!", player.x, player.y, '#f1c40f');
            
            // Create a spin effect for 3 seconds
            let spins = 0;
            let spinInt = setInterval(() => {
                if (game.state !== 'GAME' || spins > 20) { 
                    clearInterval(spinInt); player.speed /= 2; return; 
                }
                game.createExplosion(player.x+20, player.y+20, 100, 600, '#3498db', player);
                spins++;
            }, 150);
            break;

        case 'JACKY': // HOLEY MOLEY (Pull)
            // Create reverse explosion (Pull)
            game.createExplosion(player.x+20, player.y+20, 250, 500, '#3498db', player);
            // Pull logic would go here (iterating entities and moving them towards player)
            break;

        // =========================================
        // EPIC
        // =========================================
        case 'PIPER': // POPPIN' (Jump + Grenades)
            performJump(game, player, realTargetX, realTargetY, 0, true);
            // Leave bombs behind
            createMine(game, player, player.x, player.y);
            createMine(game, player, player.x + 30, player.y);
            createMine(game, player, player.x - 30, player.y);
            break;

        case 'PAM': // MAMA'S KISS (Heal Station)
            spawnMinion(game, player, player.x, player.y, {
                name: "Healer", icon: "❤️", hp: 4000, speed: 0,
                atk: { dmg: 0, range: 200, reload: 1000, type: 'heal' } // Heals nearby
            });
            break;

        case 'FRANK': // STUNNING BLOW
            setTimeout(() => {
                game.createExplosion(player.x + Math.cos(angle)*100, player.y + Math.sin(angle)*100, 200, 1500, '#8e44ad', player);
                // Stun logic: Set enemy.stunTimer = 60
            }, 500);
            break;

        case 'BIBI': // SPITBALL (Bouncing Range)
            spawnProj({ 
                speed: 18, range: 2000, dmg: 1200, 
                custom: { color: '#e91e63', size: 30, bounce: true, pierce: true }
            });
            break;

        case 'BEA': // IRON HIVE (Slow)
            for(let i=-2; i<=2; i++) {
                spawnProj({ 
                    angle: angle + (i * 0.2), speed: 15, range: 600, dmg: 500,
                    custom: { color: '#f1c40f', size: 10 } // Should apply slow
                });
            }
            break;

        case 'NANI': // PEEP (Manual Control - Simulated as Homing)
            spawnProj({ 
                speed: 12, range: 1500, dmg: 2500,
                custom: { color: '#ecf0f1', size: 15, homing: true, wallBreaker: true }
            });
            break;

        // =========================================
        // MYTHIC
        // =========================================
        case 'MORTIS': // LIFE BLOOD (Bats)
            for(let i=-2; i<=2; i++) {
                spawnProj({ 
                    angle: angle + (i * 0.1), speed: 18, range: 600, dmg: 400,
                    custom: { color: '#555', size: 10, pierce: true, lifesteal: true }
                });
            }
            break;

        case 'TARA': // GRAVITY (Pull + Boom)
            spawnProj({ 
                speed: 12, range: dist, 
                custom: { 
                    color: '#e91e63', size: 15, lob: true,
                    explosionRadius: 150, pull: true 
                }
            });
            break;

        case 'GENE': // MAGIC HAND
            spawnProj({ 
                speed: 15, range: 800, dmg: 200,
                custom: { color: '#9b59b6', size: 20, pull: true, pierce: false }
            });
            break;

        case 'MAX': // LET'S GO (Speed)
            player.speed *= 2;
            game.showFloatText("SPEED UP!", player.x, player.y, '#f1c40f');
            setTimeout(() => player.speed /= 2, 4000);
            break;

        case 'MR. P': // PORTERS
            spawnMinion(game, player, realTargetX, realTargetY, {
                name: "Base", icon: "🏠", hp: 3000, speed: 0,
                atk: { dmg: 0, range: 0, reload: 9999, spawnPorter: true }
            });
            break;

        case 'SPROUT': // HEDGE (Wall)
            // Create a temporary wall block
            game.walls.push({ x: realTargetX, y: realTargetY, w: 50, h: 50, type: 'wall', temp: true });
            game.showFloatText("BLOCK!", realTargetX, realTargetY, '#2ecc71');
            break;

        // =========================================
        // LEGENDARY
        // =========================================
        case 'SPIKE': // STICK AROUND (Slow Field)
            spawnProj({ 
                speed: 12, range: dist, 
                custom: { 
                    color: '#2ecc71', size: 15, lob: true, spawnPool: true 
                }
            });
            break;

        case 'CROW': // SWOOP (Jump + Poison)
            performJump(game, player, realTargetX, realTargetY, 500);
            // Poison Ring on launch and land is tricky, simplifying to just land
            setTimeout(() => {
                for(let i=0; i<8; i++) {
                    spawnProj({ 
                        angle: (i/8) * Math.PI * 2, speed: 12, range: 200, dmg: 300,
                        custom: { color: '#2ecc71', poison: true }
                    });
                }
            }, 500);
            break;

        case 'LEON': // SMOKE BOMB
            game.showFloatText("INVISIBLE", player.x, player.y, '#bdc3c7');
            player.visible = false; // Need to handle this in render
            player.speed *= 1.3;
            setTimeout(() => { player.visible = true; player.speed /= 1.3; }, 6000);
            break;

        case 'SANDY': // SANDSTORM
            createAttachedHazard(game, player, 300, 100); // Big area, low dmg
            break;

        case 'AMBER': // TORCHY (Oil)
             for(let i=0; i<10; i++) {
                let rx = realTargetX + (Math.random() * 100);
                let ry = realTargetY + (Math.random() * 100);
                spawnProj({ 
                    angle: angle, speed: 12, range: dist, 
                    custom: { color: '#e67e22', lob: true, spawnPool: true }
                });
            }
            break;

        default:
            console.log("Super not implemented for " + name);
            spawnProj({ speed: 15, range: 600, dmg: 1000 });
            break;
    }
}

// =========================================
// COMPLEX HELPER FUNCTIONS
// =========================================

function fireBurst(game, p, angle, count, delay, props) {
    let fired = 0;
    const interval = setInterval(() => {
        if (game.state !== 'GAME' || p.hp <= 0) { clearInterval(interval); return; }
        
        // Random slight spread for realism
        const finalAngle = angle + (Math.random() * 0.05 - 0.025);

        game.projectiles.push(new game.ProjectileClass(
            p.x + 20, p.y + 20, 
            finalAngle, 
            props.speed, props.range, props.dmg, p, 
            { color: props.color, size: props.size, wallBreaker: props.wallBreaker, bounce: props.bounce, pierce: props.pierce }
        ));

        fired++;
        if (fired >= count) clearInterval(interval);
    }, delay);
}

function spawnMinion(game, owner, x, y, stats) {
    // Dynamically create a minion using the owner's class
    // This allows it to update/draw without extra code
    const minionData = {
        name: stats.name,
        icon: stats.icon,
        hp: stats.hp,
        speed: stats.speed,
        atk: stats.atk
    };
    
    // Create entity (using owner.constructor assumes Entity class is available via instance)
    const minion = new owner.constructor(minionData, x, y, false, game);
    
    // Mark as minion so it doesn't fight owner
    minion.owner = owner; 
    
    game.entities.push(minion);
    game.showFloatText(stats.icon, x, y - 40, '#fff');
}

function performDash(game, player, angle, distance, speed, breakWalls = false, bounce = false) {
    let travelled = 0;
    const interval = setInterval(() => {
        if (game.state !== 'GAME') { clearInterval(interval); return; }

        let dx = Math.cos(angle) * speed;
        let dy = Math.sin(angle) * speed;

        // Bounce Logic
        if (bounce && game.checkWallCollision(player.x + dx, player.y + dy)) {
            angle = angle + Math.PI / 2; // Simple bounce
             dx = Math.cos(angle) * speed;
             dy = Math.sin(angle) * speed;
        }

        player.x += dx;
        player.y += dy;
        travelled += speed;

        // Wall Breaking
        if (breakWalls && game.checkWallCollision(player.x, player.y)) {
             game.destroyWall(player.x + 20, player.y + 20);
             game.createExplosion(player.x+20, player.y+20, 50, 200, '#e74c3c', player);
        }

        // Hit Enemies
        for(let e of game.entities) {
            if(e !== player && Math.hypot(e.x - player.x, e.y - player.y) < 40) {
                e.hp -= 100; // Dash damage
            }
        }

        if (travelled >= distance) clearInterval(interval);
    }, 16);
}

function performJump(game, player, destX, destY, damage, breakWalls = false) {
    const startY = player.y;
    game.showFloatText("JUMP!", player.x, player.y - 40, '#fff');
    
    // Visual "In Air" check could be added here (e.g. shadow grows)
    
    setTimeout(() => {
        if (game.state !== 'GAME') return;
        player.x = destX;
        player.y = destY;
        
        game.createExplosion(player.x + 20, player.y + 20, 150, damage, '#e74c3c', player);
        
        if (breakWalls) {
            game.destroyWall(player.x + 20, player.y + 20);
        }
    }, 600); // 0.6s flight time
}

function createMine(game, owner, x, y) {
    // Mines are basically Hazards that explode once
    // For now, we simulate them as invisible hazards
    game.hazards.push({
        x: x, y: y, radius: 40, damage: 2000, owner: owner, life: 9999,
        draw: (ctx, cx, cy) => {
            ctx.fillStyle = 'red';
            ctx.beginPath(); ctx.arc(x - cx, y - cy, 5, 0, Math.PI*2); ctx.fill();
        },
        update: (dt) => {
            // If enemy steps on it, boom
            for (let e of game.entities) {
                if (e !== owner && Math.hypot(e.x - x, e.y - y) < 40) {
                     game.createExplosion(x, y, 100, 2000, '#e74c3c', owner);
                     // Remove self (hacky way, ideally use class)
                     game.hazards = game.hazards.filter(h => h !== this);
                     return;
                }
            }
        }
    });
}

function createCluster(game, player, x, y, count, radius, props) {
    for(let i=0; i<count; i++) {
        let rx = x + (Math.random() * radius - radius/2);
        let ry = y + (Math.random() * radius - radius/2);
        let dist = Math.hypot(rx - player.x, ry - player.y);
        let angle = Math.atan2(ry - player.y, rx - player.x);
        
        game.projectiles.push(new game.ProjectileClass(
            player.x + 20, player.y + 20, angle, 12, dist, props.dmg, player, 
            { color: props.color, size: props.size, lob: true, wallBreaker: props.wallBreaker }
        ));
    }
}

function fireCluster(game, player, x, y, count, radius, props) {
    createCluster(game, player, x, y, count, radius, props);
}

function createAttachedHazard(game, owner, radius, damage) {
    // A hazard that moves with the player (Emz/Sandy)
    const hazard = {
        owner: owner, radius: radius, damage: damage, life: 300, tick: 0,
        update: (dt) => {
            hazard.life -= dt;
            hazard.tick += dt;
            if (hazard.tick > 30) {
                hazard.tick = 0;
                for(let e of game.entities) {
                    if (e !== owner && Math.hypot(e.x - owner.x, e.y - owner.y) < radius) {
                        e.hp -= damage;
                        game.showFloatText("-" + damage, e.x, e.y-20, '#9b59b6');
                    }
                }
            }
        },
        draw: (ctx, cx, cy) => {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#9b59b6';
            ctx.beginPath();
            ctx.arc(owner.x + 20 - cx, owner.y + 20 - cy, radius, 0, Math.PI*2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    };
    game.hazards.push(hazard);
}
