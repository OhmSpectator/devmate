# Use an official Python runtime as a base image
FROM python:3.10-slim-buster

# Create and switch to a new user
RUN useradd -m devmate
# Set the working directory inside the container
WORKDIR /app
RUN chown devmate:devmate /app
USER devmate

# Add the user's local bin directory to PATH
ENV PATH="/home/devmate/.local/bin:${PATH}"

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1


# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user --disable-pip-version-check -r requirements.txt

# Copy the application into the container
COPY --chown=devmate:devmate ./devmateback /app/devmateback

# Expose the port the app runs on
EXPOSE 8000

# Run gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:8000", "devmateback.app:app", "--log-file", "-"]
