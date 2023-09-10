IMAGE_NAME := devmate_backend
CONTAINER_NAME := devmate_backend_instance

.PHONY: run clean tests

# Variables
TEST_DIR = tests
TEST_SCRIPT = test_app.py
REQUIREMENTS = requirements.txt
PYTHON = python3
VENV = venv

# default target to run when executing `make`
all: build run info

# build the Docker image
build:
	@docker build -t $(IMAGE_NAME) .

# run the Docker container with port forwarding
run: clean-instance
	@docker run -d --name $(CONTAINER_NAME) -p 8001:8000 $(IMAGE_NAME)

# print info on how to test the app
info:
	@echo "=============================================="
	@echo "Your Docker container is running!"
	@echo "To test the app, open your browser and go to:"
	@echo "http://localhost:8001"
	@echo "or use curl in the terminal:"
	@echo "curl http://localhost:8001"
	@echo "=============================================="

# stop the Docker container
stop:
	@if [ -n "$$(docker ps -q -f name=$(CONTAINER_NAME))" ]; then docker stop $(CONTAINER_NAME); else echo "Container $(CONTAINER_NAME) is not running."; fi

# remove the Docker container
clean-instance: stop
	@if [ -n "$$(docker ps -aq -f name=$(CONTAINER_NAME))" ]; then docker rm $(CONTAINER_NAME); else echo "Container $(CONTAINER_NAME) does not exist."; fi
	@rm -rf instance

clean-image:
	@if docker images $(IMAGE_NAME) -q | grep -q . ; then \
		docker rmi $(IMAGE_NAME); \
	else \
		echo "Image $(IMAGE_NAME) does not exist. Skipping removal."; \
	fi

clean-docker: clean-instance clean-image

clean-logs:
	@rm -f ./tests/devmate.log
	@rm -rf devmate.log

clean-db:
	@rm -rf instance

clean-tests: clean-logs clean-db

# remove everything
clean: clean-docker clean-tests

# Check if the container is up
check-container:
	@if [ -z "$$(docker ps -q -f name=$(CONTAINER_NAME))" ]; then echo "Container $(CONTAINER_NAME) is not running."; exit 1; fi

# enter the Docker container
shell: check-container
	@docker exec -it $(CONTAINER_NAME) /bin/bash

check-python:
	@echo "Checking if Python is installed..."
	@command -v $(PYTHON) >/dev/null 2>&1 || { echo "Python 3 is not installed. Aborting."; exit 1; }

check-venv:
	@if [ ! -d "$(VENV)" ]; then make setup; fi

setup: check-python
	@echo "Setting up virtual environment..."
	$(PYTHON) -m venv $(VENV)
	@echo "Installing requirements..."
	. $(VENV)/bin/activate; $(PYTHON) -m pip install -r $(REQUIREMENTS)
	@echo "Setup complete."


tests: check-venv
	@echo "Running unit tests..."
	. $(VENV)/bin/activate; $(PYTHON) -m unittest $(TEST_DIR)/$(TEST_SCRIPT)
	@echo "Unit tests complete."



