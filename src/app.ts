import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import routes from "./routes/routes"
import { errorHandler } from "./middlewares/errorHandler";


const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/api/v1', routes)

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is healthy' });
});

app.use(errorHandler);

export default app;
