import logging
from fetch_data import fetch_weather_data
from send_data import send_weather_data_to_rabbitmq
import os

def weather_job():
    logging.info('Iniciando coleta de dados do clima')
    LATITUDE = float(os.getenv('LATITUDE', '41.902782'))
    LONGITUDE = float(os.getenv('LONGITUDE', '12.496366'))

    data = fetch_weather_data(LATITUDE, LONGITUDE)
    if data:
        send_weather_data_to_rabbitmq(data)
    logging.info('Finalizando coleta de dados do clima')