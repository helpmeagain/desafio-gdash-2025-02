# Rodar dockerfile individual

Rode os comandos, é necessário estar na **raiz do projeto**:
- Criar imagem: `docker build -f apps/api/Dockerfile -t api .`
- Rodar imagem: `docker run -p 3000:3000 --name api api`
- Acesse http://localhost:3000