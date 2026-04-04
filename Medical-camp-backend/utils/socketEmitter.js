/**
 * WebSocket Event Emitter Utility
 * Centralized utility for emitting WebSocket events across the application
 */

class SocketEmitter {
    /**
     * Emit a queue-related event
     * @param {Object} io - Socket.IO instance
     * @param {string} event - Event name (added, removed, count-updated)
     * @param {Object} data - Event data
     */
    static emitQueueEvent(io, event, data) {
        if (!io) {
            console.warn('⚠️ Socket.IO instance not found - WebSocket events not emitted');
            return;
        }

        const eventName = `queue:${event}`;
        console.log(`📡 Emitting ${eventName} event:`, data);
        io.to('queue').emit(eventName, data);
    }

    /**
     * Emit an analytics-related event
     * @param {Object} io - Socket.IO instance
     * @param {string} event - Event name (patient-registered, vitals-recorded, etc.)
     * @param {Object} data - Event data
     */
    static emitAnalyticsEvent(io, event, data) {
        if (!io) {
            console.warn('⚠️ Socket.IO instance not found - WebSocket events not emitted');
            return;
        }

        const eventName = `analytics:${event}`;
        console.log(`📡 Emitting ${eventName} event:`, data);
        io.to('analytics').emit(eventName, data);
    }

    /**
     * Emit a general event (not room-specific)
     * @param {Object} io - Socket.IO instance
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    static emitGeneralEvent(io, event, data) {
        if (!io) {
            console.warn('⚠️ Socket.IO instance not found - WebSocket events not emitted');
            return;
        }

        console.log(`📡 Emitting ${event} event:`, data);
        io.emit(event, data);
    }

    /**
     * Emit queue added event with automatic count updates
     * @param {Object} io - Socket.IO instance
     * @param {Object} Queue - Queue model
     * @param {Object} data - Queue data {queue_no, book_no, doctor_list}
     */
    static async emitQueueAdded(io, Queue, data) {
        if (!io) return;

        const { queue_no, book_no, doctor_list } = data;

        // Emit queue added event
        this.emitQueueEvent(io, 'added', { queue_no, book_no, doctor_list });

        // Emit updated counts for affected doctors
        for (const doctor of doctor_list) {
            const count = await Queue.countDocuments({ 'doctor_list.doctor_id': doctor.doctor_id });
            this.emitQueueEvent(io, 'count-updated', {
                doctor_id: doctor.doctor_id,
                count
            });
        }
    }

    /**
     * Emit queue removed event with automatic count updates
     * @param {Object} io - Socket.IO instance
     * @param {Object} Queue - Queue model
     * @param {number} book_no - Book number
     * @param {Array} affectedDoctors - List of affected doctors
     */
    static async emitQueueRemoved(io, Queue, book_no, affectedDoctors) {
        if (!io) return;

        // Emit queue removed event
        this.emitQueueEvent(io, 'removed', { book_no });

        // Emit updated counts for affected doctors
        for (const doctor of affectedDoctors) {
            const count = await Queue.countDocuments({ 'doctor_list.doctor_id': doctor.doctor_id });
            this.emitQueueEvent(io, 'count-updated', {
                doctor_id: doctor.doctor_id,
                count
            });
        }
    }

    /**
     * Emit doctor assigned event
     * @param {Object} io - Socket.IO instance
     * @param {Object} data - Assignment data {book_no, doctor_id, doctor_name, patient_name, queue_type}
     */
    static emitDoctorAssigned(io, data) {
        this.emitGeneralEvent(io, 'doctor:assigned', data);
    }

    /**
     * Emit vitals recorded event
     * @param {Object} io - Socket.IO instance
     * @param {Object} data - Vitals data {book_no, queue_type}
     */
    static emitVitalsRecorded(io, data) {
        this.emitAnalyticsEvent(io, 'vitals-recorded', data);
    }

    /**
     * Emit consultation completed event
     * @param {Object} io - Socket.IO instance
     * @param {Object} data - Consultation data {book_no, doctor_id, doctor_name}
     */
    static emitConsultationCompleted(io, data) {
        this.emitAnalyticsEvent(io, 'consultation-completed', data);
    }

    /**
     * Emit patient registered event
     * @param {Object} io - Socket.IO instance
     * @param {Object} data - Patient data {book_no, patient_name, patient_sex, patient_area, timestamp, visit_type, follow_up_type}
     */
    static emitPatientRegistered(io, data) {
        this.emitAnalyticsEvent(io, 'patient-registered', data);
    }
}

module.exports = SocketEmitter;
