import ejs from 'ejs'
import { SendEmailCommand } from '@aws-sdk/client-sesv2'
import { seSv2Client } from '../service/ses.js'
import dayjs from 'dayjs'

import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)
export const constructEmailContent = (contentObj) => {
  const { email, password, html, loginUrl } = contentObj

  let renderedHtml
  console.log({ email })
  console.log({ html })
  try {
    renderedHtml = ejs.render(html, { email, password, loginUrl })
    return renderedHtml
  } catch (error) {
    console.error('Error rendering HTML:', error)
  }
}

export const constructEmailForInvitation = (contentObj) => {
  const {
    patient_name,
    doctor_name,
    appointment_date,
    appointment_time,
    invitationTemplate,
    meeting_url,
    website_url
  } = contentObj

  let renderedHtml

  console.log({
    patient_name,
    doctor_name,
    appointment_date,
    appointment_time: dayjs(appointment_time).format('HH:mm a'),
    meeting_url,
    website_url
  })

  try {
    renderedHtml = ejs.render(invitationTemplate, {
      patient_name,
      doctor_name,
      appointment_date,
      appointment_time: dayjs(appointment_time).format('HH:mm a'),
      meeting_url,
      website_url
    })
    return renderedHtml
  } catch (error) {
    console.error('Error rendering HTML:', error)
  }
}

export const constructEmailForAppointmentConfirmation = (contentObj) => {
  const {
    nurse_practitioner_name,
    patient_name,
    appointment_date,
    appointment_time,
    confirmationTemplate,
    package_name,
    website_url
  } = contentObj

  let renderedHtml

  console.log({
    customer_name: patient_name,
    booking_date: appointment_date,
    booking_time: dayjs(appointment_time).format('HH:mm a'),
    nurse_practitioner_name,
    package_name,
    website_url
  })

  try {
    renderedHtml = ejs.render(confirmationTemplate, {
      customer_name: patient_name,
      booking_date: appointment_date,
      booking_time: dayjs(appointment_time).format('HH:mm a'),
      nurse_practitioner_name,
      package_name,
      website_url
    })
    return renderedHtml
  } catch (error) {
    console.error('Error rendering HTML:', error)
  }
}

export const sendEmailForInvitation = async (contentObj, recipient, subject, from_email) => {
  console.log({ contentObj })
  console.log('From email:', from_email)
  console.log('Recipient:', recipient)
  console.log('Subject:', subject)

  const renderedHtml = constructEmailForInvitation(contentObj)
  const params = {
    FromEmailAddress: from_email || 'Omidnetcare <no-reply@dev.omidnetcare.com>',
    Destination: {
      ToAddresses: [recipient],
    },
    Content: {
      Simple: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: renderedHtml,
            Charset: 'UTF-8',
          },
          // Optionally add Text:
          // Text: {
          //   Data: 'Plain text fallback',
          //   Charset: 'UTF-8',
          // },
        },
      },
    },
  }

  const command = new SendEmailCommand(params)
  const response = await seSv2Client.send(command)
  console.log('Email sent response: ' + JSON.stringify(response))
  return response
}

export const sendEmailForAppointmentConfirmation = async (contentObj, recipient, subject, from_email) => {
  console.log({ contentObj })
  console.log('From email:', from_email)
  console.log('Recipient:', recipient)
  console.log('Subject:', subject)

  const renderedHtml = constructEmailForAppointmentConfirmation(contentObj)
  const params = {
    Destination: {
      ToAddresses: [recipient] // Replace with the recipient's email address
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: renderedHtml
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      }
    },
    Source: from_email || 'Omidnetcare <no-reply@dev.omidnetcare.com>' // Replace with the sender's email address
  }
  const command = new SendEmailCommand(params)
  const response = await seSv2Client.send(command)
  console.log('Email sent response: ' + JSON.stringify(response))
  return response
}

export const sendMeetingInvitationEmail = async (contentObj, recipient, subject, from_email) => {
  console.log({ contentObj })
  console.log('From email:', from_email)
  console.log('Recipient:', recipient)
  console.log('Subject:', subject)

  const renderedHtml = constructEmailForInvitation(contentObj)
  const params = {
    Destination: {
      ToAddresses: [recipient]
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: renderedHtml
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      }
    },
    Source: from_email || 'Omidnetcare <no-reply@dev.omidnetcare.com>'
  }
  const command = new SendEmailCommand(params)
  const response = await seSv2Client.send(command)
  console.log('Meeting invitation email sent: ' + JSON.stringify(response))
  return response
}

export const sendEmail = async (contentObj, recipient, subject, from_email) => {
  console.log({ contentObj })
  const renderedHtml = constructEmailContent(contentObj)
  const params = {
    Destination: {
      ToAddresses: [recipient] // Replace with the recipient's email address
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: renderedHtml
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      }
    },
    Source: from_email || 'Omidnetcare <no-reply@dev.omidnetcare.com>' // Replace with the sender's email address
  }

  const command = new SendEmailCommand(params)
  const response = await seSv2Client.send(command)
  console.log('Email sent response: ' + JSON.stringify(response))
}
