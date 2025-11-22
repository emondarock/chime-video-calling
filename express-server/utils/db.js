import mongoose from 'mongoose'

let conn = null

const uri = 'mongodb://192.168.0.104:27017/chime-sdk-calling'

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
      .catch((error) => {
        console.error('MongoDB connection error:', error)
        throw error
      })

    // `await`ing connection after assigning to the `conn` variable
    // to avoid multiple function calls creating new connections
    await conn
  }

  return conn
}
