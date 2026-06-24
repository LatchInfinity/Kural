export interface ScraperConfig {
  listUrl: string;
  articleItemSelector: string;
  titleSelector: string;
  linkSelector: string;
  summarySelector?: string;
  contentSelector?: string;
  imageSelector?: string;
  dateSelector?: string;
  dateParse?: (text: string) => string | null;
  linkPrefix?: string;
  encoding?: string;
}

export interface RSSSourceConfig {
  id: string;
  name: string;
  nameTa: string;
  feedUrl: string;
  websiteUrl: string;
  logoUrl: string;
  category: string;
  active: boolean;
  scraper?: ScraperConfig;
  apiProvider?: string;
  notes?: string;
}
