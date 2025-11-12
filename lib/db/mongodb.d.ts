import mongoose from 'mongoose';

declare function dbConnect(): Promise<typeof mongoose>;

export default dbConnect;
