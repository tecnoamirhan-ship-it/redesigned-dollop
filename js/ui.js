export class UI {
    constructor(game) {
        this.game = game;
        this.messageTimeout = null;
    }
    
    updateHUD() {
        const player = this.game.player;
        const hpPct = (player.data.hp / player.data.maxHp) * 100;
        const xpPct = (player.data.xp / (player.data.level * 100)) * 100;
        
        document.getElementById('hpBar').style.width = hpPct + '%';
        document.getElementById('hpText').textContent = `${player.data.hp}/${player.data.maxHp}`;
        document.getElementById('xpBar').style.width = xpPct + '%';
        document.getElementById('xpText').textContent = `${player.data.xp}/${player.data.level * 100}`;
        document.getElementById('coinAmount').textContent = player.data.coins;
        document.getElementById('levelNum').textContent = player.data.level;
    }
    
    showMessage(text, type = '') {
        const log = document.getElementById('messageLog');
        const msg = document.createElement('div');
        msg.className = 'message ' + type;
        msg.textContent = text;
        log.appendChild(msg);
        
        // Удаление после анимации
        setTimeout(() => {
            if (msg.parentNode) msg.parentNode.removeChild(msg);
        }, 2600);
        
        // Ограничение количества сообщений
        while (log.children.length > 6) {
            log.removeChild(log.firstChild);
        }
    }
    
    flashDamage() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(255, 0, 0, 0.2);
            z-index: 20;
            pointer-events: none;
            transition: opacity 0.3s;
        `;
        document.body.appendChild(overlay);
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        }, 50);
    }
    
    updateMinimap() {
        const canvas = document.getElementById('minimapCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.clearRect(0, 0, w, h);
        
        // Фон
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, w, h);
        
        // Центр карты
        const cx = w / 2;
        const cy = h / 2;
        const scale = 2.8;
        
        // Враги
        ctx.fillStyle = '#ff4444';
        this.game.enemyManager.enemies.forEach(e => {
            if (!e.alive) return;
            const ex = cx + e.position.x * scale;
            const ey = cy + e.position.z * scale;
            ctx.fillRect(ex - 2, ey - 2, 4, 4);
        });
        
        // Монеты
        ctx.fillStyle = '#ffd700';
        this.game.coinManager.coins.forEach(c => {
            const mx = cx + c.position.x * scale;
            const my = cy + c.position.z * scale;
            ctx.fillRect(mx - 1, my - 1, 2, 2);
        });
        
        // Игрок
        ctx.fillStyle = '#00ff88';
        const px = cx + this.game.player.position.x * scale;
        const py = cy + this.game.player.position.z * scale;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Направление игрока
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px, py);
        const dirX = px + Math.sin(this.game.player.yaw) * 8;
        const dirY = py - Math.cos(this.game.player.yaw) * 8;
        ctx.lineTo(dirX, dirY);
        ctx.stroke();
        
        // Границы
        ctx.strokeStyle = '#444';
        ctx.strokeRect(0, 0, w, h);
    }
}
