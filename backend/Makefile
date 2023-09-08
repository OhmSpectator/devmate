IMAGE_NAME := devmate_backend
CONTAINER_NAME := devmate_backend_instance

.PHONY: run clean

# default target to run when executing `make`
all: build run info

# build the Docker image
build:
	@docker build -t $(IMAGE_NAME) .

# run the Docker container with port forwarding
run: clean
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
clean: stop
	@if [ -n "$$(docker ps -aq -f name=$(CONTAINER_NAME))" ]; then docker rm $(CONTAINER_NAME); else echo "Container $(CONTAINER_NAME) does not exist."; fi


# remove the Docker image
clean-image:
	@docker rmi $(IMAGE_NAME)

# remove everything
clean-all: clean clean-image

# Check if the container is up
check-container:
	@if [ -z "$$(docker ps -q -f name=$(CONTAINER_NAME))" ]; then echo "Container $(CONTAINER_NAME) is not running."; exit 1; fi

# enter the Docker container
shell: check-container
	@docker exec -it $(CONTAINER_NAME) /bin/bash

test:
	@pytest ./tests


