# Makefile for automating ReactJS project tasks

# Setup ReactJS project
setup:
	@echo "Installing npm dependencies..."
	npm install

# Start the ReactJS development server
run:
	@echo "Checking if npm dependencies are set up..."
	@if [ ! -d node_modules ]; then \
		echo "Dependencies not installed, running setup..."; \
		make setup; \
	fi
	@echo "Starting the ReactJS development server..."
	npm start

# Clean the project
clean:
	@echo "Removing node_modules directory and package-lock.json..."
	rm -rf node_modules package-lock.json
	@echo "Clearing npm cache..."
	npm cache clean --force
	@echo "Clean completed."

.PHONY: setup start clean
