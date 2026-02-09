// js/combat/attacks.js

/**
 * ATTACK ENGINE
 * Handles the logic for every single attack in the game.
 * Determines projectile count, spread, speed, range, and special properties.
 */

export function performAttack(player, game, targetX, targetY) {
    const data = player.data;
    const name = data.name.toUpperCase();
    const stats = data.atk || {};

    // 1. Calculate World Coordinates of the Mouse
    // We need to know where in the game world the player clicked, not just on the screen.
    const realTargetX = targetX + game.camera.x;
    const realTargetY = targetY + game.camera.y;

    // 2. Calculate Angle & Distance
    // Center aiming on the brawler (offset by +20 for center of 40x40 box)
    const px = player.x + 20;
    const py = player.y + 20;
    
    const angle = Math.atan2(realTargetY - py, realTargetX - px);
    const rawDist = Math.hypot(realTargetX - px, realTargetY - py);

    // 3. Define the Max Range based on Brawler Stats
    // (Default to 500 if not defined)
    const maxRange = stats.range || 500;

    // 4. Helper: Spawn a Single Projectile
    const spawn = (props) => {
        const p = new game.ProjectileClass(
            px, py, 
            props.angle || angle, 
            props.speed || 12, 
            props.range || maxRange, 
            props.dmg || stats.dmg, 
            player, 
            props.custom || {}
        );
        game.projectiles.push(p);
    };

    // 5. Helper: Handle Thrower Logic (The update you asked for!)
    // Calculates the exact landing spot based on mouse cursor.
    const throwLob = (props) => {
        // Clamp the distance: Can't throw further than maxRange
        const actualRange = Math.min(rawDist, maxRange);
        
        spawn({
            angle: angle,
            speed: props.speed || 10,
            range: actualRange, // <--- This ensures it lands ON the mouse
            dmg: props.dmg || stats.dmg,
            custom: { 
                color: props.color, 
                size: props.size || 10, 
                lob: true, // Tells engine to ignore walls
                spawnPool: props.spawnPool // Creates puddle on landing
            }
        });
    };

    // --- BRAWLER ATTACK SWITCH ---
    switch (name) {
        
        // =========================================
        // SHOTGUNNERS (Spread Attacks)
        // =========================================
        case 'SHELLY': 
            // Fire 5 pellets in a medium cone
            for(let i = -2; i <= 2; i++) {
                spawn({ 
                    angle: angle + (i * 0.1), 
                    speed: 13, 
                    range: 350, 
                    custom: { color: '#ffff00', size: 5 } 
                });
            }
            break;

        case 'BULL': 
            // Fire 5 pellets in a narrow, short cone (High damage up close)
            for(let i = -2; i <= 2; i++) {
                spawn({ 
                    angle: angle + (i * 0.08), 
                    speed: 16, 
                    range: 220, 
                    custom: { color: '#e67e22', size: 6 } 
                });
            }
            break;

        case 'DARRYL': 
            // Double shot (slightly offset timings or positions could be added here)
            spawn({ angle: angle + 0.05, speed: 14, range: 280, custom: { color: '#f39c12' } });
            spawn({ angle: angle - 0.05, speed: 14, range: 280, custom: { color: '#f39c12' } });
            break;

        // =========================================
        // SHARPSHOOTERS (Bursts & Snipers)
        // =========================================
        case 'COLT': 
            // Fire 6 bullets in a straight line
            fireBurst(game, player, angle, 6, 80, { 
                speed: 16, range: 600, dmg: stats.dmg, color: '#e74c3c', size: 6 
            });
            break;

        case 'RICO': 
            // Fire 5 bullets that bounce
            fireBurst(game, player, angle, 5, 80, { 
                speed: 15, range: 650, dmg: stats.dmg, color: '#8e44ad', size: 7, bounce: true 
            });
            break;

        case 'BROCK': 
            // Slow, heavy rocket (Explodes at end - visual only for now)
            spawn({ 
                speed: 11, range: 700, 
                custom: { color: '#e74c3c', size: 15, wallBreaker: false } 
            });
            break;

        case 'PIPER': 
            // Very fast sniper shot
            spawn({ 
                speed: 25, range: 900, 
                custom: { color: '#2980b9', size: 8 } 
            });
            break;

        case 'BEA': 
            // Sting shot
            spawn({ 
                speed: 18, range: 800, 
                custom: { color: '#f1c40f', size: 10 } 
            });
            break;

        case 'MAX': 
            // Fast 4-shot burst
            fireBurst(game, player, angle, 4, 40, { 
                speed: 19, range: 500, dmg: stats.dmg, color: '#f1c40f', size: 5 
            });
            break;

        case '8-BIT': 
            // Slow beams, but many of them
            fireBurst(game, player, angle, 6, 90, { 
                speed: 15, range: 700, dmg: stats.dmg, color: '#9b59b6', size: 8 
            });
            break;

        // =========================================
        // THROWERS (The New Logic)
        // =========================================
        case 'BARLEY': 
            // Throws a bottle that creates a puddle
            throwLob({ 
                color: '#e67e22', 
                spawnPool: true // Creates Hazard on landing
            });
            break;

        case 'DYNAMIKE': 
            // Throws two sticks of dynamite
            // We simulate this by spawning two projectiles slightly offset
            const throwDyna = (offsetAngle) => {
                const actualRange = Math.min(rawDist, maxRange);
                spawn({
                    angle: angle + offsetAngle,
                    speed: 10,
                    range: actualRange, 
                    custom: { color: '#c0392b', size: 8, lob: true }
                });
            };
            throwDyna(-0.1);
            throwDyna(0.1);
            break;

        case 'TICK': 
            // Throws mines (Cluster) - Simplified to one big mine for now
            throwLob({ 
                color: '#7f8c8d', 
                spawnPool: true 
            });
            break;

        case 'SPROUT': 
            // Seed bomb bounces
            const sproutRange = Math.min(rawDist, maxRange);
            spawn({
                speed: 10,
                range: sproutRange,
                custom: { color: '#2ecc71', size: 10, lob: true, bounce: true } 
            });
            break;

        case 'MR. P': 
            // Suitcase (Basic Lob for now)
            throwLob({ color: '#3498db', size: 12 });
            break;

        // =========================================
        // AREA / CONE ATTACKS
        // =========================================
        case 'POCO': 
            // Wide musical wave (Pierce)
            for(let i = -3; i <= 3; i++) {
                spawn({ 
                    angle: angle + (i * 0.15), 
                    speed: 11, 
                    range: 550, 
                    custom: { color: '#f1948a', size: 9, pierce: true } 
                });
            }
            break;

        case 'SANDY': 
            // Sand spray (Pierce)
            spawn({ angle: angle - 0.15, speed: 14, range: 450, custom: { color: '#f39c12', pierce: true } });
            spawn({ angle: angle + 0.15, speed: 14, range: 450, custom: { color: '#f39c12', pierce: true } });
            break;

        case 'EMZ': 
            // Hairspray cloud (Wide, slow, lingering)
            spawn({ 
                angle: angle, 
                speed: 9, 
                range: 450, 
                custom: { color: '#9b59b6', size: 30, pierce: true } // Big size acts as "Cloud"
            });
            break;

        case 'ROSA': 
            // 3 Punches wide
            for(let i = -1; i <= 1; i++) {
                spawn({ 
                    angle: angle + (i * 0.2), 
                    speed: 14, 
                    range: 220, 
                    custom: { color: '#27ae60', size: 12, pierce: true } 
                });
            }
            break;

        case 'FRANK': 
            // Hammer slam (Delay + Multi-projectile wave)
            // 300ms windup delay
            setTimeout(() => {
                if(player.hp <= 0) return; // Don't fire if dead
                for(let i = -3; i <= 3; i++) {
                    spawn({ 
                        angle: angle + (i * 0.15), 
                        speed: 15, 
                        range: 450, 
                        custom: { color: '#8e44ad', size: 15, pierce: true } 
                    });
                }
            }, 300);
            break;

        // =========================================
        // SPECIAL / MELEE
        // =========================================
        case 'EL PRIMO': 
            // Punches (Burst of 4)
            fireBurst(game, player, angle, 4, 60, { 
                speed: 16, range: 180, dmg: stats.dmg, color: '#3498db', size: 12 
            });
            break;

        case 'MORTIS': 
            // Dash Attack
            // Move player physically
            player.x += Math.cos(angle) * 120;
            player.y += Math.sin(angle) * 120;
            // Create damage area at arrival
            game.createExplosion(player.x, player.y, 80, stats.dmg, '#555', player);
            break;

        case 'JACKY': 
            // Jackhammer (Circle around self)
            // Pass 'player' as owner so she doesn't hurt herself
            game.createExplosion(player.x + 20, player.y + 20, 150, stats.dmg, '#3498db', player);
            break;

        case 'BIBI': 
            // Bat swing (Wide arc)
            for(let i = -2; i <= 2; i++) {
                spawn({ 
                    angle: angle + (i * 0.3), 
                    speed: 15, 
                    range: 250, 
                    custom: { color: '#8e44ad', size: 15, pierce: true } 
                });
            }
            break;

        // =========================================
        // LEGENDARIES
        // =========================================
        case 'CROW': 
            // Poison Daggers (3 spread)
            spawn({ angle: angle, speed: 16, range: 550, custom: { color: '#2ecc71', size: 6, poison: true } });
            spawn({ angle: angle + 0.15, speed: 16, range: 550, custom: { color: '#2ecc71', size: 6, poison: true } });
            spawn({ angle: angle - 0.15, speed: 16, range: 550, custom: { color: '#2ecc71', size: 6, poison: true } });
            break;

        case 'LEON': 
            // Spinner blades (4 blades, spread)
            // Leon's pattern changes based on movement, but simple spread for now
            for(let i = -2; i <= 1; i++) {
                spawn({ 
                    angle: angle + (i * 0.1), 
                    speed: 18, 
                    range: 650, 
                    custom: { color: '#2ecc71', size: 7 } 
                });
            }
            break;

        case 'SPIKE': 
            // Cactus Grenade
            // Ideally splits on impact. For now, simple projectile.
            spawn({ speed: 11, range: 500, custom: { color: '#27ae60', size: 12 } });
            break;

        // =========================================
        // FALLBACK
        // =========================================
        default: 
            // Generic shot
            spawn({ speed: 12, range: 450, custom: { color: '#fff', size: 8 } });
            break;
    }
}

/**
 * HELPER: Fire Burst (Colt, Rico, Max, etc)
 * Fires projectiles one by one over time.
 */
function fireBurst(game, player, angle, count, delay, props) {
    let fired = 0;
    const interval = setInterval(() => {
        // Stop if game ended or player died
        if (game.state !== 'GAME' || player.hp <= 0) { 
            clearInterval(interval); 
            return; 
        }
        
        // Add slight wiggle for realism? Optional.
        // const wiggle = (Math.random() * 0.04) - 0.02;
        
        const p = new game.ProjectileClass(
            player.x + 20, 
            player.y + 20, 
            angle, 
            props.speed, 
            props.range, 
            props.dmg, 
            player, 
            { 
                color: props.color, 
                size: props.size, 
                bounce: props.bounce // Pass bounce flag for Rico
            }
        );
        game.projectiles.push(p);

        fired++;
        if (fired >= count) clearInterval(interval);
    }, delay);
}
