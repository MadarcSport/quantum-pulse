export type StockWeather = "sunny" | "cloudy" | "rainy";

export type StockWeatherForecast = {
  weather: StockWeather;
  headline: string;
  insight: string;
  disclaimer: string;
};

export function calculateStockWeather(
  volumeSurgePct: number,
  cmfSpread: number,
  mfVelocity: number,
): StockWeatherForecast {
  const disclaimer =
    "Experimental synthesis of volume and money-flow data for education only. Not live forecasting or trade advice.";

  if (cmfSpread > 0.02 && mfVelocity > 15) {
    return {
      weather: "sunny",
      headline: "Sunny: Bullish Skies",
      insight: "Accumulation and momentum are aligned in a bullish direction.",
      disclaimer,
    };
  }

  if (cmfSpread < -0.02 && mfVelocity < -15) {
    return {
      weather: "rainy",
      headline: "Rainy: Bearish Fronts",
      insight:
        "Money flow is weakening and pressure is building to the downside.",
      disclaimer,
    };
  }

  return {
    weather: "cloudy",
    headline: "Cloudy: Mixed Signals",
    insight:
      "Signals are mixed, so the market may be churning rather than trending.",
    disclaimer,
  };
}
