#    Weather Dashboard, data and insights about climate
#    Copyright (C) 2025  Felipe da Costa Marques

#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as
#    published by the Free Software Foundation, either version 3 of the
#    License, or (at your option) any later version.

#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.

#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <https://www.gnu.org/licenses/>.
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