export const BaseURL = "https://zoro.to",
  SearchURL = ({ keyword, page }) =>
    `${BaseURL}/Search?keyword=${keyword}&page=${page}`,
  InfoURL = ({ animeId }) => `${BaseURL}/${animeId}`;

export const AjaxURL = `${BaseURL}/Ajax/v2`;
