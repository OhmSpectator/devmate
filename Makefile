include .env
.PHONY: run stop build logs clean restart status help setup check-python venv-check cli-dir cli-dir-clean db-dir db-clean update-cli distclean certs-gen

VENV = venv
PYTHON = python3
REQUIREMENTS = requirements.txt

COMPOSE_FILE = docker-compose.yml
PROTO="http"

# Check if SSL certificates exist
SSL_MODE ?= $(shell if [ -f ./backend/certs/server.key ] && [ -f ./backend/certs/server.cert ] && [ -f ./webui/certs/server.key ] && [ -f ./webui/certs/server.cert ]; then echo "true"; else echo "false"; fi)

ifeq ($(SSL_MODE), true)
  COMPOSE_FILE = docker-compose-ssl.yml
  PROTO="https"
endif

check-python:
	@echo "Checking if Python is installed..."
	@command -v $(PYTHON) >/dev/null 2>&1 || { echo "Python 3 is not installed. Aborting."; exit 1;}

setup: check-python
	@echo "Setting up virtual environment..."
	$(PYTHON) -m venv $(VENV)
	@echo "Installing requirements..."
	. $(VENV)/bin/activate; $(PYTHON) -m pip install -r $(REQUIREMENTS)
	@echo "Setup complete."

venv-check:
	@if [ ! -d "$(VENV)" ]; then make setup; fi

venv-clean:
	@rm -rf $(VENV)

cli-dir: venv-check
	@echo "Fetching CLI..."
	. $(VENV)/bin/activate; $(PYTHON) ./backend/fetch-cli.py
	@mkdir -p $(HOST_CLI_DIR)
	@echo tar xzvf devmate-cli.tar.gz -C $(HOST_CLI_DIR)
	@tar xzvf devmate-cli.tar.gz -C $(HOST_CLI_DIR)
	@rm -rf ./devmate-cli.tar.gz


cli-dir-clean:
	@rm -rf $(HOST_CLI_DIR)/*

db-dir:
	@mkdir -p $(HOST_DB_DIR)

db-clean:
	@rm -rf $(HOST_DB_DIR)


update-cli: cli-dir-clean cli-dir

run: db-dir cli-dir
	@which docker-compose >/dev/null 2>&1 || (echo "Error: docker-compose is not installed." && exit 1)
	@docker-compose -f $(COMPOSE_FILE) up -d
	@echo "------------------------------------------"
	@echo "Backend is running at: $(PROTO)://localhost:${DEVMATE_BACKEND_PORT}"
	@echo "Web UI is running at: $(PROTO)://localhost:${DEVMATE_WEBUI_PORT}"
	@echo "------------------------------------------"


stop:
	@docker-compose down

build:
	@docker-compose build

devmate-log:
	@echo "Checking if devmate_devmate-backend_1 is running..."
	@docker ps --filter "name=devmate_devmate-backend_1" --format "{{.Names}}" | grep -q "devmate_devmate-backend_1" || (echo "Container is not running. Aborting." && exit 1)
	@docker exec -it devmate_devmate-backend_1 tail -f /app/devmate.log

clean:
	@docker-compose down --rmi all -v

distclean: clean venv-clean cli-dir-clean db-clean

restart: stop run

status:
	@docker-compose ps

certs-gen:
	@echo "Generating SSL certificates..."
	@mkdir -p ./backend/certs
	@mkdir -p ./webui/certs
	@openssl req -x509 -newkey rsa:4096 -keyout ./backend/certs/server.key -out ./backend/certs/server.cert -days 365 -nodes -subj "/C=DE/ST=Berlin/L=Berlin/O=Zededa Germany GmbH/CN=localhost"
	@openssl req -x509 -newkey rsa:4096 -keyout ./webui/certs/server.key -out ./webui/certs/server.cert -days 365 -nodes -subj "/C=DE/ST=Berlin/L=Berlin/O=Zededa Germany GmbH/CN=localhost"

help:
	@echo "Available targets:"
	@echo "  run          - Start all services"
	@echo "  stop         - Stop all services and remove volumes"
	@echo "  build        - Build the services"
	@echo "  clean        - Remove all persistent data"
	@echo "  clean-all    - Remove all persistent data and images"
	@echo "  restart      - Restart all services"
	@echo "  status       - Display service status"
	@echo "  certs-gen    - Generate SSL certificates"
	@echo "  devmate-log  - Tail logs for devmate backend service"
	@echo "  help         - Show this help message"

