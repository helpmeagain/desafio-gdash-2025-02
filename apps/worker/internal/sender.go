package internal

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type WeatherService struct {
	cfg    *Config
	client *http.Client
}

func NewWeatherService(cfg *Config) *WeatherService {
	return &WeatherService{
		cfg: cfg,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (s *WeatherService) ProcessPayload(body []byte) error {
	var payload WeatherPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		LogError("JSON Inválido recebido: %v", err)
		return err
	}

	if payload.Source == "" {
		LogInfo("Payload ignorado: campo 'source' vazio.")
		return nil
	}

	city := "Desconhecida"
	if payload.Location.City != "" {
		city = payload.Location.City
	}

	if err := s.sendWithRetry(body, city); err != nil {
		return err
	}

	LogInfo("SUCESSO: Dados de %s enviados para API.", city)
	return nil
}

func (s *WeatherService) sendWithRetry(data []byte, cityName string) error {
	var lastErr error
	for i := 0; i < s.cfg.MaxRetries; i++ {
		err := s.postToAPI(data)
		if err == nil {
			return nil
		}
		
		lastErr = err
		LogInfo("Tentativa %d/%d falhou para %s: %v. Retentando em %v...", 
			i+1, s.cfg.MaxRetries, cityName, err, s.cfg.RetryBackoff)
		
		time.Sleep(s.cfg.RetryBackoff)
	}
	
	LogError("Esgotadas tentativas para %s. Erro final: %v", cityName, lastErr)
	return lastErr
}

func (s *WeatherService) postToAPI(data []byte) error {
	resp, err := s.client.Post(s.cfg.ApiUrl, "application/json", bytes.NewBuffer(data))
	if err != nil {
		return fmt.Errorf("erro de conexão: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return nil
	}
	
	if resp.StatusCode == 400 {
		LogError("API retornou 400 Bad Request. Verifique o formato do JSON.")
		return nil
	}

	return fmt.Errorf("API retornou status %s", resp.Status)
}