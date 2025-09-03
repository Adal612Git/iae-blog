import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar variables de entorno desde backend/.env (independiente del cwd)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const { DB_URL } = process.env;
if (!DB_URL) {
  throw new Error('DB_URL no está definida. Asegúrate de tener backend/.env con DB_URL=...');
}

// Conectar a MongoDB y exportar conexión y promesa de conexión
const connectPromise = mongoose
  .connect(DB_URL)
  .then(() => {
    console.log('MongoDB conectado');
    return mongoose.connection;
  });

const connection = mongoose.connection;
export { connectPromise };
export default connection;
