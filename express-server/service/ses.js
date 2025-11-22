import { SESv2Client } from '@aws-sdk/client-sesv2'
import { config } from 'dotenv'

config()

const seSv2Client = new SESv2Client({
  forcePathStyle: false,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN
  },
  region: process.env.REGION
})

export { seSv2Client }
