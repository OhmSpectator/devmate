# Makefile for Device Management CLI

# Variables
PYTHON = python3
VENV = venv
PYINSTALLER = $(VENV)/bin/pyinstaller
TEST_DIR = tests
TEST_SCRIPT = test_client.py
CLI_SCRIPT = devmatecli/client.py
REQUIREMENTS = requirements.txt
OUTPUT_CLI_NAME = devmate

# Targets

all: setup build

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

build: check-venv
	@echo "Building standalone binary..."
	. $(VENV)/bin/activate; $(PYINSTALLER) --onefile --name $(OUTPUT_CLI_NAME) $(CLI_SCRIPT)
	@echo "Build complete. The final binary is located at 'dist/devmate'."


tests: check-venv
	@echo "Running unit tests..."
	. $(VENV)/bin/activate; $(PYTHON) -m unittest $(TEST_DIR)/$(TEST_SCRIPT)
	@echo "Unit tests complete."

clean:
	@echo "Cleaning up..."
	rm -rf build dist __pycache__ *.spec
	rm -rf $(VENV)
	rm -rf devmatecli/__pycache__
	rm -rf tests/__pycache__
	@echo "Clean complete."

.PHONY: all setup build tests clean check-python check-venv
