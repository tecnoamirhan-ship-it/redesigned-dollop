import * as THREE from 'three';

export class World {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        this.createGround();
        this.createDecorations();
        this.createBuildings();
    }
    
    createGround() {
        // Основная земля
        const groundGeo = new THREE.PlaneGeometry(60, 60);
        const groundMat = new THREE.MeshStandardMaterial({ 
            color: 0x2d5a27, 
            roughness: 0.8,
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Дорожки
        const pathMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.9 });
        for (let i = -25; i <= 25; i += 8) {
            const pathH = new THREE.Mesh(new THREE.PlaneGeometry(2, 60), pathMat);
            pathH.rotation.x = -Math.PI / 2;
            pathH.position.set(i, 0.02, 0);
            pathH.receiveShadow = true;
            this.scene.add(pathH);
            
            const pathV = new THREE.Mesh(new THREE.PlaneGeometry(60, 2), pathMat);
            pathV.rotation.x = -Math.PI / 2;
            pathV.position.set(0, 0.02, i);
            pathV.receiveShadow = true;
            this.scene.add(pathV);
        }
    }
    
    createDecorations() {
        // Деревья
        for (let i = 0; i < 40; i++) {
            const x = (Math.random() - 0.5) * 50;
            const z = (Math.random() - 0.5) * 50;
            if (Math.abs(x) < 5 && Math.abs(z) < 5) continue; // не в центре
            this.createTree(x, z);
        }
        
        // Камни
        const stoneGeo = new THREE.IcosahedronGeometry(0.4, 0);
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.7 });
        for (let i = 0; i < 30; i++) {
            const stone = new THREE.Mesh(stoneGeo, stoneMat);
            stone.position.set(
                (Math.random() - 0.5) * 50,
                0.2,
                (Math.random() - 0.5) * 50
            );
            stone.scale.setScalar(0.5 + Math.random() * 1.5);
            stone.castShadow = true;
            stone.receiveShadow = true;
            this.scene.add(stone);
        }
        
        // Цветы / трава
        const flowerMat = new THREE.MeshStandardMaterial({ color: 0xff8844 });
        for (let i = 0; i < 60; i++) {
            const flower = new THREE.Mesh(new THREE.SphereGeometry(0.1, 4), flowerMat);
            flower.position.set(
                (Math.random() - 0.5) * 50,
                0.1,
                (Math.random() - 0.5) * 50
            );
            this.scene.add(flower);
        }
    }
    
    createTree(x, z) {
        const group = new THREE.Group();
        
        // Ствол
        const trunkGeo = new THREE.CylinderGeometry(0
