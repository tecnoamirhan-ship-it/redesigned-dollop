import * as THREE from 'three';
import { Player } from './player.js';
import { World } from './world.js';
import { EnemyManager } from './enemies.js';
import { Shop } from './shop.js';
import { Inventory } from './inventory.js';
import { CoinManager } from './coins.js';
import { UI } from './ui.js';

// ==================== ОСНОВНОЙ КЛАСС ИГРЫ ====================
class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.Fog(0x1a1a2e, 30, 80);
        
        // Камера
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.5, 100);
        this.camera.position.set(0, 6, 10);
        
        // Рендерер
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('gameCanvas'),
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Освещение
        this.setupLights();
        
        // Инициализация систем
        this.player = new Player(this);
        this.world = new World(this);
        this.enemyManager = new EnemyManager(this);
        this.coinManager = new CoinManager(this);
        this.shop = new Shop(this);
        this.inventory = new Inventory(this);
        this.ui = new UI(this);
        
        // Состояние
        this.isPaused = false;
        this.gameTime = 0;
        this.pointerLocked = false;
        
        // Загрузка сохранения
        this.loadGame();
        
        // Обработчики
        this.setupEventListeners();
        
        // Запуск игрового цикла
        this.animate();
    }
    
    setupLights() {
        // Окружающий свет
        const ambient = new THREE.AmbientLight(0x404060, 1.2);
        this.scene.add(ambient);
        
        // Направленный свет (солнце/луна)
        const dirLight = new THREE.DirectionalLight(0xffeedd, 2.5);
        dirLight.position.set(20, 30, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.near = 1;
        dirLight.shadow.camera.far = 60;
        dirLight.shadow.camera.left = -30;
        dirLight.shadow.camera.right = 30;
        dirLight.shadow.camera.top = 30;
        dirLight.shadow.camera.bottom = -30;
        this.scene.add(dirLight);
        
        // Точечные огни (факелы)
        const torchColors = [0xff8844, 0xffaa44, 0xff6622];
        for (let i = 0; i < 6; i++) {
            const torch = new THREE.PointLight(torchColors[i % 3], 3, 12);
            torch.position.set(
                (Math.random() - 0.5) * 30,
                1.5,
                (Math.random() - 0.5) * 30
            );
            this.scene.add(torch);
        }
    }
    
    setupEventListeners() {
        // Resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Pointer Lock для FPS-управления
        const canvas = this.renderer.domElement;
        canvas.addEventListener('click', () => {
            if (!this.pointerLocked) {
                canvas.requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.pointerLocked = document.pointerLockElement === canvas;
            if (!this.pointerLocked && !this.isPaused) {
                this.showMessage('Нажмите на экран для управления', 'info');
            }
        });
        
        // Мышь
        document.addEventListener('mousemove', (e) => {
            if (this.pointerLocked && !this.isPaused) {
                this.player.onMouseMove(e.movementX, e.movementY);
            }
        });
        
        // Клавиатура
        document.addEventListener('keydown', (e) => {
            if (this.isPaused && e.key !== 'b' && e.key !== 'i' && e.key !== 'B' && e.key !== 'I') return;
            this.player.onKeyDown(e.key.toLowerCase());
            
            if (e.key.toLowerCase() === 'b') toggleShop();
            if (e.key.toLowerCase() === 'i') toggleInventory();
            if (e.key.toLowerCase() === 'e') this.pickupNearby();
            if (e.key === ' ') {
                e.preventDefault();
                this.player.attack();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.player.onKeyUp(e.key.toLowerCase());
        });
        
        // Коллизия с монетами
        window.addEventListener('pickupCoin', (e) => {
            this.collectCoin(e.detail);
        });
    }
    
    pickupNearby() {
        // Подбор ближайшей монеты
        const nearest = this.coinManager.getNearestCoin(this.player.position);
        if (nearest && nearest.distance < 2.5) {
            this.collectCoin(nearest.coin);
            this.coinManager.removeCoin(nearest.coin);
        }
    }
    
    collectCoin(coin) {
        this.player.data.coins += coin.value;
        this.showMessage(`+${coin.value} 🪙`, 'loot');
        this.ui.updateHUD();
        this.saveGame();
    }
    
    showMessage(text, type = '') {
        this.ui.showMessage(text, type);
    }
    
    saveGame() {
        const saveData = {
            player: this.player.data,
            coins: this.coinManager ? this.coinManager.collectedCoins : [],
            gameTime: this.gameTime
        };
        localStorage.setItem('rpg3d_save', JSON.stringify(saveData));
    }
    
    loadGame() {
        const raw = localStorage.getItem('rpg3d_save');
        if (raw) {
            try {
                const data = JSON.parse(raw);
                if (data.player) {
                    this.player.data = { ...this.player.data, ...data.player };
                }
                this.gameTime = data.gameTime || 0;
            } catch (e) {
                console.error('Save load error:', e);
            }
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (!this.isPaused) {
            this.gameTime += 0.016;
            this.player.update();
            this.enemyManager.update();
            this.coinManager.update(this.player.position);
            this.ui.updateMinimap();
            this.camera.position.copy(this.player.getCameraPosition());
            this.camera.lookAt(this.player.getLookTarget());
        }
        
        this.renderer.render(this.scene, this.camera);
        
        // Автосохранение каждые 30 секунд
        if (Math.floor(this.gameTime) % 30 === 0 && Math.floor(this.gameTime) > 0) {
            this.saveGame();
        }
    }
}

// Запуск игры
const game = new Game();

// Глобальные функции для HTML-кнопок
window.toggleShop = () => game.shop.toggle();
window.toggleInventory = () => game.inventory.toggle();
window.game = game;

console.log('🐉 3D RPG: Мир Теней запущен!');
console.log('🎮 WASD — движение | Мышь — камера | Пробел — атака | E — подобрать');
console.log('🏪 B — магазин | 🎒 I — инвентарь');
