import { randomUUID } from 'crypto'
import { checkRequiredFields, getAnAppointment, getAppointmentWithDateRange } from '../helper/appointment.helper.js'
import lodash from 'lodash'
const { size } = lodash
import { AppointmentModel } from '../models/appointment.schema.js'
import Patient from '../models/patient.model.js'
import { sendEmailForAppointmentConfirmation, sendEmailForInvitation } from '../helper/email.helper.js'
import { confirmationTemplate } from '../template/confirmation.js'
import { createMeeting, deleteMeeting } from './chime-sdk.service.js'
import jwt from 'jsonwebtoken'
import { SchedulerModel } from '../models/scheduler.schema.js'
import { meetingInvitationTemplate } from '../template/meeting-invitation.js'
import dayjs from 'dayjs'


export const saveAppointment = async (data, user) => {
  console.log('Data is inserting with value', data)
  if (user) {
    if (user.role === 'doctor' && data.doctor_email !== user.email) {
      throw new Error('Doctor can only create his own appointment')
    }
  }
  const appointment = new AppointmentModel(data)
  try {
    const response = await appointment.save()
    return response
  } catch (e) {
    console.log('Error during save appointment', e)
    throw new Error('Error during save appointment')
  }
}

export const updateAppointmentDoc = async (id, data, user) => {
  console.log('Data is updating with value', data)
  if (user.role === 'doctor' && data.doctor_email !== user.email) {
    throw new Error('Doctor can only update his own appointment')
  }
  try {
    const appointment = await getAnAppointment(id)
    if (!appointment) {
      throw new Error('Appointment not found')
    }
    const update = await AppointmentModel.updateOne(
      { _id: id },
      {
        $set: data
      }
    )
    return {
      message: 'Appointment updated successfully',
      data: update
    }
  } catch (e) {
    console.log('Error during update appointment', e)
    throw new Error('Error during update appointment')
  }
}

export const deleteAnAppointmentFromDynamo = async (id, user) => {
  const singleAppointment = await getAnAppointment(id)
  if (user.role === 'doctor' && singleAppointment.doctor_email !== user.email) {
    throw new Error('Doctor can only delete his own appointment')
  } else if (user.role === 'hospital-admin' && singleAppointment.hospital !== user.hospital) {
    throw new Error('Hospital admin can only delete his own hospital appointment')
  }

  try {
    const result = await AppointmentModel.deleteOne({ _id: id })
    await deleteMeeting(singleAppointment.meeting_id)
    return { result, message: 'Appointment deleted successfully' }
  } catch (error) {
    console.error('Error deleting item:', error)
    throw error
  }
}

export const createAppointment = async (body, user) => {
  checkRequiredFields(['start_time', 'end_time'], body)
  if (body.start_time > body.end_time) {
    throw new Error('Start time cannot be greater than end time')
  }
  if (user?.role === 'department-admin') {
    body.departmentId = user.departmentId
  }
  if (!body.hospital) {
    body.hospital = user.hospital
  }

  const checkIfAppointmentCanBeCrated = await getAppointmentWithDateRange(
    body.start_time,
    body.end_time,
    '',
    body.doctor_email ? body.doctor_email : null,
    user?.departmentId ? user.departmentId : null
  )
  if (size(checkIfAppointmentCanBeCrated)) {
    throw new Error('Appointment is already booked in the time frame')
  }
  const isPatientExists = await Patient.findOne({ email: body.patient_email })
  let patient_mrn = ''
  if (isPatientExists) {
    patient_mrn = isPatientExists.mrn
  } else {
    //Genereate MRN for the patient. Take last part of an uuid and add it to the patient
    const uuid = randomUUID()
    patient_mrn = uuid.split('-').pop()
    body.patient_mrn = patient_mrn
  }
  const appointment = await saveAppointment(body, user)
  const from_email =
    body.location === 'outside'
      ? 'Evergreen Glow <info@evergreenglow.com>'
      : 'Omidnetcare <no-reply@dev.omidnetcare.com>'
  if (body.location === 'outside') {
    await sendEmailForAppointmentConfirmation(
      {
        nurse_practitioner_name: body.doctor_name,
        patient_name: body.patient_name,
        appointment_date: body.date,
        appointment_time: dayjs(body.start_time).format('HH:mm a'),
        confirmationTemplate,
        package_name: body.package_info?.name || 'N/A',
        website_url: 'https://evergreenglow.com/'
      },
      body.patient_email,
      'Booking confirmation',
      from_email
    )
  }
  if (body.is_calling_attached) {
    console.log('Calling is attached to the appointment')
    try {
      appointment.is_calling_attached = true

      // Create a meeting token and scheduler entry
      const meetingTokenForPatient = jwt.sign(
        {
          email: body.patient_email,
          appointmentId: appointment._id
        },
        process.env.MEETING_JWT_SECRET
      )

      const meetingTokenForDoctor = jwt.sign(
        {
          email: body.doctor_email,
          appointmentId: appointment._id
        },
        process.env.MEETING_JWT_SECRET
      )

      console.log('Meeting token created.')

      const schedule = new SchedulerModel({
        appointmentId: appointment._id,
        scheduledAt: body.start_time,
        invitees: [body.doctor_email, body.patient_email],
        meetingTokenForPatient,
        meetingTokenForDoctor
      })
      await schedule.save()

      console.log('Schedule saved.')

      // Send invitation email to patient
      let patient = await Patient.findOne({ mrn: body.patient_mrn })
      if (!patient) {
        const newPatient = new Patient({
          mrn: body.patient_mrn,
          fn: body.patient_name,
          email: body.patient_email,
          phone: body.patient_phone
        })
        patient = await newPatient.save()
      }
      if (patient?.email) {
        const patientName = (patient.fn && patient.ln) ? `${patient.fn} ${patient.ln}` : (patient.mn || 'Patient')
        await sendEmailForInvitation({
          patient_name: patientName,
          doctor_name: body.doctor_name,
          appointment_date: body.date,
          appointment_time: body.start_time,
          invitationTemplate: meetingInvitationTemplate,
          meeting_url: `${process.env.FRONTEND_URL}/join-meeting?token=${meetingTokenForPatient}`,
          website_url: 'https://dev.omidnetcare.com/'
        }, patient.email, 'Meeting Invitation', from_email)

        //TODO: Remove this temporary log
      }

      // Send invitation email to doctor
      if (body.doctor_email) {
        await sendEmailForInvitation({
          patient_name: body.patient_name,
          doctor_name: body.doctor_name,
          appointment_date: body.date,
          appointment_time: body.start_time,
          invitationTemplate: meetingInvitationTemplate,
          meeting_url: `${process.env.FRONTEND_URL}/join-meeting?token=${meetingTokenForDoctor}`,
          website_url: 'https://dev.omidnetcare.com/'
        }, body.doctor_email, 'Meeting Invitation', from_email)
      }

      await appointment.save()
    } catch (error) {
      console.error('Error creating meeting and sending invitations:', error)
      // Rollback: remove calling attachment flag if meeting creation failed
      appointment.is_calling_attached = false
      appointment.meeting_id = null
      await appointment.save()
      throw new Error(`Failed to create video meeting: ${error.message}`)
    }
  }
  return {
    ...JSON.parse(JSON.stringify(appointment)),
    patient_mrn: isPatientExists ? isPatientExists.mrn : patient_mrn,
    patient: isPatientExists ? isPatientExists.mrn : false
  }
}

export const updateAppointment = async (body, user) => {
  const { appointmentId, updateInfo } = body
  if (updateInfo.start_time || updateInfo.end_time) {
    const checkIfAppointmentCanBeCrated = await getAppointmentWithDateRange(
      updateInfo.start_time,
      updateInfo.end_time,
      appointmentId
    )
    if (size(checkIfAppointmentCanBeCrated)) {
      throw new Error('Appointment is already booked in the time frame')
    }
  }

  const response = await updateAppointmentDoc(appointmentId, updateInfo, user)
  return response
}
