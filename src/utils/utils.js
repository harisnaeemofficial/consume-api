import { load } from "cheerio";

// export const USER_AGENT =
//   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36";
// export const USER_AGENT =
//   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36";
export const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:106.0) Gecko/20100101 Firefox/106.0";
export const days = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

export const splitAuthor = (authors) => {
  const res = [];
  let eater = "";
  for (let i = 0; i < authors.length; i++) {
    if (authors[i] == " " && (authors[i - 1] == "," || authors[i - 1] == ";")) {
      continue;
    }
    if (authors[i] == "," || authors[i] == ";") {
      res.push(eater.trim());
      eater = "";
      continue;
    }
    eater += authors[i];
  }
  res.push(eater);
  return res;
};

export const floorID = (id) => {
  let imp = "";
  for (let i = 0; i < id?.length - 3; i++) {
    imp += id[i];
  }
  const idV = parseInt(imp);
  return idV * 1000;
};

export const formatTitle = (title) => {
  const result = title.replace(/[0-9]/g, "");
  return result.trim();
};

export const genElement = (s, e) => {
  if (s == "") return;
  const $ = load(e);
  let i = 0;
  let str = "";
  let el = $();
  for (; i < s.length; i++) {
    if (s[i] == " ") {
      el = $(str);
      str = "";
      i++;
      break;
    }
    str += s[i];
  }
  for (; i < s.length; i++) {
    if (s[i] == " ") {
      el = $(el).children(str);
      str = "";
      continue;
    }
    str += s[i];
  }
  el = $(el).children(str);
  return el;
};

export const range = ({
  from = 0,
  to = 0,
  step = 1,
  length = Math.ceil((to - from) / step),
}) => Array.from({ length }, (_, i) => from + i * step);

export const capitalizeFirstLetter = (s) =>
  s.charAt(0).toUpperCase() + s.slice(1);

export const getDays = (day1, day2) => {
  const day1Index = days.indexOf(capitalizeFirstLetter(day1)) - 1;
  const day2Index = days.indexOf(capitalizeFirstLetter(day2)) - 1;
  const now = new Date();
  const day1Date = new Date();
  const day2Date = new Date();
  day1Date.setDate(now.getDate() + ((day1Index + 7 - now.getDay()) % 7));
  day2Date.setDate(now.getDate() + ((day2Index + 7 - now.getDay()) % 7));
  console.log(day1Date, day2Date);
  day1Date.setHours(0, 0, 0, 0);
  day2Date.setHours(0, 0, 0, 0);
  return [day1Date.getTime() / 1000, day2Date.getTime() / 1000];
};

export const isJson = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

export function convertDuration(milliseconds) {
  let seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  seconds = seconds % 60;
  minutes = minutes % 60;

  return `PT${hours}H${minutes}M${seconds}S`;
}

export const compareTwoStrings = (first, second) => {
  first = first.replace(/\s+/g, "");
  second = second.replace(/\s+/g, "");

  if (first === second) return 1; // identical or empty
  if (first.length < 2 || second.length < 2) return 0; // if either is a 0-letter or 1-letter string

  let firstBigrams = new Map();
  for (let i = 0; i < first.length - 1; i++) {
    const bigram = first.substring(i, i + 2);
    const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) + 1 : 1;

    firstBigrams.set(bigram, count);
  }

  let intersectionSize = 0;
  for (let i = 0; i < second.length - 1; i++) {
    const bigram = second.substring(i, i + 2);
    const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) : 0;

    if (count > 0) {
      firstBigrams.set(bigram, count - 1);
      intersectionSize++;
    }
  }

  return (2.0 * intersectionSize) / (first.length + second.length - 2);
};

export const substringAfter = (str, toFind) => {
  let index = str.indexOf(toFind);
  return index == -1 ? "" : str.substring(index + toFind.length);
};

export const substringBefore = (str, toFind) => {
  let index = str.indexOf(toFind);
  return index == -1 ? "" : str.substring(0, index);
};
