# Collector

## Rodar container individual
Rode os comandos, é necessário estar na **raiz do projeto**:
- Criar imagem: `docker build -f apps/collector/Dockerfile -t collector .`;
- Rodar imagem: `docker run --name collector collector`;
- Acesse os logs para verificar as coletas de dados.

## Pylance
Caso o pylance reclamar, é necessário colocar o interpertador como o venv que o poetry criou:
- Rodar `poetry env info -p` e copiar o caminho;
- Ctrl + Shift + P, depois pesquisar por "Python: Selecionar Interpretador";
- Colar o caminho retornado como interpretador.