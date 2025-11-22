import mongoose from 'mongoose'

const AppointmentSchema = new mongoose.Schema(
  {
    address: {
      type: String
    },
    date: {
      type: Date,
      required: true
    },
    departmentId: {
      type: String
    },
    doctor_email: {
      type: String,
      required: true
    },
    is_calling_attached: {
      type: Boolean,
      default: false
    },
    meeting_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting'
    },
    doctor_name: {
      type: String,
      required: true
    },
    doctor_specialization: {
      type: String
    },
    end_time: {
      type: Date,
      required: true
    },
    hospital: {
      type: String,
      required: true
    },
    patient_mrn: {
      type: String
    },
    patient_name: {
      type: String
      // required: true
    },
    patient_phone: {
      type: String
    },
    room_no: {
      type: String
    },
    start_time: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      default: 'booked'
    },
    reason: {
      type: String
    },
    admission_from: {
      type: String,
      default: 'in-app'
    },
    patient_info: {
      type: Object
    },
    document: {
      type: String,
      required: false
    },
    package_info: {
      type: Object,
      required: false
    },
    payment_info: {
      type: Object,
      required: false
    },
    is_reminder_sent: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    strict: false
  }
)

AppointmentSchema.index({ date: 1, start_time: 1, end_time: 1 })
AppointmentSchema.index({ start_time: 1, end_time: 1, hospital: 1 })
AppointmentSchema.index({ doctor_email: 1, start_time: 1, end_time: 1 })
AppointmentSchema.index({ hospital: 1 })
AppointmentSchema.index({ departmentId: 1 })
AppointmentSchema.index({ doctor_email: 1 })
AppointmentSchema.index({ patient_mrn: 1 })

export const AppointmentModel = mongoose.model('Appointment', AppointmentSchema)
