package main

import (
	"log"
	"worker/internal"
)

func main() {
	if err := internal.InitLogger(); err != nil {
		log.Fatalf("Falha ao inicializar logger: %v", err)
	}
	defer internal.CloseLogger()

	internal.LogInfo("Iniciando Worker...")

	cfg := internal.Load()
	svc := internal.NewWeatherService(cfg)
	internal.StartConsumer(cfg.RabbitURL, cfg.QueueName, svc.ProcessPayload)
}