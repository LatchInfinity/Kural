import type { RSSSourceConfig } from "./types";

export const news18Tamil: RSSSourceConfig = {
  id: "news18-tamil",
  name: "News18 Tamil",
  nameTa: "News18 தமிழ்",
  feedUrl: "https://tamil.news18.com/rss/",
  websiteUrl: "https://tamil.news18.com",
  logoUrl: "https://tamil.news18.com/favicon.ico",
  category: "general",
  active: true,
};

export const news18TamilNadu: RSSSourceConfig = {
  id: "news18-tamil-nadu-google",
  name: "News18 Tamil Nadu via Google News",
  nameTa: "News18 தமிழ்நாடு",
  feedUrl: "https://news.google.com/rss/search?q=site%3Atamil.news18.com%20Tamil%20Nadu%20when%3A2d&hl=ta&gl=IN&ceid=IN:ta",
  websiteUrl: "https://tamil.news18.com/tamil-nadu",
  logoUrl: "https://tamil.news18.com/favicon.ico",
  category: "general",
  active: true,
};
