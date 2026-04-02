#!/bin/bash

# Inicia o servidor em segundo plano
ollama serve &

# Aguarda o servidor ligar
sleep 10

# Baixa o modelo leve
ollama pull llama3.2:1b

# Mantém o processo vivo
wait