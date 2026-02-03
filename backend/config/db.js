const mongoose = require('mongoose');


const connectDB = async () => {
    try {
        let uri = process.env.MONGO_URI;

        if (uri) {
            console.log("Connecting to provided MongoDB URI...");
            const conn = await mongoose.connect(uri);
            console.log(`MongoDB Connected: ${conn.connection.host}`);
        } else {
            console.log("No MONGO_URI found in environment. Starting In-Memory MongoDB (for local testing)...");
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongod = await MongoMemoryServer.create();
            uri = mongod.getUri();

            console.log(`In-Memory MongoDB connected at: ${uri}`);

            // Connect Mongoose to the in-memory instance
            const conn = await mongoose.connect(uri);
            console.log(`MongoDB (Memory) Connected: ${conn.connection.host}`);

            // Expose URI to process.env if needed elsewhere
            process.env.MONGO_URI = uri;
        }

    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
