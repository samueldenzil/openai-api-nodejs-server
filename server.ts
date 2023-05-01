import { config } from "dotenv";
config();
import express, { Application, Request, Response } from "express";
import cors from "cors";
import { Configuration, OpenAIApi } from "openai";
import rateLimit from "express-rate-limit";

const app: Application = express();
app.use(express.json());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 12 * 60 * 60 * 1000, // 12 hours
  max: 5,
});
app.use(limiter);
app.set("trust proxy", 1);

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.get("/status", (req: Request, res: Response) => {
  try {
    res.status(200).send("working");
  } catch (error) {
    res.status(500).send("ERROR");
  }
});

app.post("/sql-generator/completions", async (req: Request, res: Response) => {
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Consider this hypothetical SQL request ${req.body.message} give me only the query`,
        },
      ],
    });
    // console.log(completion.data.choices[0].message);
    res.send(completion.data.choices[0].message);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

app.post("/generations", async (req: Request, res: Response) => {
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: req.body.message,
      n: 4,
      size: "256x256",
    }),
  };

  try {
    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      options
    );
    const data = await response.json();
    res.status(200).send(data);
  } catch (error) {
    console.error(error);
  }
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
