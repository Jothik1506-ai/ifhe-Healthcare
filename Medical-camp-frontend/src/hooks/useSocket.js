import { useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { SOCKET_URL } from '../config/api';

// Singleton socket instance
let socketInstance = null;

const getSocketInstance = () => {
    if (!socketInstance) {
        console.log('🔌 Creating new WebSocket connection to:', SOCKET_URL);
        socketInstance = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        socketInstance.on('connect', () => {
            console.log('✅ WebSocket connected:', socketInstance.id);
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('❌ WebSocket disconnected:', reason);
        });

        socketInstance.on('connect_error', (error) => {
            console.error('⚠️ WebSocket connection error:', error);
        });

        socketInstance.on('reconnect', (attemptNumber) => {
            console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts');
        });
    }
    return socketInstance;
};

export const useSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const socket = getSocketInstance();

    useEffect(() => {
        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);

        // Set initial state
        setIsConnected(socket.connected);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
        };
    }, [socket]);

    return { socket, isConnected };
};

// Hook for queue-specific WebSocket events
export const useQueueSocket = (onQueueUpdate) => {
    const { socket, isConnected } = useSocket();
    const hasJoinedRef = useRef(false);

    useEffect(() => {
        if (!socket) return;

        // Join the queue room only once
        if (!hasJoinedRef.current) {
            console.log('📡 Joining queue room...');
            socket.emit('join:queue');
            hasJoinedRef.current = true;
        }

        // Listen for queue events
        const handleQueueAdded = (data) => {
            console.log('📥 Queue added event received:', data);
            if (onQueueUpdate) onQueueUpdate('added', data);
        };

        const handleQueueRemoved = (data) => {
            console.log('📤 Queue removed event received:', data);
            if (onQueueUpdate) onQueueUpdate('removed', data);
        };

        const handleQueueCountUpdated = (data) => {
            console.log('🔢 Queue count updated event received:', data);
            if (onQueueUpdate) onQueueUpdate('count-updated', data);
        };

        socket.on('queue:added', handleQueueAdded);
        socket.on('queue:removed', handleQueueRemoved);
        socket.on('queue:count-updated', handleQueueCountUpdated);

        return () => {
            socket.off('queue:added', handleQueueAdded);
            socket.off('queue:removed', handleQueueRemoved);
            socket.off('queue:count-updated', handleQueueCountUpdated);
        };
    }, [socket, onQueueUpdate]);

    return { socket, isConnected };
};

// Hook for analytics-specific WebSocket events
export const useAnalyticsSocket = (onAnalyticsUpdate) => {
    const { socket, isConnected } = useSocket();
    const hasJoinedRef = useRef(false);

    useEffect(() => {
        if (!socket) return;

        // Join the analytics room only once
        if (!hasJoinedRef.current) {
            console.log('📡 Joining analytics room...');
            socket.emit('join:analytics');
            hasJoinedRef.current = true;
        }

        // Listen for analytics events
        const handlePatientRegistered = (data) => {
            console.log('👤 Patient registered event received:', data);
            if (onAnalyticsUpdate) onAnalyticsUpdate('patient-registered', data);
        };

        const handleVitalsRecorded = (data) => {
            console.log('💓 Vitals recorded event received:', data);
            if (onAnalyticsUpdate) onAnalyticsUpdate('vitals-recorded', data);
        };

        const handleMedicineDistributed = (data) => {
            console.log('💊 Medicine distributed event received:', data);
            if (onAnalyticsUpdate) onAnalyticsUpdate('medicine-distributed', data);
        };

        const handleMedicineReceived = (data) => {
            console.log('💊 Medicine received event received:', data);
            if (onAnalyticsUpdate) onAnalyticsUpdate('medicine-received', data);
        };

        const handlePrescriptionGenerated = (data) => {
            console.log('📝 Prescription generated event received:', data);
            if (onAnalyticsUpdate) onAnalyticsUpdate('prescription-generated', data);
        };

        const handleConsultationStarted = (data) => {
            console.log('👨‍⚕️ Consultation started event received:', data);
            if (onAnalyticsUpdate) onAnalyticsUpdate('consultation-started', data);
        };

        const handleConsultationCompleted = (data) => {
            console.log('✅ Consultation completed event received:', data);
            if (onAnalyticsUpdate) onAnalyticsUpdate('consultation-completed', data);
        };

        const handlePatientQueued = (data) => {
            console.log('⏳ Patient queued event received:', data);
            if (onAnalyticsUpdate) onAnalyticsUpdate('patient-queued', data);
        };

        const handlePatientDequeued = (data) => {
            console.log('✅ Patient dequeued event received:', data);
            if (onAnalyticsUpdate) onAnalyticsUpdate('patient-dequeued', data);
        };

        const handleMedicineDispensed = (data) => {
            console.log('💊 Medicine dispensed event received:', data);
            if (onAnalyticsUpdate) onAnalyticsUpdate('medicine-dispensed', data);
        };

        socket.on('analytics:patient-registered', handlePatientRegistered);
        socket.on('analytics:vitals-recorded', handleVitalsRecorded);
        socket.on('analytics:medicine-distributed', handleMedicineDistributed);
        socket.on('analytics:medicine-received', handleMedicineReceived);
        socket.on('analytics:prescription-generated', handlePrescriptionGenerated);
        socket.on('analytics:consultation-started', handleConsultationStarted);
        socket.on('analytics:consultation-completed', handleConsultationCompleted);
        socket.on('analytics:patient-queued', handlePatientQueued);
        socket.on('analytics:patient-dequeued', handlePatientDequeued);
        socket.on('analytics:medicine-dispensed', handleMedicineDispensed);

        return () => {
            socket.off('analytics:patient-registered', handlePatientRegistered);
            socket.off('analytics:vitals-recorded', handleVitalsRecorded);
            socket.off('analytics:medicine-distributed', handleMedicineDistributed);
            socket.off('analytics:medicine-received', handleMedicineReceived);
            socket.off('analytics:prescription-generated', handlePrescriptionGenerated);
            socket.off('analytics:consultation-started', handleConsultationStarted);
            socket.off('analytics:consultation-completed', handleConsultationCompleted);
            socket.off('analytics:patient-queued', handlePatientQueued);
            socket.off('analytics:patient-dequeued', handlePatientDequeued);
            socket.off('analytics:medicine-dispensed', handleMedicineDispensed);
        };
    }, [socket, onAnalyticsUpdate]);

    return { socket, isConnected };
};

