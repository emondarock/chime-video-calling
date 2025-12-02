import { SchedulerModel } from '../models/scheduler.schema.js'
import { AppointmentModel } from '../models/appointment.schema.js'
import { addAttendee, createMeeting, getMeeting } from './chime-sdk.service.js'
import jwt from 'jsonwebtoken'

export const checkIfMeetingWithinTimeFrame = async (appointmentId, user) => {
  const { userEmail } = user
  const now = new Date()
  const scheduler = await SchedulerModel.findOne({ appointmentId })
  if (!scheduler) {
    throw new Error('Scheduler entry not found')
  }

  const { invitees } = scheduler
  if (!invitees.includes(userEmail)) {
    return {
      valid: false,
      message: 'User is not an invitee for this meeting'
    }
  }

  // Check if current time is within 15 minutes before the meeting starts
  const meetingTime = new Date(scheduler.scheduledAt)
  const fifteenMinutesBeforeMeeting = new Date(meetingTime.getTime() - 15 * 60000)

  // Valid only if current time is between (meeting time - 15 min) and meeting time
  if (now < fifteenMinutesBeforeMeeting) {
    return {
      valid: false,
      message: 'Too early - meeting check-in opens 15 minutes before scheduled time'
    }
  } else {
    if (scheduler.status === 'started') {
      const meetingInfo = await getMeeting(scheduler.meetingId)
      const attendee = await addAttendee(scheduler.meetingId, userEmail)
      return {
        valid: true,
        message: 'Meeting is valid and already started',
        Meeting: meetingInfo.Meeting,
        Attendee: attendee
      }
    }
    // Create meeting
    const { Meeting, Attendee } = await createMeeting(userEmail)
    await AppointmentModel.updateOne(
      { _id: appointmentId },
      { meeting_id: Meeting.MeetingId, is_calling_attached: true }
    )
    await SchedulerModel.updateOne({ appointmentId }, { status: 'started', meetingId: Meeting.MeetingId })
    return {
      valid: true,
      message: 'Meeting is valid and created',
      Meeting,
      Attendee
    }
  }
}

export const checkWithJoinToken = async (meetingToken) => {
  const scheduler = await SchedulerModel.findOne({
    $or: [
      { meetingTokenForPatient: meetingToken },
      { meetingTokenForDoctor: meetingToken }
    ]
  })
  const now = new Date()
  if (!scheduler) {
    return {
      valid: false,
      message: 'Invalid meeting token'
    }
  }

  const meetingTime = new Date(scheduler.scheduledAt)
  const fifteenMinutesBeforeMeeting = new Date(meetingTime.getTime() - 15 * 60000)
  // if (now < fifteenMinutesBeforeMeeting) {
  //   return {
  //     valid: false,
  //     message: 'Too early - meeting check-in opens 15 minutes before scheduled time'
  //   }
  // }
  const decoded = jwt.verify(meetingToken, process.env.MEETING_JWT_SECRET)
  const userEmail = decoded.email
  console.log('Scheduler meeting status', scheduler.status)
  if (scheduler.status === 'started') {
    const meetingInfo = await getMeeting(scheduler.meetingId)
    const attendee = await addAttendee(scheduler.meetingId, userEmail)
    return {
      valid: true,
      message: 'Meeting is valid and already started',
      Meeting: meetingInfo.Meeting,
      Attendee: attendee
    }
  }

  // Create meeting
  const { Meeting, Attendee } = await createMeeting(userEmail)
  await SchedulerModel.updateOne({
    $or: [
      { meetingTokenForPatient: meetingToken },
      { meetingTokenForDoctor: meetingToken }
    ]
  }, { status: 'started', meetingId: Meeting.MeetingId })
  return {
    valid: true,
    message: 'Meeting is valid and created',
    Meeting,
    Attendee
  }
}
