import mongoose from 'mongoose'

const AttendeeSchema = new mongoose.Schema(
  {
    ExternalUserId: {
      type: String,
      required: true,
      index: true
    },

    AttendeeId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    JoinToken: {
      type: String,
      required: true
    },

    Capabilities: {
      Audio: {
        type: String,
        enum: ['SendReceive', 'Send', 'Receive', 'None'],
        default: 'SendReceive'
      },
      Video: {
        type: String,
        enum: ['SendReceive', 'Send', 'Receive', 'None'],
        default: 'SendReceive'
      },
      Content: {
        type: String,
        enum: ['SendReceive', 'Send', 'Receive', 'None'],
        default: 'SendReceive'
      }
    },

    MeetingId: {
      type: String,
      required: false,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
)

export const AttendeeModel = mongoose.model('ChimeAttendee', AttendeeSchema)
