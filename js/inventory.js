export class Inventory {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.slots = 8;
        this.items = [];
    }
    
    toggle() {
        this.isOpen = !this.isOpen;
        const panel = document.getElementById('inventoryPanel');
        panel.classList.toggle('hidden', !this.isOpen);
        
        if (this.isOpen) {
            this.game.isPaused = true;
            document.exitPointerLock();
            this.render();
        } else {
            this.game.isPaused = false;
        }
    }
    
    addItem(item) {
        if (this.items.length < this.slots) {
            this.items.push(item);
            return true;
        }
        return false;
    }
    
    removeItem(index) {
        if (index >= 0 && index < this.items.length) {
            this.items.splice(index, 1);
            return true;
        }
        return false;
    }
    
    render() {
        const container = document.getElementById('inventorySlots');
        const player = this.game.player;
        
        let html = '';
        
        // Показываем экипированные предметы (всегда сверху)
        html += `
            <div class="inv-slot equipped">
                <div class="item-info">
                    <div class="item-name">🗡️ Оружие</div>
                    <div class="item-stat">Атака: ${player.data.attack}</div>
                </div>
                <span style="color:#44ff44;">Экипировано</span>
            </div>
            <div class="inv-slot equipped">
                <div class="item-info">
                    <div class="item-name">🛡️ Броня</div>
                    <div class="item-stat">Защита: ${player.data.defense}</div>
                </div>
                <span style="color:#44ff44;">Экипировано</span>
            </div>
        `;
        
        // Обычные предметы
        if (this.items.length === 0) {
            html += '<div class="inv-slot" style="color:#555;">Пусто</div>'.repeat(4);
        } else {
            this.items.forEach((item, index) => {
                html += `
                    <div class="inv-slot">
                        <div class="item-info">
                            <div class="item-name">${item.icon || '📦'} ${item.name}</div>
                            <div class="item-stat">${item.description || ''}</div>
                        </div>
                        <button onclick="window.useItem(${index})">Исп.</button>
                    </div>
                `;
            });
        }
        
        container.innerHTML = html;
        document.getElementById('invAtk').textContent = player.data.attack;
        document.getElementById('invDef').textContent = player.data.defense;
    }
}

window.useItem = (index) => window.game.inventory.useItem(index);
