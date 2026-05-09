import * as THREE from 'three';

export class Player {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        
        // Данные игрока
        this.data = {
            hp: 100,
            maxHp: 100,
            xp: 0,
            level: 1,
            coins: 0,
            attack: 15,
            defense: 5,
            speed: 6,
            attackSpeed: 0.6,
            critChance: 5
        };
        
        // Физика
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveSpeed = 6;
        this.yaw = 0; // горизонтальный поворот
        this.pitch = 0; // вертикальный поворот
        this.height = 1.6;
        
        // Ввод
        this.keys = {};
        this.mouseSensitivity = 0.002;
        
        // Атака
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.attackRange = 2.5;
        this.attackDamage = this.data.attack;
        
        // 3D-модель игрока (вид от третьего лица — видим тело)
        this.createModel();
    }
    
    createModel() {
        this.group = new THREE.Group();
        
        // Тело (цилиндр)
        const bodyGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.6 });
        this.body = new THREE.Mesh(bodyGeo, bodyMat);
        this.body.position.y = 0.6;
        this.body.castShadow = true;
        this.group.add(this.body);
        
        // Голова
        const headGeo = new THREE.SphereGeometry(0.3, 8, 8);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffcc99, roughness: 0.5 });
        this.head = new THREE.Mesh(headGeo, headMat);
        this.head.position.y = 1.4;
        this.head.castShadow = true;
        this.group.add(this.head);
        
        // Меч (на спине или в руке)
        const bladeGeo = new THREE.BoxGeometry(0.08, 0.8, 0.08);
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.3 });
        this.sword = new THREE.Mesh(bladeGeo, bladeMat);
        this.sword.position.set(0.5, 0.9, 0);
        this.sword.rotation.z = -0.3;
        this.group.add(this.sword);
        
        // Тень
        const shadowGeo = new THREE.CircleGeometry(0.4, 8);
        const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 });
        this.shadow = new THREE.Mesh(shadowGeo, shadowMat);
        this.shadow.rotation.x = -Math.PI / 2;
        this.shadow.position.y = 0.05;
        this.group.add(this.shadow);
        
        this.group.position.copy(this.position);
        this.scene.add(this.group);
    }
    
    onKeyDown(key) {
        this.keys[key] = true;
    }
    
    onKeyUp(key) {
        this.keys[key] = false;
    }
    
    onMouseMove(dx, dy) {
        this.yaw -= dx * this.mouseSensitivity;
        this.pitch -= dy * this.mouseSensitivity;
        this.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.pitch));
    }
    
    attack() {
        if (this.attackCooldown > 0 || this.isAttacking) return;
        this.isAttacking = true;
        this.attackCooldown = this.data.attackSpeed;
        
        // Анимация взмаха мечом
        this.sword.rotation.z = -1.5;
        setTimeout(() => {
            this.sword.rotation.z = -0.3;
            this.isAttacking = false;
        }, 300);
        
        // Проверка попадания по врагам
        const hitEnemies = this.game.enemyManager.checkHit(
            this.position,
            this.getForwardDirection(),
            this.attackRange
        );
        
        hitEnemies.forEach(enemy => {
            let damage = this.data.attack;
            if (Math.random() * 100 < this.data.critChance) {
                damage *= 2;
                this.game.showMessage(`💥 КРИТ! -${damage} HP`, 'damage');
            }
            const killed = this.game.enemyManager.damageEnemy(enemy, damage);
            if (killed) {
                this.gainXP(enemy.xpReward);
                this.data.coins += enemy.goldReward;
                this.game.showMessage(`+${enemy.goldReward} 🪙`, 'loot');
            }
        });
    }
    
    getForwardDirection() {
        const dir = new THREE.Vector3();
        dir.setFromSphericalCoords(1, Math.PI / 2 - this.pitch, this.yaw);
        return dir;
    }
    
    takeDamage(amount) {
        const reducedDmg = Math.max(1, amount - this.data.defense);
        this.data.hp -= reducedDmg;
        this.game.showMessage(`-${reducedDmg} HP`, 'damage');
        this.game.ui.updateHUD();
        
        // Эффект красного экрана
        this.game.ui.flashDamage();
        
        if (this.data.hp <= 0) {
            this.data.hp = 0;
            this.die();
        }
    }
    
    die() {
        this.game.showMessage('💀 Вы погибли!', 'damage');
        // Респавн
        setTimeout(() => {
            this.data.hp = Math.floor(this.data.maxHp / 2);
            this.position.set(0, 0, 0);
            this.game.ui.updateHUD();
            this.game.showMessage('🔄 Возрождение...', 'heal');
        }, 2000);
    }
    
    gainXP(amount) {
        this.data.xp += amount;
        const needed = this.data.level * 100;
        if (this.data.xp >= needed) {
            this.data.xp -= needed;
            this.data.level++;
            this.data.maxHp += 20;
            this.data.hp = this.data.maxHp;
            this.data.attack += 5;
            this.data.defense += 2;
            this.data.speed += 0.3;
            this.moveSpeed = this.data.speed;
            this.game.showMessage(`🎉 УРОВЕНЬ ${this.data.level}!`, 'levelup');
        }
        this.game.ui.updateHUD();
    }
    
    update() {
        // Обработка движения
        const moveDir = new THREE.Vector3();
        if (this.keys['w'] || this.keys['arrowup']) moveDir.z -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) moveDir.z += 1;
        if (this.keys['a'] || this.keys['arrowleft']) moveDir.x -= 1;
        if (this.keys['d'] || this.keys['arrowright']) moveDir.x += 1;
        
        if (moveDir.length() > 0) {
            moveDir.normalize();
            // Поворот направления относительно камеры
            const rotated = new THREE.Vector3();
            rotated.x = moveDir.x * Math.cos(this.yaw) - moveDir.z * Math.sin(this.yaw);
            rotated.z = moveDir.x * Math.sin(this.yaw) + moveDir.z * Math.cos(this.yaw);
            
            this.position.x += rotated.x * this.moveSpeed * 0.016;
            this.position.z += rotated.z * this.moveSpeed * 0.016;
            
            // Анимация ходьбы (покачивание)
            this.body.rotation.z = Math.sin(Date.now() * 0.01) * 0.15;
        } else {
            this.body.rotation.z = 0;
        }
        
        // Ограничение по карте
        this.position.x = Math.max(-28, Math.min(28, this.position.x));
        this.position.z = Math.max(-28, Math.min(28, this.position.z));
        
        // Обновление группы
        this.group.position.copy(this.position);
        this.group.rotation.y = this.yaw;
        
        // Кулдаун атаки
        if (this.attackCooldown > 0) {
            this.attackCooldown -= 0.016;
        }
        
        // Регенерация HP (медленная)
        if (this.data.hp < this.data.maxHp && Math.random() < 0.001) {
            this.data.hp = Math.min(this.data.maxHp, this.data.hp + 1);
        }
    }
    
    getCameraPosition() {
        // Камера за спиной (третье лицо)
        const offset = new THREE.Vector3();
        offset.setFromSphericalCoords(5, Math.PI / 2 - this.pitch, this.yaw + Math.PI);
        return new THREE.Vector3(
            this.position.x + offset.x,
            this.position.y + this.height + 2,
            this.position.z + offset.z
        );
    }
    
    getLookTarget() {
        return new THREE.Vector3(
            this.position.x,
            this.position.y + this.height,
            this.position.z
        );
    }
          }
