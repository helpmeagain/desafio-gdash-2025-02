# Worker

## Rodar container individual

Rode os comandos, é necessário estar na **raiz do projeto**:

- Criar imagem: `docker build -f apps/worker/Dockerfile -t worker .`
- Rodar imagem: `docker run --name worker worker`;
- Acesse os logs para verificar o envio de dados (é necessário estar com API rodando para o envio de dados).
