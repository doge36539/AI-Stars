// js/main.js

// 1. IMPORT YOUR DATA (Crucial!)
import { BRAWLERS } from './data/brawler.js'; 

window.onload = () => {
    const btnSolo = document.getElementById('btn-showdown');
    const btn3v3 = document.getElementById('btn-knockout');

    if (btnSolo) {
        btnSolo.onclick = () => {
            document.getElementById('screen-home').style.display = 'none';
            document.getElementById('screen-select').classList.remove('hidden');
            
            // 2. BUILD THE GRID
            renderBrawlers();
        };
    }

    if (btn3v3) {
        btn3v3.onclick = () => {
            document.getElementById('screen-home').style.display = 'none';
            document.getElementById('screen-select').classList.remove('hidden');
            renderBrawlers();
        };
    }
};

// 3. THE "BUILDER" FUNCTION
function renderBrawlers() {
    const grid = document.getElementById('grid');
    if (!grid) return;

    grid.innerHTML = ''; // Clear the grid first

    // Look at your BRAWLERS list and make a card for each one
    BRAWLERS.forEach(brawler => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div style="font-size:50px;">${brawler.icon}</div>
            <div style="color:white; font-size:14px; font-weight:bold;">${brawler.name}</div>
        `;
        
        // When you click a brawler icon
        card.onclick = () => {
            // Remove "selected" look from everyone else
            document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
            // Add "selected" look to this one
            card.classList.add('selected');
            
            // Show the description you wrote in brawler.js
            document.getElementById('brawler-desc').innerText = brawler.desc;
            
            // Enable the BRAWL button
            const playBtn = document.getElementById('play-btn');
            playBtn.disabled = false;
            playBtn.style.opacity = "1";
        };
        
        grid.appendChild(card);
    });
}
