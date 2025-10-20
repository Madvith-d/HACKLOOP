import * as THREE from 'three';
class SimplexNoise {
    constructor() {
        this.grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
        this.p = [];
        for(let i=0; i<256; i++) this.p[i] = Math.floor(Math.random()*256);
        this.perm = [];
        for(let i=0; i<512; i++) this.perm[i] = this.p[i & 255];
    }
    
    dot(g, x, y) {
        return g[0]*x + g[1]*y;
    }
    
    noise2D(xin, yin) {
        const F2 = 0.5*(Math.sqrt(3.0)-1.0);
        const s = (xin+yin)*F2;
        const i = Math.floor(xin+s);
        const j = Math.floor(yin+s);
        
        const G2 = (3.0-Math.sqrt(3.0))/6.0;
        const t = (i+j)*G2;
        const X0 = i-t;
        const Y0 = j-t;
        const x0 = xin-X0;
        const y0 = yin-Y0;
        
        let i1, j1;
        if(x0>y0) {i1=1; j1=0;}
        else {i1=0; j1=1;}
        
        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1.0 + 2.0 * G2;
        const y2 = y0 - 1.0 + 2.0 * G2;
        
        const ii = i & 255;
        const jj = j & 255;
        const gi0 = this.perm[ii+this.perm[jj]] % 12;
        const gi1 = this.perm[ii+i1+this.perm[jj+j1]] % 12;
        const gi2 = this.perm[ii+1+this.perm[jj+1]] % 12;
        
        let n0, n1, n2;
        let t0 = 0.5 - x0*x0-y0*y0;
        if(t0<0) n0 = 0.0;
        else {
            t0 *= t0;
            n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);
        }
        
        let t1 = 0.5 - x1*x1-y1*y1;
        if(t1<0) n1 = 0.0;
        else {
            t1 *= t1;
            n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
        }
        
        let t2 = 0.5 - x2*x2-y2*y2;
        if(t2<0) n2 = 0.0;
        else {
            t2 *= t2;
            n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
        }
        
        return 70.0 * (n0 + n1 + n2);
    }
}

export const AnimationCurve = {
    linear: (t) => t,
    easeInOut: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    easeOut: (t) => 1 - Math.pow(1 - t, 3),
    easeIn: (t) => t * t * t,
    elastic: (t) => t === 0 || t === 1 ? t : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * ((2 * Math.PI) / 3)),
    bounce: (t) => {
        const n1 = 7.5625, d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
        else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
        else return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
    spring: (t) => 1 - Math.cos(t * 4.5 * Math.PI) * Math.exp(-t * 6)
};

export class TwoBoneIK {
    static solve(shoulder, elbow, hand, target, poleTarget = null) {
        const upperLength = shoulder.position.distanceTo(elbow.position);
        const lowerLength = elbow.position.distanceTo(hand.position);
        const totalLength = upperLength + lowerLength;
        
        const targetDist = shoulder.position.distanceTo(target);
        const clampedDist = Math.min(targetDist, totalLength * 0.99);
        
        // Law of cosines
        const cosAngle = (upperLength * upperLength + clampedDist * clampedDist - lowerLength * lowerLength) / (2 * upperLength * clampedDist);
        const angle = Math.acos(THREE.MathUtils.clamp(cosAngle, -1, 1));
        
        // Direction to target
        const toTarget = new THREE.Vector3().subVectors(target, shoulder.position).normalize();
        
        // Calculate elbow position
        const elbowOffset = new THREE.Vector3().copy(toTarget).multiplyScalar(upperLength * Math.cos(angle));
        
        // Pole vector (for natural elbow bend)
        let perpendicular;
        if (poleTarget) {
            perpendicular = new THREE.Vector3().subVectors(poleTarget, shoulder.position);
        } else {
            perpendicular = new THREE.Vector3(0, 1, 0);
        }
        perpendicular.cross(toTarget).normalize();
        
        const elbowHeight = upperLength * Math.sin(angle);
        elbowOffset.add(perpendicular.multiplyScalar(elbowHeight));
        
        return {
            elbowPosition: new THREE.Vector3().addVectors(shoulder.position, elbowOffset),
            shoulderRotation: toTarget,
            elbowAngle: angle
        };
    }
}

// Procedural animation state machine
export class AnimationStateMachine {
    constructor() {
        this.currentState = 'idle';
        this.previousState = 'idle';
        this.transitionProgress = 1.0;
        this.transitionSpeed = 3.0;
    }
    
    setState(newState, speed = 3.0) {
        if (newState !== this.currentState) {
            this.previousState = this.currentState;
            this.currentState = newState;
            this.transitionProgress = 0.0;
            this.transitionSpeed = speed;
        }
    }
    
    update(delta) {
        if (this.transitionProgress < 1.0) {
            this.transitionProgress = Math.min(1.0, this.transitionProgress + delta * this.transitionSpeed);
        }
    }
    
    getBlendWeight() {
        return AnimationCurve.easeInOut(this.transitionProgress);
    }
}

// Layered animation blending
export class AnimationLayer {
    constructor(weight = 1.0, blendMode = 'additive') {
        this.weight = weight;
        this.blendMode = blendMode; // 'additive' or 'override'
        this.transforms = new Map();
    }
    
    setTransform(boneName, rotation, position = null) {
        this.transforms.set(boneName, { rotation, position });
    }
    
    apply(bones, baseLayer = null) {
        this.transforms.forEach((transform, boneName) => {
            const bone = bones[boneName];
            if (!bone) return;
            
            if (this.blendMode === 'additive' && baseLayer) {
                // Additive blending
                bone.rotation.x += transform.rotation.x * this.weight;
                bone.rotation.y += transform.rotation.y * this.weight;
                bone.rotation.z += transform.rotation.z * this.weight;
            } else {
                // Override blending
                bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, transform.rotation.x, this.weight);
                bone.rotation.y = THREE.MathUtils.lerp(bone.rotation.y, transform.rotation.y, this.weight);
                bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, transform.rotation.z, this.weight);
            }
            
            if (transform.position) {
                bone.position.lerp(transform.position, this.weight);
            }
        });
    }
}

// Noise singleton
export const noise = new SimplexNoise();

// Look-at with constraints
export class LookAtController {
    constructor(bone, maxRotation = Math.PI / 4) {
        this.bone = bone;
        this.maxRotation = maxRotation;
        this.target = new THREE.Vector3();
        this.smoothFactor = 0.1;
    }
    
    setTarget(target) {
        this.target.copy(target);
    }
    
    update() {
        if (!this.bone) return;
        
        const direction = new THREE.Vector3().subVectors(this.target, this.bone.getWorldPosition(new THREE.Vector3()));
        direction.normalize();
        
        // Calculate desired rotation
        const currentDir = new THREE.Vector3(0, 0, 1).applyQuaternion(this.bone.quaternion);
        const angle = currentDir.angleTo(direction);
        
        if (angle > 0.01) {
            const clampedAngle = Math.min(angle, this.maxRotation);
            const axis = new THREE.Vector3().crossVectors(currentDir, direction).normalize();
            const targetQuat = new THREE.Quaternion().setFromAxisAngle(axis, clampedAngle);
            this.bone.quaternion.slerp(targetQuat, this.smoothFactor);
        }
    }
}

export default { AnimationCurve, TwoBoneIK, AnimationStateMachine, AnimationLayer, noise, LookAtController };
