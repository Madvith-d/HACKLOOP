// Mock 
class SignalingService {
    constructor() {
        this.callbacks = {};
        this.connected = false;
    }
    connect(roomId, userId) {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.connected = true;
                this.roomId = roomId;
                this.userId = userId;
                console.log(`Connected to room: ${roomId} as user: ${userId}`);
                resolve();
            }, 1000);
        });
    }
    sendOffer(offer, targetUserId) {
        if (!this.connected) {
            console.error('Not connected to signaling server');
            return;
        }

        console.log('Sending offer to:', targetUserId);
        this.simulateSignaling({
            type: 'offer',
            from: this.userId,
            to: targetUserId,
            data: offer
        });
    }
    sendAnswer(answer, targetUserId) {
        if (!this.connected) {
            console.error('Not connected to signaling server');
            return;
        }

        console.log('Sending answer to:', targetUserId);
        this.simulateSignaling({
            type: 'answer',
            from: this.userId,
            to: targetUserId,
            data: answer
        });
    }
    sendIceCandidate(candidate, targetUserId) {
        if (!this.connected) {
            console.error('Not connected to signaling server');
            return;
        }

        console.log('Sending ICE candidate to:', targetUserId);
        this.simulateSignaling({
            type: 'ice-candidate',
            from: this.userId,
            to: targetUserId,
            data: candidate
        });
    }
    on(event, callback) {
        this.callbacks[event] = callback;
    }
    simulateSignaling(message) {
        console.log('Signaling message:', message);
        setTimeout(() => {
            if (this.callbacks['message-sent']) {
                this.callbacks['message-sent'](message);
            }
        }, 100);
    }
    disconnect() {
        this.connected = false;
        this.roomId = null;
        this.userId = null;
        console.log('Disconnected from signaling server');
    }
}
let signalingInstance = null;

export function getSignalingService() {
    if (!signalingInstance) {
        signalingInstance = new SignalingService();
    }
    return signalingInstance;
}

export default SignalingService;
