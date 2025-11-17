# Chime SDK Express Server

Express.js server for Amazon Chime SDK meeting operations. This server has been migrated from AWS SAM/Lambda to a standalone Express application.

## Features

- Create and manage Chime SDK meetings
- Add and remove attendees
- Start/stop meeting transcription
- MongoDB integration for meeting and attendee persistence
- CORS enabled
- RESTful API endpoints

## Prerequisites

- Node.js (v18 or higher)
- MongoDB instance
- AWS Account with Chime SDK access
- AWS IAM credentials with appropriate permissions

## Installation

1. Navigate to the express-server directory:
```bash
cd express-server
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` file with your configuration:
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
   - `REGION`: AWS region (default: us-east-1)
   - `MONGODB_URI`: MongoDB connection string
   - `PORT`: Server port (default: 3000)

## Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## API Endpoints

### Health Check
```http
GET /health
```
Returns server status.

### Create Meeting
```http
POST /create-meeting
Content-Type: application/json

{
  "userId": "user123"
}
```

### Add Attendee
```http
POST /add-attendee
Content-Type: application/json

{
  "meetingId": "meeting-id-here",
  "userId": "user456"
}
```

### Get Meeting
```http
GET /get-meeting?meetingId=meeting-id-here
```

### List Attendees
```http
GET /list-attendees?meetingId=meeting-id-here
```

### Delete Attendee
```http
POST /delete-attendee
Content-Type: application/json

{
  "meetingId": "meeting-id-here",
  "attendeeId": "attendee-id-here"
}
```

### Delete Meeting
```http
POST /delete-meeting
Content-Type: application/json

{
  "meetingId": "meeting-id-here"
}
```

### Start Meeting Transcription
```http
POST /start-meeting-transcription
Content-Type: application/json

{
  "meetingId": "meeting-id-here"
}
```

### Stop Meeting Transcription
```http
POST /stop-meeting-transcription
Content-Type: application/json

{
  "meetingId": "meeting-id-here"
}
```

## Project Structure

```
express-server/
├── model/                  # MongoDB models
│   ├── attendee.model.js  # Attendee schema
│   └── meeting.model.js   # Meeting schema
├── service/               # Business logic
│   └── chime-sdk.service.js
├── utils/                 # Utility functions
│   ├── chime-sdk.utils.js # AWS SDK configuration
│   └── db.js              # MongoDB connection
├── server.js              # Main Express application
├── package.json           # Dependencies
├── .env.example           # Environment variables template
└── README.md              # This file
```

## Migration from AWS SAM

This Express server replaces the AWS SAM Lambda function with the following key changes:

1. **Lambda Handler → Express Routes**: The Lambda handler's path-based routing has been converted to dedicated Express routes
2. **Event Parsing**: Lambda event parsing (body, queryStringParameters) replaced with Express middleware (express.json(), req.body, req.query)
3. **Response Format**: Lambda response objects replaced with Express res.json() and status codes
4. **Error Handling**: Lambda try-catch blocks converted to Express error handling middleware
5. **Connection Management**: Database connection moved to server startup instead of per-request

## AWS IAM Permissions Required

Your AWS credentials need the following Chime SDK permissions:
- `chime:CreateMeeting`
- `chime:CreateMeetingWithAttendees`
- `chime:CreateAttendee`
- `chime:GetMeeting`
- `chime:ListAttendees`
- `chime:DeleteMeeting`
- `chime:DeleteAttendee`
- `chime:StartMeetingTranscription`
- `chime:StopMeetingTranscription`

## Testing

You can test the API using:
- Postman (import the ChimeSDK-API.postman_collection.json from the root directory)
- cURL
- Any HTTP client

Example cURL request:
```bash
curl -X POST http://localhost:3000/create-meeting \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-123"}'
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Verify the MONGODB_URI in your .env file
- Check network connectivity if using remote MongoDB

### AWS Credentials Issues
- Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set correctly
- Ensure the IAM user has necessary Chime SDK permissions
- Check the AWS region matches your configuration

### Port Already in Use
- Change the PORT in your .env file
- Kill any process using the default port 3000

## License

ISC
