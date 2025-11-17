# Phase 1: Database Schema Extensions - Completed ✅

## Overview
Created comprehensive database models for the meeting invitation and scheduling system.

---

## Models Created

### 1. **InvitationModel** (`model/invitation.model.js`)
Manages meeting invitations sent to participants.

**Key Fields:**
- `meetingId` - Reference to the meeting
- `inviterUserId` - User who sent the invitation
- `inviteeEmail` - Email of the invitee
- `inviteeUserId` - Optional user ID if invitee is registered
- `status` - pending | accepted | declined | expired | cancelled
- `invitationToken` - Unique UUID for secure joining
- `scheduledStartTime` - When the meeting is scheduled to start
- `expiresAt` - When the invitation expires
- `metadata` - Meeting title, description, agenda, timezone, reminders

**Features:**
- Email delivery tracking
- RSVP message support
- Automatic expiration handling
- Virtual `isValid` property
- Helper methods: `canAccept()`, `accept()`, `decline()`

**Indexes:**
- Single: meetingId, inviterUserId, inviteeEmail, status, invitationToken (unique)
- Compound: (meetingId, status), (inviteeEmail, status), (inviterUserId, createdAt), (scheduledStartTime, status)

---

### 2. **MeetingScheduleModel** (`model/schedule.model.js`)
Manages the scheduling and lifecycle of meetings.

**Key Fields:**
- `meetingId` - One-to-one reference to ChimeMeeting
- `scheduledStartTime` - When meeting should start
- `scheduledDuration` - Duration in minutes (1-1440)
- `timezone` - Timezone for the meeting
- `status` - scheduled | active | completed | cancelled | expired
- `chimeCreatedAt` - When actual Chime SDK meeting was created
- `actualStartTime/EndTime` - Real start/end times
- `reminders` - Configuration and tracking of sent reminders
- `settings` - Auto-activation, early join, auto-end settings
- `recurrence` - Support for recurring meetings (future)

**Features:**
- Flexible reminder system (24h, 1h, 30min, 15min, 5min)
- Auto-activation settings (create Chime meeting X minutes before start)
- Early join window
- Cancellation tracking with reason
- Virtual properties: `isUpcoming`, `shouldActivate`, `canJoinEarly`
- Helper methods: `activate()`, `complete()`, `cancel()`, `markReminderSent()`

**Indexes:**
- Compound: (status, scheduledStartTime), (scheduledStartTime, status)

---

### 3. **Updated MeetingModel** (`model/meeting.model.js`)
Enhanced existing meeting model with scheduling support.

**New Fields Added:**
- `title` - Meeting title (required)
- `description` - Meeting description
- `createdBy` - User who created the meeting
- `meetingType` - instant | scheduled
- `hasSchedule` - Boolean flag for scheduled meetings
- `status` - pending | active | ended | cancelled
- `participantCount` - Current number of participants
- `startedAt` / `endedAt` - Actual meeting times
- `settings` - isPublic, requiresApproval, allowRecording, maxParticipants, enableWaitingRoom
- `tags` - Array of tags for categorization
- `category` - Meeting category

**Features:**
- Virtual properties: `isActive`, `duration`
- Helper methods: `start()`, `end()`, `addParticipant()`, `removeParticipant()`
- Compound indexes for efficient querying

**Indexes Added:**
- Compound: (createdBy, status), (meetingType, status), (status, createdAt)

---

### 4. **Model Index** (`model/index.js`)
Central export file for all models for cleaner imports.

```javascript
export { MeetingModel } from './meeting.model.js';
export { AttendeeModel } from './attendee.model.js';
export { InvitationModel } from './invitation.model.js';
export { MeetingScheduleModel } from './schedule.model.js';
```

---

## Database Schema Relationships

```
MeetingModel (1) ←→ (1) MeetingScheduleModel
    ↓
    └─ (1) → (many) InvitationModel
    └─ (1) → (many) AttendeeModel
```

---

## Key Design Decisions

1. **Separate Schedule Model**
   - One-to-one with Meeting for cleaner separation of concerns
   - Allows instant meetings to exist without schedule overhead

2. **Invitation Token System**
   - Separate from Chime JoinToken
   - Allows invitations to exist before Chime meeting creation
   - Provides secure, trackable invite links

3. **Flexible Expiration**
   - Invitations have their own expiration
   - Separate from Chime SDK token expiration (24h)

4. **Status Tracking**
   - Multiple status fields at different levels (Meeting, Schedule, Invitation)
   - Enables comprehensive state management

5. **Timezone Support**
   - Store times in UTC
   - Include timezone field for proper localization

6. **Compound Indexes**
   - Optimized for common query patterns
   - Improves performance for list/filter operations

---

## Next Steps (Phase 2)

With the database schema in place, you can now:
1. Create API endpoints for scheduling meetings
2. Create invitation management endpoints
3. Implement email service integration
4. Build scheduled job system for reminders and activation

---

## Usage Example

```javascript
import { MeetingModel, InvitationModel, MeetingScheduleModel } from './model/index.js';

// Create a scheduled meeting
const meeting = new MeetingModel({
  title: 'Weekly Standup',
  description: 'Team sync meeting',
  createdBy: 'user123',
  meetingType: 'scheduled',
  hasSchedule: true
});
await meeting.save();

// Create schedule
const schedule = new MeetingScheduleModel({
  meetingId: meeting.MeetingId,
  scheduledStartTime: new Date('2025-11-20T10:00:00Z'),
  scheduledDuration: 60,
  timezone: 'America/New_York'
});
await schedule.save();

// Create invitations
const invitation = new InvitationModel({
  meetingId: meeting.MeetingId,
  inviterUserId: 'user123',
  inviteeEmail: 'colleague@example.com',
  invitationToken: uuidv4(),
  scheduledStartTime: schedule.scheduledStartTime,
  expiresAt: new Date(schedule.scheduledStartTime.getTime() + 86400000), // 24h after meeting
  metadata: {
    meetingTitle: meeting.title,
    meetingDescription: meeting.description
  }
});
await invitation.save();
```

---

## Database Considerations

- **Indexes**: All models have appropriate indexes for query performance
- **Validation**: Enum constraints on status fields prevent invalid states
- **Timestamps**: All models include automatic createdAt/updatedAt
- **References**: String references used (not ObjectId) to match Chime SDK IDs
- **Virtuals**: Computed properties don't persist but provide useful helpers

---

## Testing Recommendations

1. Test invitation expiration logic
2. Test schedule activation timing
3. Test meeting status transitions
4. Verify all indexes are created after first run
5. Test cascade operations (e.g., cancelling meeting should update invitations)
