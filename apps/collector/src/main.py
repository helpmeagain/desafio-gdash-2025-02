import logging
from jobs import weather_job
from dotenv import load_dotenv
import time
import schedule
import sys

logger = logging.getLogger()
logger.setLevel(logging.INFO)

stdout_handler = logging.StreamHandler(sys.stdout)
stdout_handler.setLevel(logging.INFO)
stdout_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
file_handler = logging.FileHandler('collector.log')
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))

logger.addHandler(stdout_handler)
logger.addHandler(file_handler)

load_dotenv()

if __name__ == "__main__":
    logging.info("Serviço Collector iniciado. Agendado para rodar a cada 1 hora.")
    weather_job()

    schedule.every(1).hour.do(weather_job)
    while True:
        schedule.run_pending()
        time.sleep(60)