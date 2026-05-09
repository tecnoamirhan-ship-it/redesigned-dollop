import * as THREE from 'three';

export class EnemyManager {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        this.enemies = [];
        this.spawnTimer = 0;
        this.maxEnemies = 12;
        this.spawnInterval = 8;
        
        // Начальный спавн
        for (let i = 0; i < 6; i++) {
            this.spawnEnemy();
        }
    }
    
    spawnEnemy() {
        if (this.enemies.length >= this.maxEnemies) return;
        
        const types = [
            { name: 'Слизень', color: 0x44ff44, hp: 30, atk: 8, def: 2, speed: 1.2, xp: 15, gold: 5, scale: 0.6 },
            { name: 'Скелет', color: 0xddddcc, hp: 50, atk: 15, def: 5, speed: 1.8, xp: 30, gold: 12, scale: 0.9 },
            { name: 'Гоблин', color: 0x88aa44, hp: 40, atk: 12, def: 3, speed: 2.5, xp: 22, gold: 8, scale: 0.7 },
            { name: 'Теневой волк', color: 0x444466, hp: 55, atk: 20, def: 6, speed: 3.2, xp: 35, gold: 15, scale: 0.8 },
            { name: 'Голем', color: 0x888888, hp: 100, atk: 25, def: 12, speed: 0.8, xp: 60, gold: 25, scale: 1.3 },
        ];
        
        const type = types[Math.floor(Math.random() * types.length)];
        const angle = Math.random() * Math.PI * 2;
        const dist = 15 + Math.random() * 20;
        
        const enemy = {
            data: { ...type },
            mesh: this.createEnemyMesh(type),
            hp: type.hp,
            maxHp: type.hp,
            position: new THREE.Vector3(
                Math.cos(angle) * dist,
                0,
                Math.sin(angle) * dist
            ),
            alive: true,
            aiState: 'idle',
            aiTimer: Math.random() * 3,
            targetPosition: null,
            attackCooldown: 0,
            hpBar: null
        };
        
        enemy.mesh.position.copy(enemy.position);
        this.scene.add(enemy.mesh);
        
        // HP бар над врагом
        enemy.hpBar = this.createHPBar();
        enemy.hpBar.position.set(0, type.scale * 2 + 0.3, 0);
        enemy.mesh.add(enemy.hpBar);
        
        this.enemies.push(enemy);
    }
    
    createEnemyMesh(type) {
        const group = new THREE.Group();
        
        // Тело
        const bodyGeo = new THREE.CapsuleGeometry(0.3 * type.scale, 0.4 * type.scale, 4, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: type.color, roughness: 0.6 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.5 * type.scale;
        body.castShadow = true;
        group.add(body);
        
        // Глаза
        const eyeGeo = new THREE.SphereGeometry(0.1 * type.scale, 4, 4);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.12, type.scale * 0.9, 0.22);
        group.add(leftEye);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.12, type.scale * 0.9, 0.22);
        group.add(rightEye);
        
        return group;
    }
    
    createHPBar() {
        const group = new THREE.Group();
        
        const bgGeo = new THREE.PlaneGeometry(0.6, 0.08);
        const bgMat = new THREE.MeshBasicMaterial({ color: 0x330000, side: THREE.DoubleSide });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        group.add(bg);
        
        const fillGeo = new THREE.PlaneGeometry(0.58, 0.06);
        const fillMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
        const fill = new THREE.Mesh(fillGeo, fillMat);
        fill.position.z = 0.001;
        fill.name = 'hpFill';
        group.add(fill);
        
        return group;
    }
    
    updateHPBar(enemy) {
        if (!enemy.hpBar) return;
        const fill = enemy.hpBar.getObjectByName('hpFill');
        if (fill) {
            const pct = enemy.hp / enemy.maxHp;
            fill.scale.x = Math.max(0.01, pct);
            fill.position.x = -(0.58 * (1 - pct)) / 2;
            fill.material.color.setHex(pct > 0.5 ? 0x00ff00 : pct > 0.25 ? 0xffaa00 : 0xff0000);
        }
    }
    
    checkHit(attackerPos, attackerDir, range) {
        const hitEnemies = [];
        this.enemies.forEach(enemy => {
            if (!enemy.alive) return;
            const toEnemy = new THREE.Vector3().subVectors(enemy.position, attackerPos);
            const dist = toEnemy.length();
            
            // Проверка дистанции и угла (конус атаки)
            if (dist < range) {
                const dot = toEnemy.normalize().dot(attackerDir);
                if (dot > 0.3) {
                    hitEnemies.push(enemy);
                }
            }
        });
        return hitEnemies;
    }
    
    damageEnemy(enemy, damage) {
        const reducedDmg = Math.max(1, damage - enemy.data.def);
        enemy.hp -= reducedDmg;
        this.updateHPBar(enemy);
        
        // Отбрасывание
        const knockDir = new THREE.Vector3().subVectors(enemy.position, this.game.player.position).normalize();
        enemy.position.x += knockDir.x * 0.5;
        enemy.position.z += knockDir.z * 0.5;
        
        if (enemy.hp <= 0) {
            enemy.alive = false;
            this.scene.remove(enemy.mesh);
            
            // Дроп монет
            this.game.coinManager.spawnCoins(enemy.position, enemy.data.gold);
            
            // Удаление из массива
            const idx = this.enemies.indexOf(enemy);
            if (idx >= 0) this.enemies.splice(idx, 1);
            
            return true;
        }
        return false;
    }
    
    update() {
        this.spawnTimer += 0.016;
        if (this.spawnTimer >= this.spawnInterval && this.enemies.length < this.maxEnemies) {
            this.spawnTimer = 0;
            this.spawnEnemy();
        }
        
        const playerPos = this.game.player.position;
        
        this.enemies.forEach(enemy => {
            if (!enemy.alive) return;
            
            const dist = enemy.position.distanceTo(playerPos);
            
            // ИИ состояний
            if (dist < 12) {
                // Преследование
                enemy.aiState = 'chase';
                const dir = new THREE.Vector3().subVectors(playerPos, enemy.position).normalize();
                enemy.position.x += dir.x * enemy.data.speed * 0.016;
                enemy.position.z += dir.z * enemy.data.speed * 0.016;
                
                // Поворот к игроку
                enemy.mesh.lookAt(new THREE.Vector3(playerPos.x, enemy.position.y, playerPos.z));
                
                // Атака вблизи
                if (dist < 2 && enemy.attackCooldown <= 0) {
                    this.game.player.takeDamage(enemy.data.atk);
                    enemy.attackCooldown = 1.2;
                }
            } else if (dist < 20) {
                // Патрулирование
                enemy.aiState = 'patrol';
                enemy.aiTimer -= 0.016;
                if (enemy.aiTimer <= 0) {
                    enemy.aiTimer = 3 + Math.random() * 5;
                    const angle = Math.random() * Math.PI * 2;
                    const radius = 15 + Math.random() * 10;
                    enemy.targetPosition = new THREE.Vector3(
                        playerPos.x + Math.cos(angle) * radius,
                        0,
                        playerPos.z + Math.sin(angle) * radius
                    );
                }
                if (enemy.targetPosition) {
                    const dir = new THREE.Vector3().subVectors(enemy.targetPosition, enemy.position).normalize();
                    enemy.position.x += dir.x * enemy.data.speed * 0.5 * 0.016;
                    enemy.position.z += dir.z * enemy.data.speed * 0.5 * 0.016;
                    enemy.mesh.lookAt(new THREE.Vector3(enemy.targetPosition.x, enemy.position.y, enemy.targetPosition.z));
                }
            } else {
                enemy.aiState = 'idle';
            }
            
            // Ограничение по карте
            enemy.position.x = Math.max(-28, Math.min(28, enemy.position.x));
            enemy.position.z = Math.max(-28, Math.min(28, enemy.position.z));
            
            // Обновление позиции меша
            enemy.mesh.position.copy(enemy.position);
            
            // Кулдаун атаки
            if (enemy.attackCooldown > 0) {
                enemy.attackCooldown -= 0.016;
            }
        });
    }
                                                  }
