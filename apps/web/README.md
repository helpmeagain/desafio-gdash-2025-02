# Rodar dockerfile individual

Rode os comandos, é necessário estar na **raiz do projeto**:
- Criar imagem: `docker build -f apps/web/Dockerfile -t web .`
- Rodar imagem: `docker run -p 8080:80 --name web web`
- Acesse http://localhost:8080