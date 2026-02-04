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

    { id: 10, icon: '🦎', name: "LEON", hp: 3200, speed: 3.2, rarity: 'legendary',
      atk: { dmg: 440, count: 4, range: 600, spread: 0.2, reload: 55, type: 'cone' },
      sup: { type: 'invis', duration: 300, charge: 100 },
      desc: "Sneaky lizard. Goes invisible." },

    { id: 11, icon: '🧨', name: "DYNAMIKE", hp: 5600, speed: 2.9, rarity: 'rare',
      atk: { dmg: 1600, count: 2, range: 500, spread: 0.3, reload: 70, type: 'lob' },
      sup: { type: 'bomb', dmg: 4400, range: 500, break: true, charge: 110 },
      desc: "Lobs dynamite sticks. Super is a massive bomb." },

    { id: 12, icon: '🦅', name: "BO", hp: 7200, speed: 3.0, rarity: 'common',
      atk: { dmg: 1200, count: 3, range: 650, spread: 0.25, reload: 60, type: 'spread' },
      sup: { type: 'mines', dmg: 2000, count: 3, range: 500, charge: 130 },
      desc: "Shoots 3 explosive arrows. Super hides mines." },

    { id: 13, icon: '💣', name: "TICK", hp: 4400, speed: 2.9, rarity: 'common',
      atk: { dmg: 1280, count: 3, range: 600, spread: 0.4, reload: 80, type: 'lob_mines' },
      sup: { type: 'head', hp: 3200, dmg: 4000, speed: 4.5, charge: 100 },
      desc: "Lobs mines. Super detaches his head to seek enemies." },

    { id: 14, icon: '👾', name: "8-BIT", hp: 10000, speed: 2.4, rarity: 'common',
      atk: { dmg: 640, count: 6, range: 700, spread: 0.05, reload: 60, type: 'line' },
      sup: { type: 'turret_dmg', hp: 6000, range: 400, charge: 150 },
      desc: "Very slow but high damage. Super boosts damage." },

    { id: 15, icon: '🌫️', name: "EMZ", hp: 7200, speed: 3.0, rarity: 'common',
      atk: { dmg: 1000, count: 1, range: 450, width: 100, reload: 55, type: 'cloud' },
      sup: { type: 'slow_circle', dmg: 400, range: 400, charge: 140 },
      desc: "Sprays hairspray. Super slows enemies around her." },

    { id: 16, icon: '🤼', name: "EL PRIMO", hp: 12000, speed: 3.4, rarity: 'rare',
      atk: { dmg: 600, count: 4, range: 200, width: 50, reload: 40, type: 'punch' },
      sup: { type: 'meteor_jump', dmg: 1600, range: 500, break: true, charge: 90 },
      desc: "Punches fast. Super jumps and crashes down." },

    { id: 17, icon: '🍾', name: "BARLEY", hp: 4800, speed: 2.9, rarity: 'rare',
      atk: { dmg: 1400, count: 1, range: 550, reload: 60, type: 'puddle' },
      sup: { type: 'puddle_rain', dmg: 1400, count: 5, range: 600, charge: 120 },
      desc: "Throws bottles that leave burning puddles." },

    { id: 18, icon: '🎸', name: "POCO", hp: 7400, speed: 3.0, rarity: 'rare',
      atk: { dmg: 1200, count: 1, range: 550, width: 120, reload: 55, type: 'wave' },
      sup: { type: 'heal_wave', hp: 4200, range: 600, charge: 110 },
      desc: "Wide music wave attack. Super heals allies." },

    { id: 19, icon: '🥊', name: "ROSA", hp: 10800, speed: 3.2, rarity: 'rare',
      atk: { dmg: 760, count: 3, range: 220, width: 70, reload: 45, type: 'punch' },
      sup: { type: 'shield', duration: 300, reduce: 0.7, charge: 100 },
      desc: "Boxing botanist. Super gives a tough shield." },

    { id: 20, icon: '🤖', name: "RICO", hp: 5600, speed: 3.0, rarity: 'super_rare',
      atk: { dmg: 640, count: 5, range: 650, spread: 0.1, reload: 45, bounce: true, type: 'line' },
      sup: { dmg: 640, count: 12, range: 850, bounce: true, charge: 130, type: 'line' },
      desc: "Bullets bounce off walls. Super shoots a long volley." }
];
