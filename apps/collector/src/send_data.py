import logging
import json
import pika
import os
from pika.exceptions import AMQPConnectionError

def send_weather_data_to_rabbitmq(data):
    if not data:
        return
    
    QUEUE_NAME = os.getenv('QUEUE_NAME', 'weather_data')
    RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'rabbitmq')
    connection = None
    try:
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=RABBITMQ_HOST)
        )
        channel = connection.channel()
        channel.queue_declare(queue=QUEUE_NAME, durable=True)

        message_body = json.dumps(data)
        channel.basic_publish(
            exchange='',
            routing_key=QUEUE_NAME,
            body=message_body,
            properties=pika.BasicProperties(
                delivery_mode=2,
                content_type='application/json'
            )
        )
        
        logging.info(f"Payload enviado para fila '{QUEUE_NAME}' com sucesso.")

    except AMQPConnectionError as e:
        logging.error(f"Falha na conexão com RabbitMQ: {e}")
    except Exception as e:
        logging.error(f"Erro inesperado ao publicar: {e}")
    finally:
        if connection and not connection.is_closed:
            connection.close()