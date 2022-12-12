import express from "express";
const router = express.Router();

// ANIME
import GoGoAnime from "./Anime/GoGoAnime.js";
import Animixplay from "./Anime/Animixplay.js";
import Zoro from "./Anime/Zoro.js";
import Genoanime from "./Anime/Genoanime.js";
import nineAnime from "./Anime/9Anime.js";
import Enime from "./Anime/Enime.js";
import Animension from "./Anime/animension.js";
import Animepahe from "./Anime/animepahe";
import Crunchyroll from "./Anime/crunchyroll";

// ASIAN
import ViewAsian from "./Asian/ViewAsian.js";
import DramaCool from "./Asian/dramcool.js";
import Asianload from "./Asian/asianload.js";

// MANGA
import MangaDex from "./Manga/mangadex.js";
import MangaHere from "./Manga/mangahere";
import MangaKakalot from "./Manga/mangakakalot";
import Mangapark from "./Manga/MangaPark";

// MOVIES
import FlixHQ from "./Movies/flixhq.js";
import AttackerTv from "./Movies/attackerTv.js";
import Goku from "./Movies/goku.js";
import AllMovies from "./Movies/allmovies.js";

// META
import Anilist from "./Meta/anilist.js";
import AnilistManga from "./Meta/anilist-manga";
import MyAnimeList from "./Meta/MyAnimeList.js";
import AniTrendz from "./Meta/aniTrendz.js";
import AniSkip from "./Meta/Aniskip";

// NEWS
import Ann from "./News/ann.js";

// BOOKS
import Libgen from "./Books/libgen.js";

// COMICS
import GetComics from "./Comics/getComics.js";

// LIGHT NOVELS
import RLN from "./Light-Novels/readlightnovels.js";

// ROUTES
// ANIME
router.use("/gogoanime", GoGoAnime);
router.use("/animixplay", Animixplay);
router.use("/zoro", Zoro);
router.use("/genoanime", Genoanime);
router.use("/9Anime", nineAnime);
router.use("/enime", Enime);
router.use("/animension", Animension);
router.use("/animepahe", Animepahe);
router.use("/crunchyroll", Crunchyroll);

// ASIAN
router.use("/asian/viewAsian", ViewAsian);
router.use("/asian/dramacool", DramaCool);
router.use("/asian/asianload", Asianload);

// MANGA
router.use("/mangadex", MangaDex);
router.use("/mangahere", MangaHere);
router.use("/mangakakalot", MangaKakalot);
router.use("/mangapark", Mangapark);

// MOVIES
router.use("/flixhq", FlixHQ);
router.use("/AttackerTv", AttackerTv);
router.use("/goku", Goku);
router.use("/allmovies", AllMovies);

// META
router.use("/anilist", Anilist);
router.use("/anilist/manga", AnilistManga);
router.use("/mal", MyAnimeList);
router.use("/anime/charts", AniTrendz);
router.use("/anime/aniskip", AniSkip);

// NEWS
router.use("/ann", Ann);

// BOOKS
router.use("/books", Libgen);

// COMICS
router.use("/comics", GetComics);

// LIGHT NOVELS
router.use("/light-novels", RLN);

// MUST BE LAST ROUTE IN THE FILE
router.use("/", (req, res) => {
  return res.send(`Received a ${req.method} HTTP method`);
});

export default router;
