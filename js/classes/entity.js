export class Entity {
    constructor(data, x, y, team, isPlayer, gameInstance) {
        this.data = data;
        this.x = x; this.y = y;
        this.team = team;
        this.isPlayer = isPlayer;
        this.game = gameInstance;
        this.hp = data.hp;
        this.maxHp = data.hp;
        this.vx = 0; this.vy = 0;
    }

    update() {
        if (this.isPlayer) {
            this.vx = 0; this.vy = 0;
            if (this.game.keys['w']) this.vy = -this.data.speed;
            if (this.game.keys['s']) this.vy = this.data.speed;
            if (this.game.keys['a']) this.vx = -this.data.speed;
            if (this.game.keys['d']) this.vx = this.data.speed;
        }
        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx) {
        ctx.font = '40px serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.data.icon, this.x, this.y);
        
        // Health Bar
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 30, this.y - 50, 60, 6);
        ctx.fillStyle = 'lime';
        ctx.fillRect(this.x - 30, this.y - 50, (this.hp / this.maxHp) * 60, 6);
    }
}
