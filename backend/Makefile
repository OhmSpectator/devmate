IMAGE_NAME := devmate_backend
CONTAINER_NAME := devmate_backend_instance

.PHONY: run clean tests

# Variables
TEST_DIR = tests
TEST_SCRIPT = test_app.py
REQUIREMENTS = requirements.txt
PYTHON = python3
VENV = venv
HOST_DB_DIR = ./db
DOCKER_DB_DIR = /app/db
HOST_PORT := 8000
APP_DIR := ./devmateback
VENV := venv
INDOCKER_USER := devmate


host-cli-dir-init: venv-check
	. $(VENV)/bin/activate; \
	python fetch-cli.py
	@mkdir -p ./cli-data
	@tar xzvf devmate-cli.tar.gz -C ./cli-data
	@rm -rf ./devmate-cli.tar.gz


host-cli-dir-clean:
	@rm -rf ./cli-dir
	@rm -rf ./devmate-cli.tar.gz

host-run: venv-check host-cli-dir-init
	. $(VENV)/bin/activate; \
	FLASK_APP=devmateback.app FLASK_ENV=development FLASK_RUN_PORT=$(HOST_PORT) flask run --host=0.0.0.0

host-info:
	@echo "=============================================="
	@echo "Your application is running on the host!"
	@echo "Access it via: http://localhost:$(HOST_PORT)"
	@echo "=============================================="

host-stop:
	@-pkill -f "flask run --host=0.0.0.0"

host-clean: host-stop venv-clean host-cli-dir-clean
	@rm -rf devices.db
	@rm -rf devmate.log
	@rm -rf devmateback/__pycache__

host-log-follow:
	@tail -f $(APP_DIR)/devmate.log

host-log:
	@tail $(APP_DIR)/devmate.log

# default target to run when executing `make`
all: docker-build docker-run info

# build the Docker image
docker-build:
	@docker build -t $(IMAGE_NAME) .

db-dir:
	@mkdir -p $(HOST_DB_DIR)


# run the Docker container with port forwarding
docker-run: clean-instance docker-build db-dir
	@docker run -d --name $(CONTAINER_NAME) -p 8000:8000 -v $(HOST_DB_DIR):/app/db $(IMAGE_NAME)

# print info on how to test the app
info: docker-check
	@echo "=============================================="
	@echo "Your Docker container is running!"
	@echo "Access it via: http://localhost:8000"
	@echo "=============================================="

# Stop the Docker container
# Use it if you run the app with `make docker-run`
docker-stop:
	@if [ -n "$$(docker ps -q -f name=$(CONTAINER_NAME))" ]; then docker stop $(CONTAINER_NAME); else echo "Container $(CONTAINER_NAME) is not running."; fi

# remove the Docker container
clean-instance: docker-stop
	@if [ -n "$$(docker ps -aq -f name=$(CONTAINER_NAME))" ]; then docker rm $(CONTAINER_NAME); else echo "Container $(CONTAINER_NAME) does not exist."; fi
	@rm -rf instance

clean-image:
	@if docker images $(IMAGE_NAME) -q | grep -q . ; then \
		docker rmi $(IMAGE_NAME); \
	else \
		echo "Image $(IMAGE_NAME) does not exist. Skipping removal."; \
	fi

docker-clean: clean-instance clean-image

clean-logs:
	@rm -f ./tests/devmate.log
	@rm -rf devmate.log

clean-db:
	@rm -rf instance
	@rm -rf db

clean-tests: clean-logs
	@rm -rf .pytest_cache
	@rm -rf tests/__pycache__

# remove everything
clean: docker-clean clean-tests host-clean

# Check if the container is up
docker-check:
	@if [ -z "$$(docker ps -q -f name=$(CONTAINER_NAME))" ]; then echo "Container $(CONTAINER_NAME) is not running."; exit 1; fi

# enter the Docker container
docker-shell: docker-check
	@docker exec -it $(CONTAINER_NAME) /bin/bash

check-python:
	@echo "Checking if Python is installed..."
	@command -v $(PYTHON) >/dev/null 2>&1 || { echo "Python 3 is not installed. Aborting."; exit 1; }

venv-check:
	@if [ ! -d "$(VENV)" ]; then make setup; fi

setup: check-python
	@echo "Setting up virtual environment..."
	$(PYTHON) -m venv $(VENV)
	@echo "Installing requirements..."
	. $(VENV)/bin/activate; $(PYTHON) -m pip install -r $(REQUIREMENTS)
	@echo "Setup complete."


tests: venv-check
	@echo "Running unit tests..."
	. $(VENV)/bin/activate; $(PYTHON) -m unittest $(TEST_DIR)/$(TEST_SCRIPT)
	@echo "Unit tests complete."

venv-clean:
	@rm -rf $(VENV)

container-log-follow: docker-check
	@docker exec -it $(CONTAINER_NAME) tail -f /app/devmate.log

container-log: docker-check
	@docker exec -it $(CONTAINER_NAME) tail /app/devmate.log

# Print the logs of the Docker container
# Use it if you run the app with `make docker-run`. It also show the docker logs if the image build or the app run failed.
docker-log:
	@docker logs $(CONTAINER_NAME)



