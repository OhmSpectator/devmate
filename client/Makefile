# Makefile for Device Management CLI

# Variables
PYTHON = python3
VENV = venv
PYINSTALLER = $(VENV)/bin/pyinstaller
TEST_DIR = tests
TEST_SCRIPT = test_client.py
CLI_SCRIPT = client.py
REQUIREMENTS = requirements.txt

# Targets

all: setup build

setup:
	@echo "Setting up virtual environment..."
	$(PYTHON) -m venv $(VENV)
	@echo "Activating virtual environment..."
	. $(VENV)/bin/activate
	@echo "Installing requirements..."
	$(VENV)/bin/pip install -r $(REQUIREMENTS)
	@echo "Setup complete."

build:
build:
	@echo "Building standalone binary..."
	$(PYINSTALLER) --onefile $(CLI_SCRIPT)
	@echo "Build complete. Check the 'dist' directory for the binary."

test:
	@echo "Running unit tests..."
	$(PYTHON) -m unittest $(TEST_DIR)/$(TEST_SCRIPT)
	@echo "Unit tests complete."

clean:
	@echo "Cleaning up..."
	rm -rf build dist __pycache__ *.spec
	@echo "Clean complete."

.PHONY: all setup build test clean
