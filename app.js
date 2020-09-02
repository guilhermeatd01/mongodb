import express from "express";
import mongoose from "mongoose";
import winston from "winston";
import accountsRouter from "./routes/accounts.js";
import dotenv from "dotenv";
import cors from "cors"
dotenv.config();

const { combine, timestamp, label, printf } = winston.format;
const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

global.logger = winston.createLogger({
  level: "silly",
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "my-bank-api.log" }),
  ],
  format: combine(label({ label: "my-bank-api" }), timestamp(), myFormat),
});

const app = express();
app.use(express.json());
app.use(cors())
app.use("/account", accountsRouter);

(async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6rocx.gcp.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    logger.info("Conectado ao mongodb");
  } catch (error) {
    logger.error("Erro ao conectar: " + error);
  }
})();

app.listen(3000, () => {
  logger.info("API ouvindo na porta 3000");
});
