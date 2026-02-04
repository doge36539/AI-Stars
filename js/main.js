// js/main.js
import { BRAWLERS } from './data/brawler.js'; 

// 1. Force the button to unlock IMMEDIATELY when the page loads
window.onload = () => {
    const playBtn = document.getElementById('play-btn');
    
    if (playBtn) {
        // VISUAL PROOF: Change the text so we know JS found it
        playBtn.innerText = "JS CONNECTED!"; 
        playBtn.disabled = false; // Force unlock
        playBtn.style.opacity = "1";
        
        playBtn.onclick = () => {
            alert("GAME STARTING!");
            // If you see this alert, the button is fixed.
            // We can then add the game code back.
        };
    } else {
        alert("FATAL ERROR: Could not find button with id='play-btn'");
    }

    // Connect the other buttons too
    const btnSolo = document.getElementById('btn-showdown');
    if (btnSolo) {
        btnSolo.onclick = () => {
            document.getElementById('screen-home').style.display = 'none';
            document.getElementById('screen-select').classList.remove('hidden');
            document.getElementById('screen-select').style.display = 'flex';
            renderBrawlers();
        };
    }
};

function renderBrawlers() {
    const grid = document.getElementById('grid');
    if(grid) {
        grid.innerHTML = '';
        BRAWLERS.forEach(b => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<div style="font-size:40px;">${b.icon}</div>`;
            card.onclick = () => {
                alert("You picked " + b.name);
            };
            grid.appendChild(card);
        });
    }
}
