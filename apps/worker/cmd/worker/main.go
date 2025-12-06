//   Weather Dashboard, data and insights about climate
//   Copyright (C) 2025  Felipe da Costa Marques

//   This program is free software: you can redistribute it and/or modify
//   it under the terms of the GNU Affero General Public License as
//   published by the Free Software Foundation, either version 3 of the
//   License, or (at your option) any later version.

//   This program is distributed in the hope that it will be useful,
//   but WITHOUT ANY WARRANTY; without even the implied warranty of
//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//   GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
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