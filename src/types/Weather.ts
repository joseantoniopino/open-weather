export interface CurrentWeather {
  temperature: number;
  unitSymbol: string;
}

export interface DailyForecast {
  date: string;
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  precipitationProbability: number | null;
}

export interface Forecast {
  days: DailyForecast[];
  unitSymbol: string;
}
