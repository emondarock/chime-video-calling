import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { connect } from './utils/db.js';
import {
  addAttendee,
  createMeeting,
  deleteMeeting,
  deleteAttendee,
  getMeeting,
  listAttendees,
  startMeetingTranscription,
  stopMeetingTranscription
} from './service/chime-sdk.service.js';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Create Meeting
app.post('/create-meeting', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: 'userId is required'
      });
    }

    const meeting = await createMeeting(userId);

    res.status(200).json({
      ...meeting,
      message: 'Meeting created successfully'
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({
      message: 'Failed to create meeting',
      error: error.message
    });
  }
});

// Add Attendee
app.post('/add-attendee', async (req, res) => {
  try {
    const { meetingId, userId } = req.body;

    if (!meetingId || !userId) {
      return res.status(400).json({
        message: 'meetingId and userId are required'
      });
    }

    const attendee = await addAttendee(meetingId, userId);

    res.status(200).json({
      ...attendee,
      message: 'Attendee added successfully'
    });
  } catch (error) {
    console.error('Error adding attendee:', error);
    res.status(500).json({
      message: 'Failed to add attendee',
      error: error.message
    });
  }
});

// Get Meeting
app.get('/get-meeting', async (req, res) => {
  try {
    const { meetingId } = req.query;

    if (!meetingId) {
      return res.status(400).json({
        message: 'meetingId is required'
      });
    }

    const meetingInfo = await getMeeting(meetingId);

    res.status(200).json({
      ...meetingInfo,
      message: 'Meeting retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting meeting:', error);
    res.status(500).json({
      message: 'Failed to get meeting',
      error: error.message
    });
  }
});

// List Attendees
app.get('/list-attendees', async (req, res) => {
  try {
    const { meetingId } = req.query;

    if (!meetingId) {
      return res.status(400).json({
        message: 'meetingId is required'
      });
    }

    const attendees = await listAttendees(meetingId);

    res.status(200).json({
      ...attendees,
      message: 'Attendees listed successfully'
    });
  } catch (error) {
    console.error('Error listing attendees:', error);
    res.status(500).json({
      message: 'Failed to list attendees',
      error: error.message
    });
  }
});

// Delete Attendee
app.post('/delete-attendee', async (req, res) => {
  try {
    const { meetingId, attendeeId } = req.body;

    if (!meetingId || !attendeeId) {
      return res.status(400).json({
        message: 'meetingId and attendeeId are required'
      });
    }

    const result = await deleteAttendee(meetingId, attendeeId);

    res.status(200).json({
      ...result,
      message: 'Attendee deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attendee:', error);
    res.status(500).json({
      message: 'Failed to delete attendee',
      error: error.message
    });
  }
});

// Delete Meeting
app.post('/delete-meeting', async (req, res) => {
  try {
    const { meetingId } = req.body;

    if (!meetingId) {
      return res.status(400).json({
        message: 'meetingId is required'
      });
    }

    const result = await deleteMeeting(meetingId);

    res.status(200).json({
      ...result,
      message: 'Meeting deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({
      message: 'Failed to delete meeting',
      error: error.message
    });
  }
});

// Start Meeting Transcription
app.post('/start-meeting-transcription', async (req, res) => {
  try {
    const { meetingId } = req.body;

    if (!meetingId) {
      return res.status(400).json({
        message: 'meetingId is required'
      });
    }

    const result = await startMeetingTranscription(meetingId);

    res.status(200).json({
      ...result,
      message: 'Meeting transcription started successfully'
    });
  } catch (error) {
    console.error('Error starting transcription:', error);
    res.status(500).json({
      message: 'Failed to start meeting transcription',
      error: error.message
    });
  }
});

// Stop Meeting Transcription
app.post('/stop-meeting-transcription', async (req, res) => {
  try {
    const { meetingId } = req.body;

    if (!meetingId) {
      return res.status(400).json({
        message: 'meetingId is required'
      });
    }

    const result = await stopMeetingTranscription(meetingId);

    res.status(200).json({
      ...result,
      message: 'Meeting transcription stopped successfully'
    });
  } catch (error) {
    console.error('Error stopping transcription:', error);
    res.status(500).json({
      message: 'Failed to stop meeting transcription',
      error: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: err.message
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connect();
    console.log('Database connected successfully');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n🚀 Express server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`\nAvailable endpoints:`);
      console.log(`  POST /create-meeting`);
      console.log(`  POST /add-attendee`);
      console.log(`  GET  /get-meeting`);
      console.log(`  GET  /list-attendees`);
      console.log(`  POST /delete-attendee`);
      console.log(`  POST /delete-meeting`);
      console.log(`  POST /start-meeting-transcription`);
      console.log(`  POST /stop-meeting-transcription\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

startServer();
