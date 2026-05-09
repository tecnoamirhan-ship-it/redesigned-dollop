import { shopItems } from './shopData.js';

export class Shop {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.items = shopItems;
    }
    
    toggle() {
        this.isOpen = !this.isOpen;
        const panel = document.getElementById('shopPanel');
        panel.classList.toggle('hidden', !this.isOpen);
        
        if (this.isOpen) {
            this.game.isPaused = true;
            document.exitPointerLock();
            this.renderItems();
        } else {
            this.game.isPaused = false;
        }
    }
    
    renderItems() {
        const container = document.getElementById('shopItems');
        const player = this.game.player;
        
        container.innerHTML = this.items.map((item, index) => {
            const canBuy = player.data.coins >= item.price;
            return `
                <div class="shop-item">
                    <div>
                        <div class="item-name">${item.icon} ${item.name}</div>
                        <div class="item-stat">${item.description}</div>
                    </div>
                    <div class="item-price">${item.price} 🪙</div>
                    <button 
                        ${!canBuy ? 'disabled' : ''} 
                        onclick="window.buyItem(${index})"
                    >
                        ${canBuy ? 'Купить' : 'Недостаточно'}
                    </button>
                </div>
            `;
        }).join('');
        
        document.getElementById('shopCoinDisplay').textContent = player.data.coins;
    }
    
    buyItem(index) {
        const item = this.items[index];
        const player = this.game.player;
        
        if (player.data.coins < item.price) return;
        
        player.data.coins -= item.price;
        
        // Применение эффекта
        switch (item.type) {
            case 'potion_hp':
                player.data.hp = Math.min(player.data.maxHp, player.data.hp + item.effect);
                this.game.showMessage(`🧪 +${item.effect} HP`, 'heal');
                break;
            case 'potion_full':
                player.data.hp = player.data.maxHp;
                this.game.showMessage(`🧪 Полное восстановление HP!`, 'heal');
                break;
            case 'weapon':
                player.data.attack += item.effect;
                this.game.showMessage(`⚔️ Атака +${item.effect}!`, 'loot');
                break;
            case 'armor':
                player.data.defense += item.effect;
                this.game.showMessage(`🛡️ Защита +${item.effect}!`, 'loot');
                break;
            case 'speed':
                player.data.speed += item.effect;
                player.moveSpeed = player.data.speed;
                this.game.showMessage(`💨 Скорость +${item.effect}!`, 'loot');
                break;
            case 'crit':
                player.data.critChance += item.effect;
                this.game.showMessage(`🎯 Крит.шанс +${item.effect}%!`, 'loot');
                break;
        }
        
        this.game.ui.updateHUD();
        this.game.saveGame();
        this.renderItems();
    }
}

// Глобальная функция для кнопок
window.buyItem = (index) => window.game.shop.buyItem(index);
