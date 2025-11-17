import { CreateAttendeeCommand, CreateMeetingCommand, CreateMeetingWithAttendeesCommand, DeleteAttendeeCommand, DeleteMeetingCommand, GetMeetingCommand, ListAttendeesCommand, StartMeetingTranscriptionCommand, StopMeetingTranscriptionCommand } from "@aws-sdk/client-chime-sdk-meetings"
import { chimeSdk } from "../utils/chime-sdk.utils.js"
import { v4 as uuidv4 } from 'uuid';
import { MeetingModel } from "../model/meeting.model.js";
import { AttendeeModel } from "../model/attendee.model.js";

export const createMeeting = async (userId) => {
  console.log('Creating meeting for userId:', userId);
  const command = new CreateMeetingWithAttendeesCommand({
    ClientRequestToken: uuidv4(),
    MediaRegion: process.env.REGION || 'us-east-1',
    ExternalMeetingId: uuidv4(),
    MeetingFeatures: {
      Audio: {
        EchoReduction: "AVAILABLE"
      },
      Video: {
        MaxResolution: "HD"
      },
      Attendee: {
        MaxCount: 5
      },
      Content: {
        MaxResolution: "FHD"
      }
    },
    //TODO: Enable notifications by uncommenting the following lines and setting the NOTIFICATION_LAMBDA_ARN environment variable
    // NotificationsConfiguration: {
    //   LambdaFunctionArn: process.env.NOTIFICATION_LAMBDA_ARN
    // },
    Attendees: [
      {
        ExternalUserId: userId,
        Capabilities: {
          Audio: "SendReceive",
          Video: "SendReceive",
          Content: "SendReceive"
        }
      }
    ]

  })
  const response = await chimeSdk.send(command);
  const meeting = new MeetingModel(response?.Meeting);
  await meeting.save();
  const attendee = response?.Attendees?.[0];
  const attendeeDoc = new AttendeeModel({
    ...attendee,
    MeetingId: meeting.MeetingId
  });
  await attendeeDoc.save();
  return response?.Meeting;
}

export const addAttendee = async (meetingId, userId) => {
  const attendee = await AttendeeModel.findOne({ MeetingId: meetingId, ExternalUserId: userId });
  if (attendee) {
    return attendee;
  }
  const command = new CreateAttendeeCommand({
    MeetingId: meetingId,
    ExternalUserId: userId,
    Capabilities: {
      Audio: "SendReceive",
      Video: "SendReceive",
      Content: "SendReceive"
    }
  })
  const response = await chimeSdk.send(command);
  const attendeeDoc = new AttendeeModel({
    ...response?.Attendee,
    MeetingId: meetingId
  });
  await attendeeDoc.save();
  return response?.Attendee
}

export const deleteAttendee = async (meetingId, attendeeId) => {
  const command = new DeleteAttendeeCommand({
    MeetingId: meetingId,
    AttendeeId: attendeeId
  })
  await AttendeeModel.deleteOne({ MeetingId: meetingId, AttendeeId: attendeeId });
  return await chimeSdk.send(command);
}

export const deleteMeeting = async (meetingId) => {
  const command = new DeleteMeetingCommand({
    MeetingId: meetingId
  })
  await MeetingModel.deleteOne({ MeetingId: meetingId });
  await AttendeeModel.deleteMany({ MeetingId: meetingId });
  return await chimeSdk.send(command);
}

export const getMeeting = async (meetingId) => {
  const command = new GetMeetingCommand({
    MeetingId: meetingId
  })
  return await chimeSdk.send(command);
}

export const listAttendees = async (meetingId) => {
  const command = new ListAttendeesCommand({
    MeetingId: meetingId
  })
  return await chimeSdk.send(command);
}

export const startMeetingTranscription = async (meetingId) => {
  const command = new StartMeetingTranscriptionCommand({
    MeetingId: meetingId,
    TranscriptionConfiguration: {
      EngineTranscribeSettings: {
        LanguageCode: "en-US",
        Region: process.env.REGION || 'us-east-1',
        VocabularyFilterMethod: "remove",
        VocabularyName: "MedicalVocabulary",
        ContentIdentificationType: "PII",
        ContentRedactionType: "PII",
        PartialResultsStability: "high",
        PunctuationEnabled: true,
        ShowSpeakerLabels: true,
        MaxSpeakerLabels: 2,
        ChannelIdentification: false
      },
      EngineTranscribeMedicalSettings: {
        LanguageCode: "en-US",
        Specialty: "PRIMARYCARE",
        Type: "CONVERSATION",
        VocabularyFilterMethod: "remove",
        Region: process.env.REGION || 'us-east-1',
        VocabularyName: "MedicalVocabulary",
        ContentIdentificationType: "PHI",
      }
    }
  })
  return await chimeSdk.send(command);
}

export const stopMeetingTranscription = async (meetingId) => {
  const command = new StopMeetingTranscriptionCommand({
    MeetingId: meetingId
  })
  return await chimeSdk.send(command);
}
