package internal

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type LoginResponse struct {
	Token string `json:"access_token"` 
}

type LoginPayload struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type WeatherService struct {
	cfg    *Config
	client *http.Client
	token  string
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

func (s *WeatherService) authenticate() error {
	LogInfo("Autenticando usuário %s...", s.cfg.AdminEmail)

	authBody := LoginPayload{
		Email:    s.cfg.AdminEmail,
		Password: s.cfg.AdminPassword,
	}
	jsonBody, _ := json.Marshal(authBody)

	resp, err := s.client.Post(s.cfg.AuthUrl, "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		return fmt.Errorf("falha ao conectar no serviço de auth: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 && resp.StatusCode != 201 {
		return fmt.Errorf("falha no login. Status: %s", resp.Status)
	}

	var loginResp LoginResponse
	if err := json.NewDecoder(resp.Body).Decode(&loginResp); err != nil {
		return fmt.Errorf("falha ao decodificar resposta do login: %w", err)
	}

	if loginResp.Token == "" {
		return fmt.Errorf("token vazio recebido da API")
	}

	s.token = loginResp.Token
	LogInfo("Autenticação realizada com sucesso.")
	return nil
}

func (s *WeatherService) postToAPI(data []byte) error {
	if s.token == "" {
		if err := s.authenticate(); err != nil {
			return err
		}
	}

	executeRequest := func() (*http.Response, error) {
		req, err := http.NewRequest("POST", s.cfg.ApiUrl, bytes.NewBuffer(data))
		if err != nil {
			return nil, err
		}
		
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+s.token)
		
		return s.client.Do(req)
	}

	resp, err := executeRequest()
	if err != nil {
		return fmt.Errorf("erro de conexão: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized {
		LogInfo("Token expirado ou inválido (401). Tentando reautenticar...")
		
		s.token = ""
		if authErr := s.authenticate(); authErr != nil {
			return fmt.Errorf("erro ao reautenticar: %w", authErr)
		}

		resp, err = executeRequest()
		if err != nil {
			return fmt.Errorf("erro de conexão após reauth: %w", err)
		}
		defer resp.Body.Close()
	}

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return nil
	}
	
	if resp.StatusCode == 400 {
		LogError("API retornou 400 Bad Request. Verifique o formato do JSON.")
		return nil
	}

	return fmt.Errorf("API retornou status %s", resp.Status)
}