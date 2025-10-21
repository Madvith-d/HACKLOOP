const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ]
};

export class WebRTCService {
    constructor() {
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        this.onRemoteStream = null;
        this.onConnectionStateChange = null;
    }
    async initializeLocalStream(constraints = { video: true, audio: true }) {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            return this.localStream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            throw error;
        }
    }
    createPeerConnection() {
        this.peerConnection = new RTCPeerConnection(ICE_SERVERS);
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
            });
        }
        this.peerConnection.ontrack = (event) => {
            if (!this.remoteStream) {
                this.remoteStream = new MediaStream();
                if (this.onRemoteStream) {
                    this.onRemoteStream(this.remoteStream);
                }
            }
            this.remoteStream.addTrack(event.track);
        };

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                // Send ICE candidate to remote peer via signaling server
                this.onIceCandidate?.(event.candidate);
            }
        };

        // Handle connection state changes
        this.peerConnection.onconnectionstatechange = () => {
            if (this.onConnectionStateChange) {
                this.onConnectionStateChange(this.peerConnection.connectionState);
            }
        };

        return this.peerConnection;
    }

    // Create offer (caller side)
    async createOffer() {
        if (!this.peerConnection) {
            this.createPeerConnection();
        }

        try {
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            return offer;
        } catch (error) {
            console.error('Error creating offer:', error);
            throw error;
        }
    }

    // Create answer (callee side)
    async createAnswer(offer) {
        if (!this.peerConnection) {
            this.createPeerConnection();
        }

        try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            return answer;
        } catch (error) {
            console.error('Error creating answer:', error);
            throw error;
        }
    }

    // Set remote answer (caller side)
    async setRemoteAnswer(answer) {
        try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
            console.error('Error setting remote answer:', error);
            throw error;
        }
    }

    // Add ICE candidate
    async addIceCandidate(candidate) {
        try {
            if (this.peerConnection) {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    }

    // Toggle audio
    toggleAudio() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                return audioTrack.enabled;
            }
        }
        return false;
    }

    // Toggle video
    toggleVideo() {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                return videoTrack.enabled;
            }
        }
        return false;
    }

    // End call and cleanup
    endCall() {
        // Stop all tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }

        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
        }

        // Reset streams
        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
    }

    // Get connection stats
    async getConnectionStats() {
        if (!this.peerConnection) return null;

        try {
            const stats = await this.peerConnection.getStats();
            const statsReport = {};
            
            stats.forEach(report => {
                if (report.type === 'inbound-rtp' || report.type === 'outbound-rtp') {
                    statsReport[report.type] = report;
                }
            });

            return statsReport;
        } catch (error) {
            console.error('Error getting connection stats:', error);
            return null;
        }
    }
}

export default WebRTCService;
