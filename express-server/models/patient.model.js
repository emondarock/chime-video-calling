import mongoose from 'mongoose'

const { Schema } = mongoose

const commentSchema = new Schema({
  comment: { type: String },
  departmentId: { type: String },
  departmentName: { type: String },
  timeStamp: { type: String } // You might want to use Date if you're handling timestamps
})

const labRequisitionSchema = new Schema({
  createdAt: { type: Date },
  doctor_email: { type: String },
  comments: [commentSchema],
  file: { type: String }
})

const patientSchema = new Schema(
  {
    mrn: { type: String },
    address: { type: String },
    admission_date: { type: String }, // Consider using Date
    admission_id: { type: String },
    admission_status: { type: String },
    allergies: { type: String },
    age: { type: String },
    departmentId: { type: String },
    bg: { type: String },
    bmi: { type: String },
    diagnosis: { type: String },
    dob: { type: String }, // Consider using Date
    doctor_email: { type: [String] },
    ec: { type: String },
    fd: { type: String },
    email: { type: String },
    familyId: { type: String },
    familyName: { type: String },
    fn: { type: String },
    branch: { type: String },
    height: { type: String },
    hmo_dependant_code: { type: String },
    hmo_enrole_number: { type: String },
    hospital: { type: [String] },
    immunization: { type: String },
    lab_requisition_files: [labRequisitionSchema],
    ln: { type: String },
    medCond: { type: String },
    mn: { type: String },
    ms: { type: String },
    nin: { type: String },
    phone: { type: String },
    searchField: { type: String },
    sh: { type: String },
    smoker: { type: String },
    time: { type: Date }, // Change to Date type for better handling of time
    weight: { type: String },
    medical_information: {
      type: [Schema.Types.Mixed]
    }
  },
  {
    timestamps: true,
    strict: false
  }
)

patientSchema.index({ mrn: 1 }, { unique: true })
patientSchema.index({ hospital: 1, departmentId: 1 })
patientSchema.index({ doctor_email: 1, departmentId: 1, admission_status: 1 })
patientSchema.index({ fn: 'text', ln: 'text', email: 'text' })
patientSchema.index({ familyId: 1 })

// Create a model
const Patient = mongoose.model('Patient', patientSchema)

export default Patient
