import mongoose, { Schema } from 'mongoose'

const SchedulerSchema = new Schema(
  {
    appointmentId: { type: String, required: true, index: true },
    scheduledAt: { type: Date, required: true },
    status: { type: String, default: 'scheduled' },
    invitees: { type: [String], default: [] },
    //Ignore null values for unique fields
    meetingId: { type: String, unique: true, sparse: true },
    meetingTokenForPatient: { type: String, unique: true, sparse: true },
    meetingTokenForDoctor: { type: String, unique: true, sparse: true },
  },
  {
    timestamps: true
  }
)

export const SchedulerModel = mongoose.model('Appointment-Scheduler', SchedulerSchema)
