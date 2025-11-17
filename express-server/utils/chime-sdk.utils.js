import { ChimeSDKMeetingsClient } from '@aws-sdk/client-chime-sdk-meetings';
import { config } from 'dotenv';

config();

console.log('Initializing Chime SDK Client...');
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '***' : 'NOT SET');

export const chimeSdk = new ChimeSDKMeetingsClient({
  region: process.env.REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
