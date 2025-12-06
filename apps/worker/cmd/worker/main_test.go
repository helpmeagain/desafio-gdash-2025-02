package main

import (
	"bytes"
	"io"
	"os"
	"testing"
)

func TestMainOutput(t *testing.T) {
	// Capturar saída padrão
	old := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	main()

	w.Close()
	out, _ := io.ReadAll(r)
	os.Stdout = old

	if !bytes.Contains(out, []byte("Worker rodando!")) {
		t.Errorf("esperado 'Worker rodando!', recebeu: %s", string(out))
	}
}
