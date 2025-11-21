import requests
import logging
from datetime import datetime
import os

def fetch_location(latitude: float, longitude: float):
    LOCATION_API_URL = os.getenv("LOCATION_API_URL","https://api.bigdatacloud.net/data/reverse-geocode-client")
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "localityLanguage": "pt"
    }

    try:
        logging.info("Requisitando localização via BigDataCloud")
        response = requests.get(LOCATION_API_URL, params=params, timeout=10)
        response.raise_for_status()

        data = response.json()

        return {
            "city": data.get("city") or data.get("locality") or "",
            "state": data.get("principalSubdivision") or "",
        }
    except Exception as e:
        logging.error(f"Erro ao obter localização: {e}")
        return {"city": "", "state": ""}


def fetch_weather_data(latitude: float, longitude: float):
    WEATHER_API_URL = os.getenv('WEATHER_API_URL', "https://api.open-meteo.com/v1/forecast")
    weather_params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m",
        "timezone": "America/Sao_Paulo"
    }

    try:
        location = fetch_location(latitude, longitude)

        logging.info("Requisitando dados da Open-Meteo")
        response = requests.get(WEATHER_API_URL, params=weather_params, timeout=10)
        response.raise_for_status()

        data = response.json()
        current = data.get("current", {})

        payload = {
            "timestamp": datetime.now().isoformat(),
            "location": {
                "city": location["city"],
                "state": location["state"],
                "lat": latitude,
                "lon": longitude
            },
            "weather": {
                "temperature_c": current.get("temperature_2m"),
                "humidity_percent": current.get("relative_humidity_2m"),
                "wind_speed_kmh": current.get("wind_speed_10m"),
                "rain_probability": current.get("precipitation_probability"),
                "condition_code": current.get("weather_code")
            },
            "source": "Open-Meteo"
        }

        logging.info(
            f"Dados coletados: {payload['location']['city']} - "
            f"{payload['weather']['temperature_c']}°C"
        )

        return payload

    except requests.exceptions.RequestException as e:
        logging.error(f"Erro na Open Meteo: {e}")
        return None