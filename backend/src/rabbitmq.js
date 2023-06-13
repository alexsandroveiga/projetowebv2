const amqp = require("amqplib");

const connect = async () => {
  try {
    const connection = await amqp.connect("amqp://localhost:5672");
    const channel = await connection.createChannel();
    return { connection, channel };
  } catch (error) {
    console.error("Erro ao conectar-se ao RabbitMQ:", error);
    throw error;
  }
};

const assertQueue = async (channel, queueName) => {
  try {
    await channel.assertQueue(queueName, { durable: true });
    console.log(`Fila ${queueName} criada com sucesso.`);
  } catch (error) {
    console.error(`Erro ao criar a fila ${queueName}:`, error);
    throw error;
  }
};

const enviarTarefaParaFila = async (tarefa) => {
  try {
    const { connection, channel } = await connect();

    // Verificar se a conexão foi estabelecida corretamente
    if (!connection) {
      throw new Error("Falha ao estabelecer conexão com o RabbitMQ");
    }

    // Verificar se o canal foi criado corretamente
    if (!channel) {
      throw new Error("Falha ao criar canal no RabbitMQ");
    }

    await assertQueue(channel, "fila_de_emails");
    const content = JSON.stringify(tarefa);
    await channel.sendToQueue("fila_de_emails", Buffer.from(content));
    console.log("Tarefa de envio de e-mail enviada para a fila:", tarefa);

    // Fechar a conexão após enviar a tarefa
    await connection.close();
  } catch (error) {
    console.error("Erro ao enviar a tarefa de envio de e-mail:", error);
    throw error;
  }
};

module.exports = { enviarTarefaParaFila };
