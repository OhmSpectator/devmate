# Use an official Python runtime as a base image
FROM python:3.10-slim-buster

ENV DEVMATE_USER=devmate

# Create and switch to a new user
RUN useradd -m ${DEVMATE_USER}

# Set the working directory inside the container
ENV CUR_WORKDIR /app
WORKDIR ${CUR_WORKDIR}
# Set the DB directory, it also used by the application and passed with env variable during the gunicon run
ENV DB_DIR=${CUR_WORKDIR}/db-data
ENV CLI_DIR=${CUR_WORKDIR}/cli-data

RUN chown -R ${DEVMATE_USER}:${DEVMATE_USER} ${CUR_WORKDIR}

USER ${DEVMATE_USER}

RUN mkdir -p $DB_DIR
RUN mkdir -p $CLI_DIR

# Add the user's local bin directory to PATH
ENV PATH="/home/${DEVMATE_USER}/.local/bin:${PATH}"

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install dependencies
COPY --chown=${DEVMATE_USER}:${DEVMATE_USER} requirements.txt .
RUN pip install --no-cache-dir --user --disable-pip-version-check -r requirements.txt

# Copy the application into the container
COPY --chown=$DEVMATE_USER:$DEVMATE_USER ./devmateback /app/devmateback

# Copy the migration scripts into the container
COPY --chown=$DEVMATE_USER:$DEVMATE_USER ./migrations /app/migrations

# Set the ENV variables
ENV FLASK_APP devmateback/app.py

# Expose the port the app runs on
EXPOSE 8000

# Run gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:8000", "devmateback.app:app", "--log-file", "-"]
