package internal

import (
	amqp "github.com/rabbitmq/amqp091-go"
)

type HandlerFunc func([]byte) error

func StartConsumer(url, queueName string, handler HandlerFunc) {
	conn, err := amqp.Dial(url)
	failOnError(err, "Falha ao conectar no RabbitMQ")
	defer conn.Close()

	ch, err := conn.Channel()
	failOnError(err, "Falha ao abrir canal")
	defer ch.Close()

	q, err := ch.QueueDeclare(queueName, true, false, false, false, nil)
	failOnError(err, "Falha ao declarar fila")

	err = ch.Qos(1, 0, false)
	failOnError(err, "Falha QoS")

	msgs, err := ch.Consume(q.Name, "", false, false, false, false, nil)
	failOnError(err, "Falha ao registrar consumidor")

	LogInfo("Worker conectado e aguardando mensagens na fila '%s'", queueName)

	forever := make(chan struct{})

	go func() {
		for d := range msgs {
			LogInfo("Mensagem recebida (Tamanho: %d bytes). Processando...", len(d.Body))

			err := handler(d.Body)

			if err != nil {
				LogError("Falha no processamento: %v. Enviando Nack.", err)
				d.Nack(false, false) 
			} else {
				d.Ack(false)
			}
		}
	}()

	<-forever
}

func failOnError(err error, msg string) {
	if err != nil {
		LogError("FATAL: %s: %s", msg, err)
		panic(msg + ": " + err.Error())
	}
}