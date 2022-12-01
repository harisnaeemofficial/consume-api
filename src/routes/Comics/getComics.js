import express from "express";
const router = express.Router();

import { COMICS } from "../../providers";

const GetComics = new COMICS.GetComics();

router.get("/search/:comicTitle/:page?", async (req, res) => {
  const { comicTitle, page = 1 } = req.params;

  if (comicTitle.length < 4)
    return res.status(400).send({
      message: "length of comicTitle must be > 4 charactes",
      error: "short_length",
    });
  const result = await GetComics.Search(
    comicTitle,
    page == undefined ? 1 : page
  ).catch((err) => {
    console.error(err);
    return res.status(400).send({
      // temp
      message: "page query must be defined",
      error: "invalid_input",
      // temp
    });
  });

  res.status(200).send(result);
});

export default router;
