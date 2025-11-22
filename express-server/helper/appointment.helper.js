import lodash from 'lodash'
const { difference, size } = lodash
import { AppointmentModel } from '../models/appointment.schema.js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'

dayjs.extend(utc)

import { sendEmailForAppointmentConfirmation } from './email.helper.js'
import { reminderTemplate } from '../template/reminder.js'
export const getAllAppointment = async ({ limit, skip = 0, patient_mrn, startTime, endTime }, user) => {
  console.log('User is ', user)
  const userRole = user.role.toLowerCase()


  const query = {}
  if (userRole === 'doctor') {
    query['doctor_email'] = user.userEmail
  } else if (userRole === 'hospital-admin' || userRole === 'department-admin') {
    if (userRole === 'department-admin' && user.departmentId) {
      query['departmentId'] = user.departmentId
    } else {
      query['hospital'] = user.hospital
    }
  }

  if (startTime && endTime) {
    const timeQuery = [
      // 1. Starts between 10 PM and 11 PM
      {
        start_time: { $gte: new Date(Number(startTime) * 1000), $lt: new Date(Number(endTime) * 1000) }
      },
      // 2. Ends between 10 PM and 11 PM
      {
        end_time: { $gt: new Date(Number(startTime) * 1000), $lte: new Date(Number(endTime) * 1000) }
      },
      // 3. Starts before 10 PM and ends after 11 PM
      {
        start_time: { $lt: new Date(Number(startTime) * 1000) },
        end_time: { $gt: new Date(Number(endTime) * 1000) }
      }
    ]
    query['$or'] = timeQuery
  }
  if (patient_mrn) {
    query['patient_mrn'] = patient_mrn
  }
  console.log('Params after adding date range', JSON.stringify(query))
  try {
    const appointment = await AppointmentModel.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'patients',
          localField: 'patient_mrn',
          foreignField: 'mrn',
          as: 'patient_info'
        }
      },
      {
        $unwind: {
          path: '$patient_info'
        }
      },
      {
        $lookup: {
          from: 'Meetings',
          localField: 'meeting_id',
          foreignField: '_id',
          as: 'meeting_info'
        }
      },
      {
        $unwind: {
          path: '$meeting_info',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: { start_time: -1 }
      },
      {
        $skip: Number(skip)
      },
      {
        $limit: Number(limit || 20)
      }
    ])
    return appointment
  } catch (error) {
    console.error('Error scanning items:', error)
    throw error
  }
}

export const getAnAppointment = async (id) => {
  const appointment = await AppointmentModel.findOne({ _id: id })
  if (!appointment) {
    throw new Error('Appointment not found')
  }
  return appointment
}

export const isDiscountAvailable = async (hospital_email) => {
  const appointments = await AppointmentModel.find({ hospital: hospital_email, status: 'booked' })
  if (appointments.length > 22) {
    return false
  }
  return true
}

export const getAppointmentWithDateRange = async (startTime, endTime, appointmentId, doctor_email, departmentId) => {
  // Add debugging logs
  console.log('🕐 Input startTime:', startTime, typeof startTime)
  console.log('🕐 Input endTime:', endTime, typeof endTime)

  const bufferStartTime = dayjs(startTime).subtract(15, 'minute').toDate()
  const bufferEndTime = dayjs(endTime).add(15, 'minute').toDate()

  console.log('🛡️ Buffer startTime:', bufferStartTime.toISOString())
  console.log('🛡️ Buffer endTime:', bufferEndTime.toISOString())

  const query = {
    $or: [
      // 1. Appointment starts within the time range (with buffer)
      {
        start_time: { $gte: bufferStartTime, $lt: bufferEndTime }
      },
      // 2. Appointment ends within the time range (with buffer)
      {
        end_time: { $gt: bufferStartTime, $lte: bufferEndTime }
      },
      // 3. Appointment completely overlaps the time range (starts before and ends after)
      {
        start_time: { $lte: bufferStartTime },
        end_time: { $gte: bufferEndTime }
      }
    ]
  }

  if (size(doctor_email)) {
    query.doctor_email = doctor_email
  }
  if (size(departmentId)) {
    query.departmentId = departmentId
  }
  if (size(appointmentId)) {
    query._id = { $ne: appointmentId }
  }

  try {
    console.log('Scan params are', JSON.stringify(query))
    const appointments = await AppointmentModel.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'patients',
          localField: 'patient_mrn',
          foreignField: 'mrn',
          as: 'patient_info'
        }
      },
      {
        $unwind: {
          path: '$patient_info'
        }
      },
      {
        $lookup: {
          from: 'Meetings',
          localField: 'meeting_id',
          foreignField: '_id',
          as: 'meeting_info'
        }
      },
      {
        $unwind: {
          path: '$meeting_info',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: { start_time: -1 }
      }
    ])
    return appointments
  } catch (e) {
    console.log('Error during fetch data', e)
    throw new Error('Something went wrong')
  }
}

export const checkRequiredFields = (requiredFields = [], data = {}) => {
  const missingFields = difference(requiredFields, Object.keys(data))

  if (size(missingFields)) {
    throw new Error(`Missing ${missingFields}`)
  }
}
export const constructReadableJson = (items) => {
  const readableJson = []
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const regularJSONData = {}
    for (const key in item) {
      regularJSONData[key] = item[key][Object.keys(item[key])[0]]
    }
    readableJson.push(regularJSONData)
  }
  return readableJson
}

//Find all appointments which will is scheduled in the next 30 minutes
export const findUpcomingAppointmentsAndSendReminders = async () => {
  const currentTime = new Date()
  const next30Minutes = new Date(currentTime.getTime() + 30 * 60000) // 30 minutes later

  const query = {
    start_time: { $gte: currentTime, $lt: next30Minutes },
    status: 'booked',
    is_reminder_sent: {
      $ne: true
    } // Only fetch appointments where reminder has not been sent
  }

  console.log('Query for upcoming appointments:', JSON.stringify(query))

  try {
    const appointments = await AppointmentModel.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'patients',
          localField: 'patient_mrn',
          foreignField: 'mrn',
          as: 'patient_info'
        }
      }
    ])
    console.log('Appointments found:', appointments)

    //Create an array of all patient mrns and emails if appointments are found also check if the patient has an email if not ignore that appointment
    if (!appointments || appointments.length === 0) {
      console.log('No upcoming appointments found')
      return []
    }

    const upcomingAppointments = appointments.map((appointment) => ({
      patient_mrn: appointment.patient_mrn,
      patient_email: appointment.patient_email || '',
      start_time: appointment.start_time,
      patient_name: appointment.patient_name || '',
      doctor_email: appointment.doctor_email,
      hospital: appointment.hospital,
      departmentId: appointment.departmentId,
      patient_fn: appointment.patient_info?.fn || '',
      patient_ln: appointment.patient_info?.ln || '',
      appointment_id: appointment._id,
      doctor_name: appointment.doctor_name || '',
      appointment_date: appointment.start_time.toISOString().split('T')[0],
      package_info: appointment.package_info || {}
    }))
    console.log('Upcoming appointments found:', upcomingAppointments)
    await sendEmailReminderToPatients(upcomingAppointments)

    return upcomingAppointments
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error)
  }
}

export const sendEmailReminderToPatients = async (upcomingAppointments) => {
  if (!upcomingAppointments || upcomingAppointments.length === 0) {
    console.log('No upcoming appointments found')
    return
  }

  for (const appointment of upcomingAppointments) {
    const {
      patient_email,
      start_time,
      hospital,
      appointment_id,
      doctor_name,
      appointment_date,
      package_info,
      patient_name,
      patient_mrn
    } = appointment

    if (!patient_email) {
      console.log(`No email found for patient with MRN: ${patient_mrn}. Skipping reminder.`)
      continue
    }

    const from_email =
      hospital === 'chiomaikpe@gmail.com'
        ? 'Evergreen Glow <info@evergreenglow.com>'
        : 'Omidnetcare <no-reply@dev.omidnetcare.com>'
    try {
      await sendEmailForAppointmentConfirmation(
        {
          nurse_practitioner_name: doctor_name,
          patient_name,
          appointment_date,
          appointment_time: start_time,
          confirmationTemplate: reminderTemplate,
          package_name: package_info?.name || 'N/A',
          website_url: 'https://evergreenglow.com/'
        },
        patient_email,
        'Booking Reminder',
        from_email
      )
      // Update the appointment to mark the reminder as sent
      await AppointmentModel.updateOne({ _id: appointment_id }, { $set: { is_reminder_sent: true } })
    } catch (error) {
      console.error('Error sending email:', error)
    }
  }
}
