import express from "express";
import { ANIME } from "../../providers";

const router = express.Router();

const animension = new ANIME.Animension();

router.get("/search/:query", async (req, res) => {
  const { query } = req.params;

  const reply = await animension.Search(query);

  res.status(200).send(reply);
});

export default router;
