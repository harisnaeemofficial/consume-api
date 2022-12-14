import {
  ANIME,
  MANGA,
  BOOKS,
  MOVIES,
  META,
  NEWS,
  COMICS,
  LIGHT_NOVELS,
} from "../providers";

export const PROVIDERS_LIST = {
  ANIME: [
    new ANIME.GogoAnime(),
    new ANIME.NineAnime(),
    new ANIME.Zoro(),
    new ANIME.Animixplay(),
    new ANIME.Enime(),
    new ANIME.AnimeFox(),
    new ANIME.KickAssAnime(),
    new ANIME.AnimePahe(),
    new ANIME.Crunchyroll(),
    new ANIME.Bilibili(),
  ],
  MANGA: [
    new MANGA.MangaDex(),
    new MANGA.MangaHere(),
    new MANGA.Mangapark(),
    new MANGA.MangaKakalot(),
    new MANGA.Mangasee123(),
  ],
  BOOKS: [new BOOKS.Libgen()],
  COMICS: [new COMICS.GetComics()],
  LIGHT_NOVELS: [new LIGHT_NOVELS.ReadLightNovels()],
  MOVIES: [new MOVIES.FlixHQ(), new MOVIES.AttackerTV()],
  NEWS: [new NEWS.AnimeNewsNetwork()],
  META: [new META.Anilist()],
  OTHERS: [],
};
