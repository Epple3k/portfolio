FROM python:3.11-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend backend
COPY migrations migrations
COPY alembic.ini .
CMD ["sh","-c","alembic upgrade head && exec uvicorn backend.app:app --host 0.0.0.0 --port ${PORT:-8000}"]
