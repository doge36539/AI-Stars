// js/combat/reticles.js

/**
 * THE RETICLE ENGINE
 * Handles drawing aiming guides, calculating wall collisions (raycasting),
 * and rendering specific shapes (Cones, Lines, Lobs) for each Brawler.
 */

// --- CONFIGURATION ---
// Customize the reticle style for every Brawler here.
const RETICLE_CONFIG = {
    // --- SHOTGUNNERS (Cones) ---
    'SHELLY':    { type: 'cone', range: 300, angle: 0.4, color: 'rgba(255,255,255,0.5)' },
    'BULL':      { type: 'cone', range: 200, angle: 0.5, color: 'rgba(255,255,255,0.5)' },
    'DARRYL':    { type: 'cone', range: 250, angle: 0.4, color: 'rgba(255,255,255,0.5)' },
    'PAM':       { type: 'cone', range: 500, angle: 0.6, color: 'rgba(255,255,255,0.4)' },
    'POCO':      { type: 'cone', range: 550, angle: 0.8, color: 'rgba(255,255,255,0.4)' }, // Wide cone
    'ROSA':      { type: 'cone', range: 220, angle: 0.7, color: 'rgba(255,255,255,0.5)' },
    'FRANK':     { type: 'cone', range: 400, angle: 0.8, color: 'rgba(255,255,255,0.5)' },
    'BIBI':      { type: 'cone', range: 250, angle: 1.0, color: 'rgba(255,255,255,0.5)' }, // Very wide swing
    'SANDY':     { type: 'cone', range: 400, angle: 0.6, color: 'rgba(255,255,255,0.4)' },
    'EMZ':       { type: 'cone', range: 400, angle: 0.7, color: 'rgba(255,255,255,0.4)' },
    'CROW':      { type: 'cone', range: 550, angle: 0.3, color: 'rgba(255,255,255,0.5)' }, // Narrow cone (daggers)
    'LEON':      { type: 'cone', range: 600, angle: 0.4, color: 'rgba(255,255,255,0.5)' },
    'TARA':      { type: 'cone', range: 500, angle: 0.4, color: 'rgba(255,255,255,0.5)' },
    'GENE':      { type: 'cone', range: 550, angle: 0.2, color: 'rgba(255,255,255,0.5)' }, // Narrow start, splits later

    // --- SHARPSHOOTERS (Lines) ---
    'COLT':      { type: 'line', range: 600, width: 40,  color: 'rgba(255,255,255,0.3)' },
    'RICO':      { type: 'line', range: 650, width: 40,  color: 'rgba(255,255,255,0.3)', bounce: true }, // Special bounce logic
    'BROCK':     { type: 'line', range: 700, width: 40,  color: 'rgba(255,255,255,0.3)' },
    'PIPER':     { type: 'line', range: 900, width: 30,  color: 'rgba(255,255,255,0.3)' }, // Long range
    'BEA':       { type: 'line', range: 800, width: 50,  color: 'rgba(255,255,255,0.3)' },
    'NANI':      { type: 'line', range: 600, width: 30,  color: 'rgba(255,255,255,0.3)' },
    '8-BIT':     { type: 'line', range: 700, width: 45,  color: 'rgba(255,255,255,0.3)' },
    'MAX':       { type: 'line', range: 450, width: 30,  color: 'rgba(255,255,255,0.3)' },
    'PENNY':     { type: 'line', range: 600, width: 40,  color: 'rgba(255,255,255,0.3)' },
    'JESSIE':    { type: 'line', range: 650, width: 40,  color: 'rgba(255,255,255,0.3)' },
    'NITA':      { type: 'line', range: 450, width: 60,  color: 'rgba(255,255,255,0.3)' }, // Wide line shockwave
    'CARL':      { type: 'line', range: 500, width: 40,  color: 'rgba(255,255,255,0.3)' },
    'COLETTE':   { type: 'line', range: 600, width: 40,  color: 'rgba(255,255,255,0.3)' },

    // --- THROWERS (Lobs) ---
    'BARLEY':    { type: 'lob',  range: 550, radius: 60, color: 'rgba(255,255,255,0.4)' },
    'DYNAMIKE':  { type: 'lob',  range: 500, radius: 50, color: 'rgba(255,255,255,0.4)' },
    'TICK':      { type: 'lob',  range: 600, radius: 70, color: 'rgba(255,255,255,0.4)' },
    'SPROUT':    { type: 'lob',  range: 600, radius: 50, color: 'rgba(255,255,255,0.4)' },
    'MR. P':     { type: 'lob',  range: 550, radius: 50, color: 'rgba(255,255,255,0.4)' },
    'SPIKE':     { type: 'lob',  range: 500, radius: 60, color: 'rgba(255,255,255,0.4)' }, // Spike is tech a lob-like projectile

    // --- MELEE / SPECIAL ---
    'EL PRIMO':  { type: 'line', range: 180, width: 50,  color: 'rgba(255,255,255,0.3)' },
    'MORTIS':    { type: 'line', range: 250, width: 50,  color: 'rgba(255,255,255,0.3)' }, // Dash range
    'JACKY':     { type: 'area', range: 150, color: 'rgba(255,255,255,0.3)' } // Circle around self
};

// Default fallback
const DEFAULT_RETICLE = { type: 'line', range: 400, width: 20, color: 'rgba(255,255,255,0.3)' };

/**
 * Main function to call from Game Loop
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Object} player The player entity
 * @param {Object} game The game instance (for walls/camera)
 * @param {number} mx Mouse X (Screen space)
 * @param {number} my Mouse Y (Screen space)
 */
export function drawReticle(ctx, player, game, mx, my) {
    if (!player || player.hp <= 0) return;

    const name = player.data.name.toUpperCase();
    const config = RETICLE_CONFIG[name] || DEFAULT_RETICLE;

    // Convert Player Position to Screen Space
    const px = player.x + 20 - game.camera.x;
    const py = player.y + 20 - game.camera.y;

    // Calculate Angle
    const angle = Math.atan2(my - py, mx - px);

    ctx.save();
    
    // Choose drawing method based on type
    if (config.type === 'line') {
        drawLineReticle(ctx, px, py, angle, config, game);
    } else if (config.type === 'cone') {
        drawConeReticle(ctx, px, py, angle, config, game);
    } else if (config.type === 'lob') {
        drawLobReticle(ctx, px, py, angle, config, game, mx, my);
    } else if (config.type === 'area') {
        drawAreaReticle(ctx, px, py, config);
    }

    ctx.restore();
}

/**
 * Draws a straight line that stops at walls (Raycasting)
 */
function drawLineReticle(ctx, px, py, angle, config, game) {
    // 1. Calculate max end point
    const maxDist = config.range;
    
    // 2. Raycast to find actual end point (Collision check)
    // We cast a ray from the player's world position
    const worldPx = px + game.camera.x;
    const worldPy = py + game.camera.y;
    
    const dist = castRay(worldPx, worldPy, angle, maxDist, game.walls);

    // 3. Draw the Line
    ctx.translate(px, py);
    ctx.rotate(angle);

    // Create Gradient Fade (Solid -> Transparent)
    const grad = ctx.createLinearGradient(0, 0, dist, 0);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.4)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)'); // Fade out at tip

    ctx.fillStyle = grad;
    
    // Draw a rounded rectangle for the beam
    const w = config.width || 30;
    ctx.beginPath();
    ctx.rect(0, -w/2, dist, w);
    ctx.fill();

    // Add white border for visibility
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -w/2);
    ctx.lineTo(dist, -w/2);
    // End Cap
    if (dist < maxDist) {
        // Hit a wall - flat cap
        ctx.lineTo(dist, w/2);
    } else {
        // Max range - curved cap or open
        ctx.quadraticCurveTo(dist + 10, 0, dist, w/2);
    }
    ctx.lineTo(0, w/2);
    ctx.stroke();
}

/**
 * Draws a Cone/Fan shape that respects walls
 */
function drawConeReticle(ctx, px, py, angle, config, game) {
    const rays = 10; // Resolution of the cone (higher = smoother)
    const halfAngle = (config.angle || 0.5) / 2;
    const maxDist = config.range;
    const worldPx = px + game.camera.x;
    const worldPy = py + game.camera.y;

    // We build a polygon by casting multiple rays
    const points = [];
    points.push({x: 0, y: 0}); // Start at player center (relative)

    // Cast rays across the arc
    for (let i = -rays; i <= rays; i++) {
        const rayAngle = angle + (i / rays) * halfAngle;
        const dist = castRay(worldPx, worldPy, rayAngle, maxDist, game.walls);
        
        // Convert back to relative drawing coordinates (unrotated)
        // Note: We will rotate the context to the main angle, so we need relative offsets
        // Actually, easier to calculate relative to 0,0 then rotate
        const relAngle = (i / rays) * halfAngle; // Relative to main angle
        points.push({
            x: Math.cos(relAngle) * dist,
            y: Math.sin(relAngle) * dist
        });
    }

    ctx.translate(px, py);
    ctx.rotate(angle);

    // DRAW FILL (Gradient Fade)
    const grad = ctx.createRadialGradient(0, 0, 50, 0, 0, maxDist);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');   // Center solid
    grad.addColorStop(0.8, 'rgba(255, 255, 255, 0.2)'); // Outer fade
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');   // Tips clear

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for(let p of points) ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.fill();

    // DRAW OUTLINE (Solid White Sides)
    ctx.strokeStyle = 'rgba(255,255,255, 0.9)';
    ctx.lineWidth = 3;
    
    // Top Edge
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(points[1].x, points[1].y); // First ray point
    ctx.stroke();

    // Bottom Edge
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(points[points.length-1].x, points[points.length-1].y); // Last ray point
    ctx.stroke();

    // Arc Edge (Faint)
    ctx.strokeStyle = 'rgba(255,255,255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[1].x, points[1].y);
    for(let i=2; i<points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
}

/**
 * Draws the Thrower style (Line to Circle)
 * Follows mouse, ignores walls, clamps to max range
 */
function drawLobReticle(ctx, px, py, angle, config, game, mx, my) {
    const maxDist = config.range;
    
    // Calculate distance to mouse
    const dx = mx - px;
    const dy = my - py;
    let dist = Math.hypot(dx, dy);

    // Clamp distance to max range
    if (dist > maxDist) dist = maxDist;

    // Draw Connector Line (Dotted or Faint)
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 10]); // Dotted line
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(dist, 0);
    ctx.stroke();
    ctx.restore();

    // Draw Target Circle
    // Calculate circle center based on clamped distance
    const cx = px + Math.cos(angle) * dist;
    const cy = py + Math.sin(angle) * dist;
    const r = config.radius || 50;

    // Circle Gradient (Solid border, Clear center)
    const grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.0)');   // Inner Clear
    grad.addColorStop(0.8, 'rgba(255, 255, 255, 0.3)'); // Mid
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.8)');   // Edge Solid

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.fill();

    // Solid White Ring
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.stroke();

    // Small 'X' or Dot at exact center
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI*2);
    ctx.fill();
}

/**
 * Draws a simple circle around player (Jacky/Emz)
 */
function drawAreaReticle(ctx, px, py, config) {
    const r = config.range;
    
    const grad = ctx.createRadialGradient(px, py, r * 0.5, px, py, r);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.0)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.4)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI*2);
    ctx.fill();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI*2);
    ctx.stroke();
}

/**
 * RAYCASTING LOGIC
 * Shoots a ray from (x,y) at (angle) and returns distance to nearest wall or maxDist
 */
function castRay(startX, startY, angle, maxDist, walls) {
    // Optimization: Check coarse grid or step
    // Since we need pixel-ish precision for the laser look, we will do a line-rect intersection
    
    const endX = startX + Math.cos(angle) * maxDist;
    const endY = startY + Math.sin(angle) * maxDist;

    let closestDist = maxDist;

    // Define the Ray as a Line Segment P1 -> P2
    const p1 = { x: startX, y: startY };
    const p2 = { x: endX, y: endY };

    // Iterate all walls (Optimization: Only check walls nearby if we had a spatial grid)
    for (let w of walls) {
        // Only check solid walls
        if (w.type !== 'wall' && w.type !== 'bedrock' && w.type !== 'box') continue;

        // Check intersection between Ray and Wall Rectangle
        const hit = lineRectIntersect(p1, p2, w);
        if (hit) {
            const d = Math.hypot(hit.x - startX, hit.y - startY);
            if (d < closestDist) {
                closestDist = d;
            }
        }
    }

    return closestDist;
}

/**
 * Math helper: Intersection between Line (p1-p2) and Rectangle (r)
 */
function lineRectIntersect(p1, p2, r) {
    // Check intersection with all 4 sides of the rect
    // Top
    const top = lineLineIntersect(p1, p2, {x:r.x, y:r.y}, {x:r.x+r.w, y:r.y});
    // Bottom
    const bot = lineLineIntersect(p1, p2, {x:r.x, y:r.y+r.h}, {x:r.x+r.w, y:r.y+r.h});
    // Left
    const left = lineLineIntersect(p1, p2, {x:r.x, y:r.y}, {x:r.x, y:r.y+r.h});
    // Right
    const right = lineLineIntersect(p1, p2, {x:r.x+r.w, y:r.y}, {x:r.x+r.w, y:r.y+r.h});

    // Find closest hit
    let minD = Infinity;
    let closest = null;

    [top, bot, left, right].forEach(pt => {
        if (pt) {
            const d = (pt.x - p1.x)**2 + (pt.y - p1.y)**2;
            if (d < minD) {
                minD = d;
                closest = pt;
            }
        }
    });

    return closest;
}

/**
 * Standard Line-Line Intersection formula
 */
function lineLineIntersect(line1Start, line1End, line2Start, line2End) {
    const x1 = line1Start.x, y1 = line1Start.y;
    const x2 = line1End.x, y2 = line1End.y;
    const x3 = line2Start.x, y3 = line2Start.y;
    const x4 = line2End.x, y4 = line2End.y;

    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return null; // Parallel

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
        return {
            x: x1 + ua * (x2 - x1),
            y: y1 + ua * (y2 - y1)
        };
    }
    return null;
}
