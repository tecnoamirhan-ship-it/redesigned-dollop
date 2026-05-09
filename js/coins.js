import * as THREE from 'three';

export class CoinManager {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        this.coins = [];
        this.collectedCoins = []; // для сохранения
    }
    
    spawnCoins(position, amount) {
        const coinsToSpawn = Math.min(amount, 10);
        for (let i = 0; i < coinsToSpawn; i++) {
            const coin = this.createCoinMesh();
            coin.position.set(
                position.x + (Math.random() - 0.5) * 2,
                0.3 + Math.random() * 0.5,
                position.z + (Math.random() - 0.5) * 2
            );
            coin.userData = {
                value: Math.ceil(amount / coinsToSpawn),
                bobOffset: Math.random() * Math.PI * 2,
                sparkle: 0
            };
            this.scene.add(coin);
            this.coins.push(coin);
        }
    }
    
    createCoinMesh() {
        const group = new THREE.Group();
        
        // Монета
        const coinGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16);
        const coinMat = new THREE.MeshStandardMaterial({ 
            color: 0xffd700, 
            metalness: 0.9, 
            roughness: 0.2,
            emissive: 0x332200,
            emissiveIntensity: 0.3
        });
        const coin = new THREE.Mesh(coinGeo, coinMat);
        coin.castShadow = true;
        group.add(coin);
        
        // Свечение
        const glowGeo = new THREE.RingGeometry(0.15, 0.25, 16);
        const glowMat = new THREE.MeshBasicMaterial({ 
            color: 0xffd700, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.rotation.x = -Math.PI / 2;
        glow.position.y = 0.03;
        group.add(glow);
        
        return group;
    }
    
    getNearestCoin(playerPos) {
        let nearest = null;
        let nearestDist = Infinity;
        
        this.coins.forEach(coin => {
            const dist = coin.position.distanceTo(playerPos);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = { coin, distance: dist };
            }
        });
        
        return nearest;
    }
    
    removeCoin(coin) {
        this.scene.remove(coin);
        const idx = this.coins.indexOf(coin);
        if (idx >= 0) this.coins.splice(idx, 1);
        // Сохраняем ID собранных монет
        this.collectedCoins.push(coin.uuid);
        
        // Очистка старых записей
        if (this.collectedCoins.length > 1000) {
            this.collectedCoins = this.collectedCoins.slice(-500);
        }
    }
    
    update(playerPos) {
        this.coins.forEach(coin => {
            // Покачивание
            coin.userData.bobOffset += 0.03;
            coin.position.y = 0.3 + Math.sin(coin.userData.bobOffset) * 0.15;
            
            // Вращение
            coin.rotation.y += 0.02;
            
            // Притяжение к игроку на близком расстоянии
            const dist = coin.position.distanceTo(playerPos);
            if (dist < 3) {
                const pullStrength = (3 - dist) / 3 * 5;
                const dir = new THREE.Vector3().subVectors(playerPos, coin.position).normalize();
                coin.position.x += dir.x * pullStrength * 0.016;
                coin.position.z += dir.z * pullStrength * 0.016;
            }
            
            // Автоподбор вплотную
            if (dist < 0.8) {
                this.game.collectCoin(coin);
                this.removeCoin(coin);
            }
        });
    }
}
