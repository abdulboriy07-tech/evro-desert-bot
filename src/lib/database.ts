'use server'
import mongoose from 'mongoose'



async function Database(){
    await mongoose.connect(process.env.NEXT_PUBLIC_MONGO_URL as string);
}

export default Database;