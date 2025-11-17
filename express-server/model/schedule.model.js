import mongoose from "mongoose";

const MeetingScheduleSchema = new mongoose.Schema(
  {
    meetingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      ref: 'ChimeMeeting'
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

    // Duration in minutes
    scheduledDuration: {
      type: Number,
      required: true,
      min: 1,
      max: 1440 // Max 24 hours
    },

    timezone: {
      type: String,
      default: 'UTC'
    },

    status: {
      type: String,
      enum: ['scheduled', 'active', 'completed', 'cancelled', 'expired'],
      default: 'scheduled',
      index: true
    },

    // When the actual Chime SDK meeting was created
    chimeCreatedAt: Date,

    // When the meeting actually started (first participant joined)
    actualStartTime: Date,

    // When the meeting actually ended (last participant left)
    actualEndTime: Date,

    // Reminders configuration
    reminders: {
      enabled: {
        type: Boolean,
        default: true
      },
      intervals: [{
        type: String,
        enum: ['24h', '1h', '30min', '15min', '5min']
      }],
      sentReminders: [{
        interval: String,
        sentAt: Date,
        recipientCount: Number
      }]
    },

    // Recurrence settings (for future enhancement)
    recurrence: {
      enabled: {
        type: Boolean,
        default: false
      },
      pattern: {
        type: String,
        enum: ['daily', 'weekly', 'biweekly', 'monthly']
      },
      endsOn: Date,
      occurrenceCount: Number
    },

    // Meeting configuration
    settings: {
      autoActivate: {
        type: Boolean,
        default: true,
        description: 'Automatically create Chime meeting at scheduled time'
      },
      activateMinutesBefore: {
        type: Number,
        default: 15,
        min: 0,
        max: 60
      },
      autoEnd: {
        type: Boolean,
        default: false,
        description: 'Automatically end meeting after scheduled duration'
      },
      allowEarlyJoin: {
        type: Boolean,
        default: true
      },
      earlyJoinMinutes: {
        type: Number,
        default: 15,
        min: 0,
        max: 60
      }
    },

    // Cancellation info
    cancellation: {
      cancelledAt: Date,
      cancelledBy: String,
      reason: String
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Compound indexes for queries
MeetingScheduleSchema.index({ status: 1, scheduledStartTime: 1 });
MeetingScheduleSchema.index({ scheduledStartTime: 1, status: 1 });

// Virtual for checking if meeting is upcoming
MeetingScheduleSchema.virtual('isUpcoming').get(function () {
  return this.status === 'scheduled' && this.scheduledStartTime > new Date();
});

// Virtual for checking if meeting should be activated
MeetingScheduleSchema.virtual('shouldActivate').get(function () {
  if (this.status !== 'scheduled' || !this.settings.autoActivate) {
    return false;
  }

  const now = new Date();
  const activationTime = new Date(this.scheduledStartTime.getTime() - (this.settings.activateMinutesBefore * 60000));

  return now >= activationTime;
});

// Virtual for checking if early join is allowed
MeetingScheduleSchema.virtual('canJoinEarly').get(function () {
  if (!this.settings.allowEarlyJoin) {
    return false;
  }

  const now = new Date();
  const earlyJoinTime = new Date(this.scheduledStartTime.getTime() - (this.settings.earlyJoinMinutes * 60000));

  return now >= earlyJoinTime && this.scheduledStartTime > now;
});

// Method to activate meeting
MeetingScheduleSchema.methods.activate = async function () {
  if (this.status !== 'scheduled') {
    throw new Error('Can only activate scheduled meetings');
  }

  this.status = 'active';
  this.actualStartTime = new Date();

  return await this.save();
};

// Method to complete meeting
MeetingScheduleSchema.methods.complete = async function () {
  if (this.status !== 'active') {
    throw new Error('Can only complete active meetings');
  }

  this.status = 'completed';
  this.actualEndTime = new Date();

  return await this.save();
};

// Method to cancel meeting
MeetingScheduleSchema.methods.cancel = async function (userId, reason = null) {
  if (this.status === 'completed') {
    throw new Error('Cannot cancel completed meetings');
  }

  this.status = 'cancelled';
  this.cancellation = {
    cancelledAt: new Date(),
    cancelledBy: userId,
    reason: reason
  };

  return await this.save();
};

// Method to mark reminder as sent
MeetingScheduleSchema.methods.markReminderSent = async function (interval, recipientCount) {
  this.reminders.sentReminders.push({
    interval: interval,
    sentAt: new Date(),
    recipientCount: recipientCount
  });

  return await this.save();
};

export const MeetingScheduleModel = mongoose.model("MeetingSchedule", MeetingScheduleSchema);
