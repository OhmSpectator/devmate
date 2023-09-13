.PHONY: run stop stop-keep-db build logs clean restart shell status help

run:
	@which docker-compose >/dev/null 2>&1 || (echo "Error: docker-compose is not installed." && exit 1)
	@docker-compose up -d
	@echo "------------------------------------------"
	@echo "Backend is running at: http://localhost:8001"
	@echo "Web UI is running at: http://localhost:8080"
	@echo "------------------------------------------"

stop:
	@docker-compose down

stop-keep-db:
	@docker-compose down --remove-orphans

build:
	@docker-compose build

logs:
	@docker-compose logs -f

clean:
	@docker-compose down -v

restart: stop run

status:
	@docker-compose ps

help:
	@echo "Available targets:"
	@echo "  run          - Start all services"
	@echo "  stop         - Stop all services and remove volumes"
	@echo "  stop-keep-db - Stop all services but keep the database volume"
	@echo "  build        - Build the services"
	@echo "  logs         - Tail logs for all services"
	@echo "  clean        - Remove all persistent data"
	@echo "  restart      - Restart all services"
	@echo "  status       - Display service status"
	@echo "  help         - Show this help message"
