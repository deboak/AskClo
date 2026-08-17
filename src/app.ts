import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is healthy' });
});

app.listen(port, () => {
    console.log(`server is running at http://localhost:${port}`);
});
