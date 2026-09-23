import express from 'express';
import 'dotenv/config';
import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import applicationsRoutes from '@/routes/applicationsRoutes';
import { clerkMiddleware } from '@clerk/express';

const app = express();
const port = process.env.PORT;

const ALLOWED_ORIGINS = ['http://localhost:3000', 'https://career-track-set.vercel.app'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        if (origin.startsWith('chrome-extension://')) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
app.use(express.json());
app.use(clerkMiddleware());

app.use('/applications', applicationsRoutes);

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express requires 4 params to detect error-handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Express error handler:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
    console.log(`Server is running on ${port}`);
});
