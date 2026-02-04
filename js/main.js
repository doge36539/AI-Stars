// js/main.js

// 1. IMPORT YOUR DATA
import { BRAWLERS } from './data/brawler.js'; 

window.onload = () => {
    const btnSolo = document.getElementById('btn-showdown');
    const btn3v3 = document.getElementById('btn-knockout');

    if (btnSolo) {
        btnSolo.onclick = () => {
            document.getElementById('screen-home').style.display = 'none';
            document.getElementById('screen-select').classList.remove('hidden');
            
            // 2. RUN THE DRAWING FUNCTION
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

// 3. THE DRAWING FUNCTION
function renderBrawlers() {
    const grid = document.getElementById('grid');
    if (!grid) return;

    grid.innerHTML = ''; // Clear anything already there

    // Loop through your Shelly, Nita, Colt list
    BRAWLERS.forEach(b => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div style="font-size:50px;">${b.icon}</div>
            <div style="color:white; font-size:14px; font-weight:bold;">${b.name}</div>
        `;
        
        // When you click a brawler
        card.onclick = () => {
            document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            
            // Show their description
            document.getElementById('brawler-desc').innerText = b.desc;
            
            // Enable the Play Button
            const playBtn = document.getElementById('play-btn');
            playBtn.disabled = false;
            playBtn.style.opacity = "1";
        };
        
        grid.appendChild(card);
    });
}
