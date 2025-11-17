#!/bin/bash

# Run migrations
python3 manage.py migrate --noinput

# Collect static files
python3 manage.py collectstatic --noinput

# Start Gunicorn server
gunicorn backend.wsgi --bind 0.0.0.0:$PORT
