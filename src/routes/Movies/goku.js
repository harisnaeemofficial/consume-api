import express from "express";
import { StreamingServers } from "../../models/index.js";
import { MOVIES } from "../../providers/index.js";

const router = express.Router();

const goku = new MOVIES.Goku();

router.get("/search/:query", async (req, res) => {
  const { query } = req.params;
  const { page } = req.query;

  const reply = await goku.Search(decodeURIComponent(query), page);

  return res.status(200).send(reply);
});

export default router;
