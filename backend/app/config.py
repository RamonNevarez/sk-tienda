import os


def database_url():
    configured_url = os.getenv('DATABASE_URL')
    if configured_url:
        if configured_url.startswith('postgres://'):
            return configured_url.replace('postgres://', 'postgresql+psycopg://', 1)
        if configured_url.startswith('postgresql://'):
            return configured_url.replace('postgresql://', 'postgresql+psycopg://', 1)
        if configured_url.startswith('sqlite:///'):
            database_path = configured_url.removeprefix('sqlite:///')
            if database_path.startswith('/'):
                os.makedirs(os.path.dirname(database_path), exist_ok=True)
            else:
                backend_path = os.path.dirname(os.path.dirname(__file__))
                instance_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance')
                os.makedirs(instance_path, exist_ok=True)
                if database_path.startswith('instance/'):
                    absolute_path = os.path.abspath(os.path.join(backend_path, database_path))
                else:
                    absolute_path = os.path.abspath(os.path.join(instance_path, database_path))
                return f"sqlite:///{absolute_path.replace(os.sep, '/')}"
        return configured_url

    instance_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance')
    os.makedirs(instance_path, exist_ok=True)
    return f"sqlite:///{os.path.join(instance_path, 'store.db').replace(os.sep, '/')}"


class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-me')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-me')
    SQLALCHEMY_DATABASE_URI = database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_ORIGINS = [origin.strip() for origin in os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(',') if origin.strip()]
