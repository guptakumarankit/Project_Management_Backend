import mongoose from 'mongoose'

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("MongoDB connected")
    } catch (error) {
        console.log("MongoDB connection error" , error);
        process.exit(1); 
        // process → a global object in Node.js that represents the running program
        // exit() → immediately stops the program
        // 0 → success (everything worked)
        // 1 (or any non-zero number) → error or failure
    }
}

export default connectDB;