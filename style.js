/* RESET & LAYOUT */
body { 
    margin: 0; 
    padding: 0; 
    overflow: hidden; 
    background: #000; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    height: 100vh; 
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
    user-select: none; 
}

/* GAME CONTAINER (Fixed 16:9 aspect ratio) */
#game-wrapper {
    position: relative;
    width: 100vw; 
    height: 56.25vw;
    max-height: 100vh; 
    max-width: 177.78vh;
    background: #151515;
    box-shadow: 0 0 50px rgba(0,0,0,1);
}

canvas { 
    width: 100%; 
    height: 100%; 
    display: block; 
    image-rendering: pixelated; 
}

/* UI LAYER */
#ui-layer { 
    position: absolute; 
    top: 0; 
    left: 0; 
    width: 100%; 
    height: 100%; 
    pointer-events: none; 
}

/* MENUS */
.screen {
    pointer-events: auto; 
    position: absolute; 
    top: 0; 
    left: 0; 
    width: 100%; 
    height: 100%;
    background: rgba(20, 20, 30, 0.95);
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    justify-content: center;
    z-index: 20;
}

.hidden { display: none !important; }

h1 { 
    color: #f1c40f; 
    font-size: 5vw; 
    margin: 0; 
    text-shadow: 4px 4px 0 #000; 
    -webkit-text-stroke: 2px black; 
}

h2 { color: #fff; font-size: 2vw; margin-bottom: 20px; }

/* BUTTONS */
.btn {
    background: linear-gradient(#3498db, #2980b9); 
    border: 2px solid white; 
    border-radius: 8px;
    padding: 1vw 3vw; 
    font-size: 1.5vw; 
    color: white; 
    cursor: pointer; 
    font-weight: bold;
    box-shadow: 0 0.5vw 0 #1a5276; 
    margin: 10px; 
    text-transform: uppercase;
}

.btn:active { transform: translateY(4px); box-shadow: 0 0 0; }
.btn-yel { background: linear-gradient(#f1c40f, #f39c12); box-shadow: 0 0.5vw 0 #d35400; color: black; }
.btn-red { background: linear-gradient(#e74c3c, #c0392b); box-shadow: 0 0.5vw 0 #922b21; }

/* SELECTION GRID */
.grid { 
    display: grid; 
    grid-template-columns: repeat(5, 1fr); 
    gap: 1vw; 
    padding: 20px; 
    background: rgba(0,0,0,0.5); 
    border-radius: 10px; 
}

.card {
    width: 6vw; 
    height: 7vw; 
    background: #333; 
    border: 3px solid #555; 
    border-radius: 8px;
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    justify-content: center;
    cursor: pointer;
}

.card.selected { border-color: #f1c40f; box-shadow: 0 0 15px #f1c40f; background: #444; }
.emoji-preview { font-size: 3.5vw; line-height: 1; }

/* HUD ELEMENTS */
#hud { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: none; }

#super-btn {
    position: absolute; 
    bottom: 8%; 
    right: 8%; 
    width: 10vw; 
    height: 10vw;
    border-radius: 50%; 
    background: rgba(0,0,0,0.5); 
    border: 4px solid #777;
    pointer-events: auto; 
    display: flex; 
    align-items: center; 
    justify-content: center;
    font-size: 1.8vw; 
    color: #aaa; 
    font-weight: bold;
}

#super-btn.ready {
    background: radial-gradient(#ffff00, #ff8800); 
    border-color: white; 
    color: black; 
    animation: pulse 1s infinite; 
    box-shadow: 0 0 30px #ffcc00;
}

@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }

#ammo-bar-container { position: absolute; bottom: 18%; right: 22%; width: 12vw; height: 1.5vw; display: flex; gap: 4px; }
.ammo-slot { flex: 1; background: #444; border: 2px solid black; }
.ammo-filled { background: #e67e22; height: 100%; width: 100%; transition: width 0.1s; }

#kill-feed { position: absolute; top: 20px; left: 20px; color: white; font-size: 1.2vw; }
#game-info { position: absolute; top: 10px; width: 100%; text-align: center; color: white; font-size: 2vw; font-weight: bold; }
