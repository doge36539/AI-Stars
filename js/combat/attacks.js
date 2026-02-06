// js/combat/attacks.js

export function performAttack(player, game, targetX, targetY) {
    const data = player.data;
    const name = data.name.toUpperCase();

    // Calculate Angle
    const realTargetX = targetX + game.camera.x;
    const realTargetY = targetY + game.camera.y;
    const angle = Math.atan2(realTargetY - (player.y + 20), realTargetX - (player.x + 20));

    // Common Helpers
    const spawn = (props) => {
        const p = new game.ProjectileClass(
            player.x + 20, player.y + 20, 
            props.angle || angle, 
            props.speed || 10, 
            props.range || 500, 
            props.dmg || data.atk.dmg, 
            player, 
            props.custom || {}
        );
        game.projectiles.push(p);
    };

    switch (name) {
        // --- COMMON BRAWLERS ---
        case 'SHELLY': // Shotgun (5 pellets)
            for(let i=-2; i<=2; i++) {
                spawn({ 
                    angle: angle + (i * 0.1), 
                    speed: 12, range: 300, 
                    custom: { color: '#ffff00', size: 5 } 
                });
            }
            break;

        case 'NITA': // Shockwave (Pierces enemies)
            spawn({ 
                speed: 12, range: 450, 
                custom: { color: '#4dd0e1', size: 15, pierce: true } 
            });
            break;

        case 'COLT': // Burst (6 bullets in a row)
            fireBurst(game, player, angle, 6, 80, {
                speed: 14, range: 600, dmg: data.atk.dmg,
                color: '#e74c3c', size: 6
            });
            break;

        case 'BULL': // Heavy Shotgun (5 pellets, short range)
            for(let i=-2; i<=2; i++) {
                spawn({ 
                    angle: angle + (i * 0.15), 
                    speed: 14, range: 200, 
                    custom: { color: '#e67e22', size: 7 } 
                });
            }
            break;

        // --- RARE BRAWLERS ---
        case 'EL PRIMO': // Punch (4 fast bursts, short range)
            fireBurst(game, player, angle, 4, 60, {
                speed: 15, range: 180, dmg: data.atk.dmg,
                color: '#3498db', size: 12
            });
            break;

        case 'BARLEY': // Lob + Puddle
            spawn({ 
                speed: 9, range: 550, 
                custom: { 
                    color: '#e67e22', size: 12, 
                    lob: true, // Flies over walls
                    spawnPool: true // Creates hazard on impact
                } 
            });
            break;

        case 'POCO': // Musical Wave (Wide spread)
            for(let i=-3; i<=3; i++) {
                spawn({ 
                    angle: angle + (i * 0.15), 
                    speed: 10, range: 550, 
                    custom: { color: '#f1948a', size: 8, pierce: true } 
                });
            }
            break;

        case 'ROSA': // 3 Punches (Wide arc)
             for(let i=-1; i<=1; i++) {
                spawn({ 
                    angle: angle + (i * 0.2), 
                    speed: 14, range: 220, 
                    custom: { color: '#27ae60', size: 10, pierce: true } 
                });
            }
            break;

        // --- SUPER RARE ---
        case 'JESSIE': // Energy Orb (We can make it bounce later, standard for now)
            spawn({ 
                speed: 11, range: 650, 
                custom: { color: '#3498db', size: 10 } 
            });
            break;

        case 'DYNAMIKE': // Double Lob
            spawn({ 
                angle: angle - 0.1, speed: 9, range: 500, 
                custom: { color: '#c0392b', size: 10, lob: true } 
            });
            spawn({ 
                angle: angle + 0.1, speed: 9, range: 500, 
                custom: { color: '#c0392b', size: 10, lob: true } 
            });
            break;

        case 'TICK': // Lob Mine
             spawn({ 
                speed: 8, range: 600, 
                custom: { color: '#7f8c8d', size: 8, lob: true, spawnPool: true } 
            });
            break;

        case '8-BIT': // Laser Burst (6 slow but strong)
             fireBurst(game, player, angle, 6, 100, {
                speed: 16, range: 700, dmg: data.atk.dmg,
                color: '#9b59b6', size: 7
            });
            break;

        case 'RICO': // Bouncy Balls
             fireBurst(game, player, angle, 5, 80, {
                speed: 14, range: 650, dmg: data.atk.dmg,
                color: '#8e44ad', size: 8,
                bounce: true // Logic handled in Projectile
            });
            break;

        case 'DARRYL': // Double Shotgun
             for(let i=-1; i<=1; i++) {
                spawn({ angle: angle + 0.1, speed: 13, range: 250, custom: { color: '#f39c12', size: 6 } });
                spawn({ angle: angle - 0.1, speed: 13, range: 250, custom: { color: '#f39c12', size: 6 } });
            }
            break;

        case 'PENNY': // Bag of gold
             spawn({ 
                speed: 12, range: 600, 
                custom: { color: '#f1c40f', size: 10 } 
            });
            break;

        case 'CARL': // Boomerang (Returns) - Simple implementation for now
             spawn({ 
                speed: 14, range: 500, 
                custom: { color: '#34495e', size: 12, pierce: true } 
            });
            break;

        case 'JACKY': // Earthquake (360 damage around self)
             // This is a special "Melee Circle" attack
             game.createExplosion(player.x+20, player.y+20, 150, data.atk.dmg, '#3498db');
             break;

        // --- EPIC ---
        case 'PIPER': // Sniper (Fast)
             spawn({ 
                speed: 25, range: 900, 
                custom: { color: '#2980b9', size: 8 } 
            });
            break;

        case 'PAM': // Scrapstorm (9 bullets wide)
             for(let i=-4; i<=4; i++) {
                 // Randomize spread slightly
                 let a = angle + (i * 0.1) + (Math.random() * 0.05);
                 spawn({ 
                    angle: a, speed: 13, range: 500, 
                    custom: { color: '#e74c3c', size: 6 } 
                });
            }
            break;

        case 'FRANK': // Hammer Slam (Delay + Cone)
             setTimeout(() => {
                 for(let i=-3; i<=3; i++) {
                    spawn({ 
                        angle: angle + (i * 0.2), 
                        speed: 15, range: 400, 
                        custom: { color: '#8e44ad', size: 15, pierce: true } 
                    });
                 }
             }, 300); // 0.3s windup
             break;

        case 'BIBI': // Bat Swing
             for(let i=-2; i<=2; i++) {
                spawn({ 
                    angle: angle + (i * 0.3), 
                    speed: 15, range: 250, 
                    custom: { color: '#8e44ad', size: 15, pierce: true } 
                });
            }
            break;

        case 'BEA': // Bee
             spawn({ 
                speed: 18, range: 800, 
                custom: { color: '#f1c40f', size: 10 } 
            });
            break;

        case 'NANI': // 3 Orbs converging (Simulated as spread for now)
             spawn({ angle: angle, speed: 14, range: 600, custom: {color:'#fff', size:8}});
             spawn({ angle: angle+0.2, speed: 14, range: 600, custom: {color:'#fff', size:8}});
             spawn({ angle: angle-0.2, speed: 14, range: 600, custom: {color:'#fff', size:8}});
             break;

        // --- MYTHIC ---
        case 'MORTIS': // Dash (Move player)
             // Moves player 100px forward instantly (simplified dash)
             player.x += Math.cos(angle) * 100;
             player.y += Math.sin(angle) * 100;
             game.createExplosion(player.x, player.y, 80, data.atk.dmg, '#555');
             break;

        case 'TARA': // Cards (Pierce)
             spawn({ angle: angle, speed: 13, range: 500, custom:{color:'#e91e63', pierce:true} });
             spawn({ angle: angle+0.2, speed: 13, range: 500, custom:{color:'#e91e63', pierce:true} });
             spawn({ angle: angle-0.2, speed: 13, range: 500, custom:{color:'#e91e63', pierce:true} });
             break;

        case 'GENE': // Magic Hand
             spawn({ speed: 11, range: 550, custom: {color:'#9b59b6', size: 12} });
             break;

        case 'MAX': // Fast Blaster (4 shots)
             fireBurst(game, player, angle, 4, 50, {
                speed: 18, range: 450, dmg: data.atk.dmg,
                color: '#f1c40f', size: 5
            });
            break;

        case 'MR. P': // Suitcase (Lob)
             spawn({ speed: 10, range: 550, custom: {color:'#3498db', size: 10, lob:true} });
             break;

        case 'SPROUT': // Seed Bomb (Lob + Bounce)
             spawn({ speed: 9, range: 600, custom: {color:'#2ecc71', size: 10, lob:true, bounce:true} });
             break;

        // --- LEGENDARY ---
        case 'SPIKE': // Cactus Grenade (Splits?)
             spawn({ speed: 10, range: 500, custom: {color:'#27ae60', size: 12} });
             // NOTE: Split logic would go in Projectile.update() on death
             break;

        case 'CROW': // Daggers (Poison)
             spawn({ angle: angle, speed: 15, range: 550, custom: {color:'#2ecc71', size:6, poison:true} });
             spawn({ angle: angle+0.2, speed: 15, range: 550, custom: {color:'#2ecc71', size:6, poison:true} });
             spawn({ angle: angle-0.2, speed: 15, range: 550, custom: {color:'#2ecc71', size:6, poison:true} });
             break;

        case 'LEON': // Spinner Blades
             for(let i=-2; i<=2; i++) {
                 // Leon's curve is complex, simplified to spread here
                spawn({ 
                    angle: angle + (i * 0.15), 
                    speed: 16, range: 600, 
                    custom: { color: '#2ecc71', size: 7 } 
                });
             }
             break;

        case 'SANDY': // Sand Throw (Pierce)
             spawn({ angle: angle-0.2, speed: 13, range: 400, custom:{color:'#f39c12', pierce:true} });
             spawn({ angle: angle+0.2, speed: 13, range: 400, custom:{color:'#f39c12', pierce:true} });
             break;
        
        case 'EMZ': // Hairspray (Cloud - Lingering Pierce)
             spawn({ 
                 angle: angle, speed: 8, range: 400, 
                 custom: { color: '#9b59b6', size: 30, pierce: true } // Big hitbox
             });
             break;

        default: // Fallback
            spawn({ speed: 10, range: 400, custom: { color: '#fff', size: 5 } });
            break;
    }
}

// HELPER: Fire Burst (Colt, Rico, etc)
function fireBurst(game, player, angle, count, delay, props) {
    let fired = 0;
    const interval = setInterval(() => {
        if (game.state !== 'GAME' || player.hp <= 0) { clearInterval(interval); return; }
        
        const p = new game.ProjectileClass(
            player.x + 20, player.y + 20, 
            angle, 
            props.speed, 
            props.range, 
            props.dmg, 
            player, 
            { color: props.color, size: props.size, bounce: props.bounce }
        );
        game.projectiles.push(p);

        fired++;
        if (fired >= count) clearInterval(interval);
    }, delay);
}
