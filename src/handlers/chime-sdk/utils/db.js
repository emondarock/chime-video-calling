import mongoose from 'mongoose'
// import dotenv from 'dotenv'

// dotenv.config()
let conn = null

const uri = 'mongodb://192.168.0.102:27017/chime-sdk-calling'

console.log('MongoDB URI:', uri);

export const connect = async function () {
  if (conn == null) {
    conn = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 5000
      })
      .then(() => {
        console.log('Connected to MongoDB')
        return mongoose
      })

    // `await`ing connection after assigning to the `conn` variable
    // to avoid multiple function calls creating new connections
    await conn
  }

  return conn
}
