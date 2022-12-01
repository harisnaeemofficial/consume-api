import "dotenv/config";
import express from "express";
import cors from "cors";
import DefaultRouter from "./src/utils/helpers/DefaultRouter.js";
import routes from "./src/routes/index.js";

import { Logger } from "./src/utils/helpers/Logger.js";

const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors());

/* Server booting message */
console.log(`Server is booting...`);

app.use(express.json());

/* Express use Logger */
app.use((req, res, next) => Logger(req, res, next));

/* Define routes */
app.use("/api", routes);
app.use("/", DefaultRouter);

const URL =
  process.env.NODE_ENV === "development"
    ? `http://localhost:${PORT}`
    : "consume-api.up.railway.app";
const listenMessage = `Api online and accepting requests at ${URL}`;

/* Server online message */
app.listen(PORT, () => console.log(listenMessage));
