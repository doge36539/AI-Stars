// js/data/brawlers.js
export const BRAWLERS = [
    { id: 0, icon: '🔫', name: "SHELLY", hp: 11000, speed: 2.8, rarity: 'common', 
      atk: { dmg: 420, count: 5, range: 400, spread: 0.5, reload: 60, type: 'cone' },
      sup: { dmg: 450, count: 9, range: 450, push: 15, break: true, charge: 100 },
      desc: "Super destroys walls and knocks enemies back." },  

    { id: 1, icon: '🐻', name: "NITA", hp: 8000, speed: 3.0, rarity: 'common',
      atk: { dmg: 1920, count: 1, range: 320, width: 60, reload: 45, type: 'pierce' },
      sup: { type: 'spawn', hp: 8000, dmg: 800, charge: 120 },
      desc: "Shockwave pierces. Bear hunts enemies." },

    { id: 2, icon: '🤠', name: "COLT", hp: 5600, speed: 3.0, rarity: 'uncommon',
      atk: { dmg: 540, count: 6, range: 600, spread: 0.05, reload: 50, delay: 5, type: 'line' },
      sup: { dmg: 540, count: 12, range: 750, break: true, charge: 140, type: 'line' },
      desc: "Bursts of bullets. Super breaks walls." },

    { id: 3, icon: '🐂', name: "BULL", hp: 10000, speed: 3.1, rarity: 'uncommon',
      atk: { dmg: 880, count: 5, range: 250, spread: 0.4, reload: 65, type: 'cone' },
      sup: { type: 'charge', dmg: 1600, range: 600, speed: 12, charge: 90, break: true },
      desc: "High HP shotgunner. Super charges through walls." },

    { id: 4, icon: '☂️', name: "PIPER", hp: 4800, speed: 2.9, rarity: 'epic',
      atk: { dmg: 3400, count: 1, range: 800, reload: 90, type: 'sniper' },
      sup: { type: 'jump', dmg: 1800, range: 400, charge: 130 },
      desc: "Deals more damage at max range. Super escapes." },

    { id: 5, icon: '🧟', name: "FRANK", hp: 14000, speed: 3.1, rarity: 'epic',
      atk: { dmg: 2480, count: 1, range: 380, width: 80, reload: 45, stop: true, delay: 30, type: 'wave' },
      sup: { dmg: 2480, range: 420, width: 90, stun: 120, stop: true, delay: 45, charge: 100, type: 'wave_super', break:true },
      desc: "Stops to attack. Super stuns and breaks walls." },

    { id: 6, icon: '🦇', name: "MORTIS", hp: 7600, speed: 3.6, rarity: 'mythic',
      atk: { dmg: 1880, range: 250, reload: 100, type: 'dash' },
      sup: { type: 'lifesteal', dmg: 1800, range: 500, charge: 120 },
      desc: "Dashes to move. Super heals himself." },

    { id: 7, icon: '🔮', name: "TARA", hp: 6400, speed: 3.0, rarity: 'mythic',
      atk: { dmg: 960, count: 3, range: 480, spread: 0.15, reload: 65, type: 'pierce' },
      sup: { type: 'blackhole', dmg: 1600, range: 250, charge: 140 },
      desc: "Cards pierce enemies. Super pulls them together." },

    { id: 8, icon: '🌵', name: "SPIKE", hp: 4800, speed: 2.9, rarity: 'legendary',
      atk: { dmg: 1540, range: 500, reload: 60, type: 'spike' },
      sup: { type: 'slow_field', dmg: 800, range: 350, charge: 110 },
      desc: "Grenade splits into needles. Super slows." },

    { id: 9, icon: '🐦', name: "CROW", hp: 4800, speed: 3.6, rarity: 'legendary',
      atk: { dmg: 640, count: 3, range: 520, spread: 0.3, reload: 50, type: 'poison' },
      sup: { type: 'crow_jump', dmg: 640, range: 450, charge: 150 },
      desc: "Poisons enemies. Super jumps (launches/lands daggers)." },

        { id: 9, icon: '🐦', name: "CROW", hp: 4800, speed: 3.6, rarity: 'legendary',
      atk: { dmg: 640, count: 3, range: 520, spread: 0.3, reload: 50, type: 'poison' },
      sup: { type: 'crow_jump', dmg: 640, range: 450, charge: 150 },
      desc: "Poisons enemies. Super jumps (launches/lands daggers)." },
];
