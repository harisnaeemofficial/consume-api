import ora from "ora";
import chalk from "chalk";

import express from "express";
const router = express.Router();

import { ANIME } from "../../providers/index.js";
const GenoAnime = new ANIME.Genoanime();

router.get("/search", async (req, res) => {
  const keyw = req.query.search;

  const search = await GenoAnime.Search({ keyw });

  res.send(search);
});

router.get("/info", async (req, res) => {
  const { animeId } = req.query;

  if (!animeId) return res.send("no anime id");

  const info = await GenoAnime.Info({ animeId });

  res.send(info);
});

router.get("/popular", async (req, res) => {
  const popular = await GenoAnime.Popular({ page: 1 });

  res.send(popular);
});

export default router;
