import { AppointmentModel } from '../models/appointment.schema.js'

export const sqsHelper = async (messageBody) => {
  console.log('Received message body:', messageBody)

  // Check if messageBody has a package_id
  if (messageBody && messageBody.package_id) {
    console.log('Processing package_id:', messageBody.package_id)
    await AppointmentModel.updateOne({})
  } else {
    console.log('No package_id found in message body')
  }
}
