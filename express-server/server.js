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
import {
  createAppointment,
  deleteAnAppointmentFromDynamo,
  updateAppointment
} from './service/appointment.service.js';
import {
  findUpcomingAppointmentsAndSendReminders,
  getAllAppointment,
  getAppointmentWithDateRange,
  isDiscountAvailable
} from './helper/appointment.helper.js';
import { checkIfMeetingWithinTimeFrame, checkWithJoinToken } from './service/scheduler.service.js';
import jwt from 'jsonwebtoken';

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

// JWT authentication middleware
const authenticateUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Unauthorized - No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const decoded = jwt.decode(token);
    console.log('Decoded JWT:', decoded);
    // Extract user information from Cognito JWT token
    req.user = {
      userEmail: decoded.email,
      role: decoded['custom:role'] || decoded.role,
      sub_role: decoded['custom:sub_role'] || decoded.sub_role,
      hospital: decoded['custom:hospital'] || decoded.hospital,
      departmentId: decoded['custom:departmentId'] || decoded.departmentId,
      sub: decoded.sub,
      username: decoded['cognito:username']
    };

    next();
  } catch (error) {
    console.error('JWT decode error:', error);
    return res.status(401).json({
      message: 'Unauthorized - Invalid token'
    });
  }
};

// Optional authentication - only applies to protected routes
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization || req.headers['x-user-email']) {
    return authenticateUser(req, res, next);
  }
  req.user = null;
  next();
};

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

    const { Meeting, Attendee } = await createMeeting(userId);

    res.status(200).json({
      Meeting,
      Attendee,
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

// ==================== APPOINTMENT ROUTES ====================

// Create Appointment
app.post('/appointment/create', optionalAuth, async (req, res) => {
  try {
    const response = await createAppointment(req.body, req.user);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      message: 'Failed to create appointment',
      error: error.message
    });
  }
});

// Create Outside Appointment (for external clients like Evergreen Glow)
app.post('/appointment/outside/create', optionalAuth, async (req, res) => {
  try {
    const response = await createAppointment(
      { ...req.body, location: 'outside' },
      req.user
    );
    res.status(200).json(response);
  } catch (error) {
    console.error('Error creating outside appointment:', error);
    res.status(500).json({
      message: 'Failed to create appointment',
      error: error.message
    });
  }
});

// Update Appointment
app.post('/appointment/update', authenticateUser, async (req, res) => {
  try {
    const response = await updateAppointment(req.body, req.user);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      message: 'Failed to update appointment',
      error: error.message
    });
  }
});

// Get All Appointments
app.get('/appointment/get-all', authenticateUser, async (req, res) => {
  try {
    const response = await getAllAppointment(req.query, req.user);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting appointments:', error);
    res.status(500).json({
      message: 'Failed to get appointments',
      error: error.message
    });
  }
});

// Check Appointment Time Conflicts
app.post('/appointment/check-appointments', async (req, res) => {
  try {
    const { startTime, endTime, appointmentId, doctor_email, departmentId } = req.body;
    const response = await getAppointmentWithDateRange(
      startTime,
      endTime,
      appointmentId,
      doctor_email,
      departmentId
    );
    res.status(200).json(response);
  } catch (error) {
    console.error('Error checking appointments:', error);
    res.status(500).json({
      message: 'Failed to check appointments',
      error: error.message
    });
  }
});

// Check Meeting Timeframe (15-min window before meeting) - Authenticated users with appointmentId
app.post('/appointment/check-meeting', authenticateUser, async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const response = await checkIfMeetingWithinTimeFrame(appointmentId, req.user);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error checking meeting timeframe:', error);
    res.status(500).json({
      message: 'Failed to check meeting timeframe',
      error: error.message
    });
  }
});

// Join with Token (No JWT authentication required) - Public access via meeting token
app.get('/appointment/check-meeting', async (req, res) => {
  try {
    const { meetingToken } = req.query;
    const response = await checkWithJoinToken(meetingToken);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error checking meeting timeframe:', error);
    res.status(500).json({
      message: 'Failed to check meeting timeframe',
      error: error.message
    });
  }
})

// Delete Appointment
app.delete('/appointment/delete', authenticateUser, async (req, res) => {
  try {
    const { appointmentId } = req.query;

    if (!appointmentId) {
      return res.status(400).json({
        message: 'appointmentId is required'
      });
    }

    const response = await deleteAnAppointmentFromDynamo(appointmentId, req.user);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({
      message: 'Failed to delete appointment',
      error: error.message
    });
  }
});

// Check Discount Availability
app.post('/appointment/is-discount-available', async (req, res) => {
  try {
    const { hospital_email } = req.body;
    const response = await isDiscountAvailable(hospital_email);
    res.status(200).json({ isAvailable: response });
  } catch (error) {
    console.error('Error checking discount:', error);
    res.status(500).json({
      message: 'Failed to check discount availability',
      error: error.message
    });
  }
});

// Trigger Appointment Reminders (manually or via cron)
app.post('/appointment/send-reminders', async (req, res) => {
  try {
    await findUpcomingAppointmentsAndSendReminders();
    res.status(200).json({
      message: 'Reminders sent successfully'
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    res.status(500).json({
      message: 'Failed to send reminders',
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
      console.log(`\n📞 Chime SDK Endpoints:`);
      console.log(`  POST /create-meeting`);
      console.log(`  POST /add-attendee`);
      console.log(`  GET  /get-meeting`);
      console.log(`  GET  /list-attendees`);
      console.log(`  POST /delete-attendee`);
      console.log(`  POST /delete-meeting`);
      console.log(`  POST /start-meeting-transcription`);
      console.log(`  POST /stop-meeting-transcription`);
      console.log(`\n📅 Appointment Endpoints:`);
      console.log(`  POST /appointment/create`);
      console.log(`  POST /appointment/outside/create`);
      console.log(`  POST /appointment/update`);
      console.log(`  GET  /appointment/get-all`);
      console.log(`  POST /appointment/check-appointments`);
      console.log(`  POST /appointment/check-meeting`);
      console.log(`  DEL  /appointment/delete`);
      console.log(`  POST /appointment/is-discount-available`);
      console.log(`  POST /appointment/send-reminders\n`);
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
