import express from "express";
const router = express.Router();

import { BOOKS } from "../../providers";

const libgen = new BOOKS.Libgen();

router.get("/search/:bookTitle/:page?", async (req, res) => {
  const { bookTitle, page = 1 } = req.params;
  if (bookTitle.length < 4)
    return res.status(400).send({
      message: "length of bookTitle must be > 4 characters",
      error: "short_length",
    });
  if (isNaN(page)) {
    return res.status(400).send({
      message: "page is missing",
      error: "invalid_input",
    });
  }
  try {
    const data = await libgen.Search(bookTitle, page);
    return res.status(200).send(data);
  } catch (e) {
    return res.status(400).send(e);
  }
});

export default router;
