import mongoose from "mongoose";

const MediaPlacementSchema = new mongoose.Schema({
  AudioHostUrl: String,
  AudioFallbackUrl: String,
  SignalingUrl: String,
  TurnControlUrl: String,
  ScreenDataUrl: String,
  ScreenViewingUrl: String,
  ScreenSharingUrl: String,
  EventIngestionUrl: String
}, { _id: false });

const AudioFeatureSchema = new mongoose.Schema({
  EchoReduction: String
}, { _id: false });

const VideoFeatureSchema = new mongoose.Schema({
  MaxResolution: String
}, { _id: false });

const ContentFeatureSchema = new mongoose.Schema({
  MaxResolution: String
}, { _id: false });

const AttendeeFeatureSchema = new mongoose.Schema({
  MaxCount: Number
}, { _id: false });

const MeetingFeaturesSchema = new mongoose.Schema({
  Audio: AudioFeatureSchema,
  Video: VideoFeatureSchema,
  Content: ContentFeatureSchema,
  Attendee: AttendeeFeatureSchema
}, { _id: false });

const MeetingSchema = new mongoose.Schema({
  MeetingId: {
    type: String,
    required: true,
    index: true
  },
  ExternalMeetingId: {
    type: String,
    index: true
  },
  MediaRegion: String,

  MediaPlacement: MediaPlacementSchema,

  MeetingFeatures: MeetingFeaturesSchema,

  TenantIds: {
    type: [String],
    default: []
  },

  MeetingArn: {
    type: String,
    index: true
  },

  // New fields for scheduling and invitation system
  title: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    trim: true
  },

  createdBy: {
    type: String,
    required: true,
    index: true
  },

  // Meeting type: instant or scheduled
  meetingType: {
    type: String,
    enum: ['instant', 'scheduled'],
    default: 'instant',
    index: true
  },

  // For scheduled meetings, reference to schedule
  hasSchedule: {
    type: Boolean,
    default: false
  },

  // Meeting status
  status: {
    type: String,
    enum: ['pending', 'active', 'ended', 'cancelled'],
    default: 'pending',
    index: true
  },

  // Tracking
  participantCount: {
    type: Number,
    default: 0
  },

  startedAt: Date,
  endedAt: Date,

  // Meeting settings
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    requiresApproval: {
      type: Boolean,
      default: false
    },
    allowRecording: {
      type: Boolean,
      default: true
    },
    maxParticipants: {
      type: Number,
      default: 5
    },
    enableWaitingRoom: {
      type: Boolean,
      default: false
    }
  },

  // Metadata
  tags: [String],
  category: String
}, {
  timestamps: true,
  versionKey: false
});

// Compound indexes for common queries
MeetingSchema.index({ createdBy: 1, status: 1 });
MeetingSchema.index({ meetingType: 1, status: 1 });
MeetingSchema.index({ status: 1, createdAt: -1 });

// Virtual for checking if meeting is active
MeetingSchema.virtual('isActive').get(function () {
  return this.status === 'active';
});

// Virtual for duration (if meeting has ended)
MeetingSchema.virtual('duration').get(function () {
  if (this.startedAt && this.endedAt) {
    return Math.floor((this.endedAt - this.startedAt) / 1000 / 60); // in minutes
  }
  return null;
});

// Method to start meeting
MeetingSchema.methods.start = async function () {
  this.status = 'active';
  this.startedAt = new Date();
  return await this.save();
};

// Method to end meeting
MeetingSchema.methods.end = async function () {
  this.status = 'ended';
  this.endedAt = new Date();
  return await this.save();
};

// Method to increment participant count
MeetingSchema.methods.addParticipant = async function () {
  this.participantCount += 1;
  if (this.status === 'pending') {
    await this.start();
  }
  return await this.save();
};

// Method to decrement participant count
MeetingSchema.methods.removeParticipant = async function () {
  this.participantCount = Math.max(0, this.participantCount - 1);
  return await this.save();
};

export const MeetingModel = mongoose.model("ChimeMeeting", MeetingSchema);
