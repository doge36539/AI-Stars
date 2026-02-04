// js/classes/Particle.js

export class Particle {
    constructor(x, y, text, color, isText = false) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.isText = isText;
        this.life = 1.0; // Opacity from 1 to 0
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = isText ? -2 : (Math.random() - 0.5) * 4;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.02; // Fades out over 50 frames
    }

    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life);
        
        if (this.isText) {
            ctx.fillStyle = this.color;
            ctx.font = 'bold 20px sans-serif';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.strokeText(this.text, this.x, this.y);
            ctx.fillText(this.text, this.x, this.y);
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, 5, 5);
        }
        
        ctx.globalAlpha = 1.0;
    }
}
