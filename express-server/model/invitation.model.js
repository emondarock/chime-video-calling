import mongoose from "mongoose";

const InvitationSchema = new mongoose.Schema(
  {
    meetingId: {
      type: String,
      required: true,
      index: true,
      ref: 'ChimeMeeting'
    },

    inviterUserId: {
      type: String,
      required: true,
      index: true
    },

    inviteeEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },

    inviteeUserId: {
      type: String,
      index: true
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired', 'cancelled'],
      default: 'pending',
      index: true
    },

    invitationToken: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    scheduledStartTime: {
      type: Date,
      required: true,
      index: true
    },

    scheduledEndTime: {
      type: Date,
      index: true
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true
    },

    sentAt: {
      type: Date,
      default: Date.now
    },

    respondedAt: {
      type: Date
    },

    metadata: {
      meetingTitle: {
        type: String,
        required: true
      },
      meetingDescription: String,
      agenda: String,
      timezone: {
        type: String,
        default: 'UTC'
      },
      remindersSent: [{
        type: {
          type: String,
          enum: ['24h', '1h', '15min', 'custom']
        },
        sentAt: Date
      }]
    },

    // Optional: RSVP message from invitee
    responseMessage: String,

    // Track email delivery
    emailStatus: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      deliveryStatus: {
        type: String,
        enum: ['pending', 'delivered', 'failed', 'bounced']
      },
      errorMessage: String
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Compound indexes for common queries
InvitationSchema.index({ meetingId: 1, status: 1 });
InvitationSchema.index({ inviteeEmail: 1, status: 1 });
InvitationSchema.index({ inviterUserId: 1, createdAt: -1 });
InvitationSchema.index({ scheduledStartTime: 1, status: 1 });

// Index for expiration cleanup
InvitationSchema.index({ expiresAt: 1, status: 1 });

// Virtual for checking if invitation is still valid
InvitationSchema.virtual('isValid').get(function () {
  return this.status === 'pending' && this.expiresAt > new Date();
});

// Method to check if invitation can be accepted
InvitationSchema.methods.canAccept = function () {
  return this.status === 'pending' && this.expiresAt > new Date();
};

// Method to accept invitation
InvitationSchema.methods.accept = async function (userId = null) {
  if (!this.canAccept()) {
    throw new Error('Invitation is no longer valid');
  }

  this.status = 'accepted';
  this.respondedAt = new Date();
  if (userId) {
    this.inviteeUserId = userId;
  }

  return await this.save();
};

// Method to decline invitation
InvitationSchema.methods.decline = async function (message = null) {
  if (this.status !== 'pending') {
    throw new Error('Can only decline pending invitations');
  }

  this.status = 'declined';
  this.respondedAt = new Date();
  if (message) {
    this.responseMessage = message;
  }

  return await this.save();
};

export const InvitationModel = mongoose.model("MeetingInvitation", InvitationSchema);
