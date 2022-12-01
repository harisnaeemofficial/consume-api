import { api as axios } from "../../../../utils/api.js";
import { load } from "cheerio";

export const getSourcesLink = async ({ url }) => {
  const { data } = await axios.get(url);

  const $ = load(data);

  const key = $.html().split("recaptchaSiteKey");

  return key;
};
