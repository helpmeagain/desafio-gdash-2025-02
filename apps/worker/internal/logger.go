package internal

import (
	"io"
	"log"
	"os"
	"path/filepath"
)

var (
	infoLogger  *log.Logger
	errorLogger *log.Logger
	logFile     *os.File
)

func InitLogger() error {
	logPath := filepath.Join("logs", "app.log")

	if err := os.MkdirAll("logs", 0755); err != nil {
		return err
	}

	var err error
	logFile, err = os.OpenFile(logPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0666)
	if err != nil {
		return err
	}

	multiWriter := io.MultiWriter(os.Stdout, logFile)
	flags := log.Ldate | log.Ltime

	infoLogger = log.New(multiWriter, "INFO: ", flags)
	errorLogger = log.New(multiWriter, "ERROR: ", flags)

	return nil
}

func CloseLogger() {
	if logFile != nil {
		logFile.Close()
	}
}

func LogInfo(format string, v ...interface{}) {
	if infoLogger != nil {
		infoLogger.Printf(format, v...)
	} else {
		log.Printf("INFO (fallback): "+format, v...)
	}
}

func LogError(format string, v ...interface{}) {
	if errorLogger != nil {
		errorLogger.Printf(format, v...)
	} else {
		log.Printf("ERROR (fallback): "+format, v...)
	}
}