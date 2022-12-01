import { load } from "cheerio";
import { api as axios } from "../../utils/api.js";
import { Topics } from "../../models/index.js";

class NewsFeed {
  constructor(title, id, uploadedAt, topics, preview, thumbnail, url) {
    this.title = title;
    this.id = id;
    this.uploadedAt = uploadedAt;
    this.topics = topics;
    this.preview = preview;
    this.url = url;
    this.thumbnail = thumbnail;
  }

  async getInfo() {
    return await scrapNewsInfo(this.url).catch((err) => {
      throw new Error(err.message);
    });
  }
}

async function scrapNewsInfo(url) {
  const { data } = await axios.get(url);
  const $ = load(data);
  const title = $("#page_header").text().replace("News", "").trim();
  const intro = $(".intro").first().text().trim();
  const description = $(".meat > p").text().trim().split("\n\n").join("\n");
  const time = $("#page-title > small > time").text().trim();
  const thumbnailSlug = $(".meat > p").find("img").attr("data-src");
  const thumbnail = thumbnailSlug
    ? `https://animenewsnetwork.com${thumbnailSlug}`
    : "https://i.imgur.com/KkkVr1g.png";
  return {
    id: url.split("news/")[1],
    title,
    uploadedAt: time,
    intro,
    description,
    thumbnail,
    url,
  };
}

class AnimeNewsNetwork {
  name = "Anime News Network";
  baseUrl = "https://www.animenewsnetwork.com";
  classPath = "NEWS.ANN";
  logo = "https://i.imgur.com/KkkVr1g.png";

  NewsFeeds = async (topic) =>
    axios
      .get(
        `${this.baseUrl}/news${
          topic && Object.values(Topics).includes(topic)
            ? `/?topic=${topic}`
            : ""
        }`
      )
      .then(({ data }) => {
        const $ = load(data);
        const feeds = [];
        $(".herald.box.news").each((i, el) => {
          const thumbnailSlug = $(el).find(".thumbnail").attr("data-src");
          const thumbnail = thumbnailSlug
            ? `${this.baseUrl}${thumbnailSlug}`
            : this.logo;
          const title = $(el).find("h3").text().trim();
          const slug = $(el).find("h3 > a").attr("href") || "";
          const url = `${this.baseUrl}${slug}`;
          const byline = $(el).find(".byline");
          const time = byline.find("time").text().trim();
          const topics = [];
          byline.find(".topics > a").each((i, el) => {
            topics.push($(el).text().trim());
          });
          const El = $(el).find(".preview");
          const preview = {
            intro: El.find(".intro").text().trim(),
            full: El.find(".full").text().replace("―", "").trim(),
          };
          feeds.push(
            new NewsFeed(
              title,
              slug.replace("/news/", ""),
              time,
              topics,
              preview,
              thumbnail,
              url
            )
          );
        });
        return feeds;
      })
      .catch((err) => {
        throw new Error(err.message);
      });

  NewsInfo = async (id) => {
    if (!id || typeof id !== "string")
      throw new TypeError(
        `The type of parameter "id" should be of type "string", received type "${typeof id}" instead`
      );
    return await scrapNewsInfo(`${this.baseUrl}/news/${id}`).catch((err) => {
      throw new Error(err.message);
    });
  };
}

export default AnimeNewsNetwork;
