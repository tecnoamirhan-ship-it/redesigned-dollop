import * as THREE from 'three';

export class World {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        this.createGround();
        this.createDecorations();
    }
    
    createGround() {
        // Земля
        const groundGeo = new THREE.PlaneGeometry(60, 60, 20, 20);
        // Неровный рельеф
        const positions = groundGeo.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            positions.setZ(i, (Math.sin(x * 0.5) * Math.cos(y * 0.5)) * 0.3);
        }
        groundGeo.computeVertexNormals();
        
        const groundMat = new THREE.MeshStandardMaterial({ 
            color: 0x3a6b35, 
            roughness: 0.9,
            flatShading: false
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Дорожки
        const pathMat = new THREE.MeshStandardMaterial({ color: 0x9b8b75, roughness: 0.85 });
        const crossPaths = [
            { pos: [0, 0.01, 0], rot: [0, 0, 0], size: [2.2, 60] },
            { pos: [0, 0.01, 0], rot: [0, Math.PI/2, 0], size: [2.2, 60] },
        ];
        crossPaths.forEach(p => {
            const geo = new THREE.PlaneGeometry(p.size[0], p.size[1]);
            const mesh = new THREE.Mesh(geo, pathMat);
            mesh.rotation.set(-Math.PI/2, p.rot[1], 0);
            mesh.position.set(p.pos[0], p.pos[1], p.pos[2]);
            mesh.receiveShadow = true;
            this.scene.add(mesh);
        });
        
        // Центральная площадь
        const plazaGeo = new THREE.CircleGeometry(5, 16);
        const plazaMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.5 });
        const plaza = new THREE.Mesh(plazaGeo, plazaMat);
        plaza.rotation.x = -Math.PI / 2;
        plaza.position.y = 0.02;
        plaza.receiveShadow = true;
        this.scene.add(plaza);
    }
    
    createDecorations() {
        // Деревья
        for (let i = 0; i < 45; i++) {
            const x = (Math.random() - 0.5) * 50;
            const z = (Math.random() - 0.5) * 50;
            if (Math.abs(x) < 6 && Math.abs(z) < 6) continue;
            this.createTree(x, z);
        }
        
        // Кусты
        for (let i = 0; i < 30; i++) {
            const x = (Math.random() - 0.5) * 48;
            const z = (Math.random() - 0.5) * 48;
            this.createBush(x, z);
        }
        
        // Камни
        for (let i = 0; i < 25; i++) {
            const x = (Math.random() - 0.5) * 48;
            const z = (Math.random() - 0.5) * 48;
            const stoneGeo = new THREE.IcosahedronGeometry(0.3 + Math.random() * 0.7, 1);
            const stoneMat = new THREE.MeshStandardMaterial({ 
                color: new THREE.Color().setHSL(0, 0, 0.4 + Math.random() * 0.3),
                roughness: 0.8
            });
            const stone = new THREE.Mesh(stoneGeo, stoneMat);
            stone.position.set(x, 0.1, z);
            stone.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            stone.castShadow = true;
            stone.receiveShadow = true;
            this.scene.add(stone);
        }
        
        // Фонари вдоль дорог
        const lampMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.3 });
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xffdd88 });
        for (let i = -20; i <= 20; i += 10) {
            for (let side of [-1, 1]) {
                const x = i;
                const z = 3.5 * side;
                this.createLamp(x, z, lampMat, lightMat);
                this.createLamp(z, x, lampMat, lightMat);
            }
        }
    }
    
    createTree(x, z) {
        const group = new THREE.Group();
        
        const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2 + Math.random(), 6);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1;
        trunk.castShadow = true;
        group.add(trunk);
        
        const leavesMat = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color().setHSL(0.25 + Math.random() * 0.1, 0.7, 0.25 + Math.random() * 0.2),
            roughness: 0.7
        });
        for (let j = 0; j < 3; j++) {
            const leavesGeo = new THREE.ConeGeometry(1 - j * 0.25, 1.2, 8);
            const leaves = new THREE.Mesh(leavesGeo, leavesMat);
            leaves.position.y = 2 + j * 0.7;
            leaves.castShadow = true;
            group.add(leaves);
        }
        
        group.position.set(x, 0, z);
        group.scale.setScalar(0.8 + Math.random() * 0.8);
        this.scene.add(group);
    }
    
    createBush(x, z) {
        const bushGeo = new THREE.SphereGeometry(0.4 + Math.random() * 0.5, 6);
        const bushMat = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color().setHSL(0.3, 0.6, 0.2 + Math.random() * 0.3),
            roughness: 0.7
        });
        const bush = new THREE.Mesh(bushGeo, bushMat);
        bush.position.set(x, 0.2, z);
        bush.castShadow = true;
        this.scene.add(bush);
    }
    
    createLamp(x, z, poleMat, lightMat) {
        const group = new THREE.Group();
        
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3, 6), poleMat);
        pole.position.y = 1.5;
        pole.castShadow = true;
        group.add(pole);
        
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8), lightMat);
        bulb.position.y = 3.1;
        group.add(bulb);
        
        const lampLight = new THREE.PointLight(0xffcc88, 2, 7);
        lampLight.position.y = 3.1;
        group.add(lampLight);
        
        group.position.set(x, 0, z);
        this.scene.add(group);
    }
    }
