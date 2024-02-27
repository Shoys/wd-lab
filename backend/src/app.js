import express from 'express';
import authRoutes from './routes/authRoutes.js';
import connectDB from './config/db.js';
import courseRoutes from './routes/courseRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cors from 'cors';

const app = express();
await connectDB();
app.use(express.json());
app.use(cors());

app.use(authRoutes);
app.use(courseRoutes);
app.use(userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
