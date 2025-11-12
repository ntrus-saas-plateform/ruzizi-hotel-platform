import dbConnectFn from './mongodb';

// Export avec les deux noms pour compatibilité
export const dbConnect = dbConnectFn;
export const connectDB = dbConnectFn;
export default dbConnectFn;
