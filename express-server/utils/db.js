import mongoose from 'mongoose'

let conn = null

const uri = 'mongodb+srv://emondarock:xm7Scv4Z8yhvHZqe@omidnetcare-dev.hdv54un.mongodb.net/omidnetcare-dev'

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
