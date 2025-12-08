package internal

import (
	"os"
	"time"
)

type Config struct {
	RabbitURL     string
	QueueName     string
	ApiUrl        string
	AuthUrl       string
	AdminEmail    string
	AdminPassword string
	MaxRetries    int
	RetryBackoff  time.Duration
}

func Load() *Config {
	return &Config{
		RabbitURL:     getEnv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"),
		QueueName:     getEnv("QUEUE_NAME", "weather_queue"),
		ApiUrl:        getEnv("API_URL", "http://localhost:3000/weather/logs"),
		AuthUrl:       getEnv("AUTH_URL", "http://localhost:3000/auth/login"), 
		AdminEmail:    getEnv("ADMIN_EMAIL", ""),
		AdminPassword: getEnv("ADMIN_PASSWORD", ""),
		MaxRetries:    3,
		RetryBackoff:  2 * time.Second,
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}