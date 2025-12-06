package internal

type Location struct {
	City  string  `json:"city"`
	State string  `json:"state"`
	Lat   float64 `json:"lat"`
	Lon   float64 `json:"lon"`
}

type WeatherData struct {
	TempC         float64 `json:"temperature_c"`
	Humidity      float64 `json:"humidity_percent"`
	WindSpeed     float64 `json:"wind_speed_kmh"`
	RainProb      float64 `json:"rain_probability"`
	ConditionCode int     `json:"condition_code"`
}

type WeatherPayload struct {
	Timestamp string      `json:"timestamp"`
	Source    string      `json:"source"`
	Location  Location    `json:"location"`
	Weather   WeatherData `json:"weather"`
}