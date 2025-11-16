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
}, {
  timestamps: true,
  versionKey: false
});

export const MeetingModel = mongoose.model("ChimeMeeting", MeetingSchema);