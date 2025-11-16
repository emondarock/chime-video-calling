import { addAttendee, createMeeting, deleteMeeting, getMeeting, listAttendees, startMeetingTranscription, stopMeetingTranscription } from "./service/chime-sdk.service.js";
import { connect } from "./utils/db.js";

/**
 * A Lambda function for Chime SDK operations.
 */
export const lambdaHandler = async (event, context) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  await connect();
  try {
    // Parse the incoming request body
    const body = event.body ? JSON.parse(event.body) : {};
    const queryParams = event.queryStringParameters || {};
    console.log('Body:', body);

    //Find path to determine operation
    const path = event.path || '/';
    let response
    switch (path) {
      case '/create-meeting':
        const meeting = await createMeeting(body.userId);
        response = {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            ...meeting,
            message: 'Meeting created successfully'
          })
        };
        break;

      case '/add-attendee':
        const attendee = await addAttendee(body.meetingId, body.userId);
        response = {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            ...attendee,
            message: 'Attendee added successfully'
          })
        };
        break;

      case '/get-meeting':
        const meetingInfo = await getMeeting(queryParams.meetingId);
        response = {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            ...meetingInfo,
            message: 'Meeting retrieved successfully'
          })
        };
        break;

      case '/list-attendees':
        const attendees = await listAttendees(queryParams.meetingId);
        response = {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            ...attendees,
            message: 'Attendees listed successfully'
          })
        };
        break;

      case '/delete-attendee':
        const deleteAttendeeResponse = await deleteAttendee(body.meetingId, body.attendeeId);
        response = {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            ...deleteAttendeeResponse,
            message: 'Attendee deleted successfully'
          })
        };
        break;

      case '/delete-meeting':
        const deleteMeetingResponse = await deleteMeeting(body.meetingId);
        response = {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            ...deleteMeetingResponse,
            message: 'Meeting deleted successfully'
          })
        };
        break;

      case '/start-meeting-transcription':
        const startTranscriptionResponse = await startMeetingTranscription(body.meetingId);
        response = {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            ...startTranscriptionResponse,
            message: 'Meeting transcription started successfully'
          })
        };
        break;

      case '/stop-meeting-transcription':
        const stopTranscriptionResponse = await stopMeetingTranscription(body.meetingId);
        response = {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            ...stopTranscriptionResponse,
            message: 'Meeting transcription stopped successfully'
          })
        };
        break;
      default:
        response = {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            message: 'Invalid path'
          })
        };
        break;
    }

    return response;
  } catch (error) {
    console.error('Error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Internal server error',
        error: error.message
      })
    };
  }
};

export default { lambdaHandler };
