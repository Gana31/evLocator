import mongoose from 'mongoose';

mongoose.set('strictQuery', false);

export default async function connectToDatabase() {
  try {
    const data = await mongoose.connect(process.env.DATABASE_URL);
    console.log(`Database server connected at port: ${data.connection.port}`);
    console.log(`Database server connected at host: ${data.connection.host}`);
  } catch (error) {
    console.error(error);
  }
}
