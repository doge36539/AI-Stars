// js/combat/attacks.js

export function performAttack(player, game, targetX, targetY) {
    const data = player.data;
    const name = data.name.toUpperCase();
    const stats = data.atk || {};

    // 1. Calculate World Aiming Logic
    const realTargetX = targetX + game.camera.x;
    const realTargetY = targetY + game.camera.y;
    const px = player.x + 20;
    const py = player.y + 20;
    
    const angle = Math.atan2(realTargetY - py, realTargetX - px);
    const distToMouse = Math.hypot(realTargetX - px, realTargetY - py);
    const maxRange = stats.range || 500;

    // Helper to spawn standard projectiles
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

    // Helper for LOBBERS (Barley, Dyna, Tick)
    // Lands EXACTLY on mouse cursor (clamped to max range)
    const throwLob = (props) => {
        const actualRange = Math.min(distToMouse, maxRange);
        spawn({
            angle: angle,
            speed: props.speed || 10,
            range: actualRange, // Land on mouse
            dmg: props.dmg || stats.dmg,
            custom: { 
                color: props.color, 
                size: props.size || 10, 
                lob: true, 
                spawnPool: props.spawnPool, 
                spawnMine: props.spawnMine 
            }
        });
    };

    switch (name) {
        // --- THROWERS ---
        case 'BARLEY': 
            throwLob({ color: '#e67e22', spawnPool: true }); 
            break;
        case 'DYNAMIKE': 
            // Two sticks, slightly offset
            const rangeDyna = Math.min(distToMouse, maxRange);
            spawn({ angle: angle-0.1, speed: 10, range: rangeDyna, custom: {color:'#c0392b', size:8, lob:true, isExplosive:true} });
            spawn({ angle: angle+0.1, speed: 10, range: rangeDyna, custom: {color:'#c0392b', size:8, lob:true, isExplosive:true} });
            break;
        case 'TICK': 
            throwLob({ color: '#7f8c8d', spawnMine: true }); 
            break;
        case 'SPROUT': 
            // Bouncing seed
            spawn({ speed: 10, range: Math.min(distToMouse, maxRange), custom: {color:'#2ecc71', size:10, lob:true, bounce:true} }); 
            break;
        case 'MR. P': 
            throwLob({ color: '#3498db', size: 12 }); 
            break;

        // --- PIERCING / WAVES ---
        case 'POCO': 
            for(let i=-3; i<=3; i++) spawn({ angle: angle+(i*0.15), speed: 11, range: 550, custom: {color:'#f1948a', size:10, pierce:true} }); 
            break;
        case 'FRANK': 
            setTimeout(() => { 
                for(let i=-3; i<=3; i++) spawn({ angle: angle+(i*0.15), speed: 15, range: 450, custom: {color:'#8e44ad', size:15, pierce:true} }); 
            }, 300); 
            break;
        case 'EMZ': 
            spawn({ speed: 9, range: 450, custom: {color:'#9b59b6', size:30, pierce:true} }); 
            break;
        case 'SANDY': 
            spawn({ angle: angle-0.15, speed: 14, range: 450, custom: {color:'#f39c12', pierce:true} }); 
            spawn({ angle: angle+0.15, speed: 14, range: 450, custom: {color:'#f39c12', pierce:true} }); 
            break;
        case 'NITA': 
            spawn({ speed: 12, range: 450, custom: {color:'#4dd0e1', size:20, pierce:true} }); 
            break;

        // --- SHOTGUNS ---
        case 'SHELLY': 
            for(let i=-2; i<=2; i++) spawn({ angle: angle+(i*0.1), speed: 13, range: 350, custom: {color:'#ffff00', size:5} }); 
            break;
        case 'BULL': 
            for(let i=-2; i<=2; i++) spawn({ angle: angle+(i*0.08), speed: 16, range: 220, custom: {color:'#e67e22', size:6} }); 
            break;
        case 'DARRYL': 
            spawn({ angle: angle+0.05, speed: 14, range: 280, custom: {color:'#f39c12'} }); 
            spawn({ angle: angle-0.05, speed: 14, range: 280, custom: {color:'#f39c12'} }); 
            break;

        // --- BURST / SNIPERS ---
        case 'COLT': 
            fireBurst(game, player, angle, 6, 80, {speed: 16, range: 600, dmg: stats.dmg, color: '#e74c3c', size: 6}); 
            break;
        case 'RICO': 
            fireBurst(game, player, angle, 5, 80, {speed: 15, range: 650, dmg: stats.dmg, color: '#8e44ad', size: 7, bounce: true}); 
            break;
        case 'MAX': 
            fireBurst(game, player, angle, 4, 40, {speed: 19, range: 500, dmg: stats.dmg, color: '#f1c40f', size: 5}); 
            break;
        case '8-BIT': 
            fireBurst(game, player, angle, 6, 90, {speed: 15, range: 700, dmg: stats.dmg, color: '#9b59b6', size: 8}); 
            break;
        case 'PIPER': 
            spawn({ speed: 25, range: 900, custom: {color:'#2980b9', size:8} }); 
            break;
        case 'BROCK': 
            spawn({ speed: 11, range: 700, custom: {color:'#e74c3c', size:15, isExplosive:true} }); 
            break;
        case 'BEA': 
            spawn({ speed: 18, range: 800, custom: {color:'#f1c40f', size:10} }); 
            break;

        // --- MELEE / SPECIAL ---
        case 'EL PRIMO': 
            fireBurst(game, player, angle, 4, 60, {speed: 16, range: 180, dmg: stats.dmg, color: '#3498db', size: 12}); 
            break;
        case 'MORTIS': 
            // Real Dash Movement
            const dashDist = 200;
            player.x += Math.cos(angle) * dashDist;
            player.y += Math.sin(angle) * dashDist;
            // Check collisions after dash to prevent sticking in walls
            if(game.checkWallCollision(player.x, player.y)) {
                // If stuck, bounce back slightly (simple fix)
                player.x -= Math.cos(angle) * 20; 
                player.y -= Math.sin(angle) * 20;
            }
            game.createExplosion(player.x+20, player.y+20, 100, stats.dmg, '#555', player);
            break;
        case 'JACKY': 
            game.createExplosion(player.x+20, player.y+20, 150, stats.dmg, '#3498db', player); 
            break;
        case 'BIBI': 
            for(let i=-2; i<=2; i++) spawn({ angle: angle+(i*0.3), speed: 15, range: 250, custom: {color:'#8e44ad', size:15, pierce:true} }); 
            break;

        // --- LEGENDARIES ---
        case 'CROW': 
            spawn({ angle: angle, speed: 16, range: 550, custom: {color:'#2ecc71', size:6, poison:true} }); 
            spawn({ angle: angle+0.15, speed: 16, range: 550, custom: {color:'#2ecc71', size:6, poison:true} }); 
            spawn({ angle: angle-0.15, speed: 16, range: 550, custom: {color:'#2ecc71', size:6, poison:true} }); 
            break;
        case 'LEON': 
            for(let i=-2; i<=1; i++) spawn({ angle: angle+(i*0.1), speed: 18, range: 650, custom: {color:'#2ecc71', size:7} }); 
            break;
        case 'SPIKE': 
            spawn({ speed: 11, range: 500, custom: {color:'#27ae60', size:12, isExplosive:true} }); 
            break;

        default: 
            spawn({ speed: 12, range: 450, custom: {color:'#fff', size:8} }); 
            break;
    }
}

function fireBurst(game, player, angle, count, delay, props) {
    let fired = 0;
    const interval = setInterval(() => {
        if (game.state !== 'GAME' || player.hp <= 0) { clearInterval(interval); return; }
        const p = new game.ProjectileClass(
            player.x + 20, player.y + 20, angle, props.speed, props.range, props.dmg, player, 
            { color: props.color, size: props.size, bounce: props.bounce }
        );
        game.projectiles.push(p);
        fired++;
        if (fired >= count) clearInterval(interval);
    }, delay);
}
