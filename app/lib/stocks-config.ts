import stockList from "../data/stocks.json";

export type StockConfig = {
  symbol: string;
  name: string;
  logoUrl?: string;
  enabled: boolean;
  showChart?: boolean;
};

export function getStocks(): StockConfig[] {
  return stockList as StockConfig[];
}

export function getEnabledStocks(): StockConfig[] {
  return getStocks()
    .filter((stock) => stock.enabled)
    .map((stock) => ({
      ...stock,
      showChart: stock.showChart ?? true,
    }));
}
