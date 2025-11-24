/**
 * WebRTC Signaling Server using Socket.IO
 * Handles peer-to-peer video call setup between therapists and patients
 */

const rooms = new Map(); // roomId -> Set of socket IDs

function setupSignaling(io) {
    io.on('connection', (socket) => {
        console.log(`[Signaling] Client connected: ${socket.id}`);

        // Join a specific room for a therapy session
        socket.on('join-room', ({ roomId, userId, role }) => {
            console.log(`[Signaling] ${role} ${userId} joining room ${roomId}`);

            socket.join(roomId);
            socket.roomId = roomId;
            socket.userId = userId;
            socket.userRole = role;

            // Track participants in room
            if (!rooms.has(roomId)) {
                rooms.set(roomId, new Set());
            }
            rooms.get(roomId).add(socket.id);

            // Notify others in the room that a new user joined
            socket.to(roomId).emit('user-joined', {
                userId,
                role,
                socketId: socket.id
            });

            // Send current room participants to the newcomer
            const roomParticipants = Array.from(rooms.get(roomId))
                .filter(id => id !== socket.id);

            socket.emit('room-participants', {
                participants: roomParticipants,
                count: rooms.get(roomId).size
            });

            console.log(`[Signaling] Room ${roomId} now has ${rooms.get(roomId).size} participants`);
        });

        // Handle WebRTC offer
        socket.on('offer', ({ offer, roomId }) => {
            console.log(`[Signaling] Forwarding offer in room ${roomId}`);
            socket.to(roomId).emit('offer', {
                offer,
                fromSocketId: socket.id,
                fromUserId: socket.userId
            });
        });

        // Handle WebRTC answer
        socket.on('answer', ({ answer, roomId }) => {
            console.log(`[Signaling] Forwarding answer in room ${roomId}`);
            socket.to(roomId).emit('answer', {
                answer,
                fromSocketId: socket.id,
                fromUserId: socket.userId
            });
        });

        // Handle ICE candidate
        socket.on('ice-candidate', ({ candidate, roomId }) => {
            console.log(`[Signaling] Forwarding ICE candidate in room ${roomId}`);
            socket.to(roomId).emit('ice-candidate', {
                candidate,
                fromSocketId: socket.id
            });
        });

        // Handle leaving room
        socket.on('leave-room', ({ roomId }) => {
            handleLeaveRoom(socket, roomId);
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`[Signaling] Client disconnected: ${socket.id}`);
            const roomId = socket.roomId;
            if (roomId) {
                handleLeaveRoom(socket, roomId);
            }
        });
    });
}

function handleLeaveRoom(socket, roomId) {
    console.log(`[Signaling] User ${socket.userId} leaving room ${roomId}`);

    socket.leave(roomId);

    // Remove from room tracking
    if (rooms.has(roomId)) {
        rooms.get(roomId).delete(socket.id);
        if (rooms.get(roomId).size === 0) {
            rooms.delete(roomId);
            console.log(`[Signaling] Room ${roomId} is now empty and deleted`);
        } else {
            console.log(`[Signaling] Room ${roomId} now has ${rooms.get(roomId).size} participants`);
        }
    }

    // Notify others in the room
    socket.to(roomId).emit('user-left', {
        userId: socket.userId,
        socketId: socket.id
    });
}

module.exports = setupSignaling;
