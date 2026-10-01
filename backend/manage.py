import getpass
import sys

from app import create_app, db
from app.models.user import User


def create_admin():
    username = input('Usuario administrador: ').strip()
    if not username:
        print('El usuario es obligatorio.')
        return 1

    password = getpass.getpass('Contraseña: ')
    confirmation = getpass.getpass('Repite la contraseña: ')
    if not password or password != confirmation:
        print('Las contraseñas no coinciden o están vacías.')
        return 1

    app = create_app()
    with app.app_context():
        if User.query.filter_by(username=username).first():
            print('El usuario ya existe.')
            return 1

        user = User(username=username, role='admin')
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        print(f'Administrador "{username}" creado correctamente.')
    return 0


def reset_admin_password():
    username = input('Usuario administrador: ').strip()
    if not username:
        print('El usuario es obligatorio.')
        return 1

    password = getpass.getpass('Nueva contraseña: ')
    confirmation = getpass.getpass('Repite la nueva contraseña: ')
    if not password or password != confirmation:
        print('Las contraseñas no coinciden o están vacías.')
        return 1

    app = create_app()
    with app.app_context():
        user = User.query.filter_by(username=username).first()
        if not user:
            print('No existe ese usuario administrador.')
            return 1

        user.set_password(password)
        db.session.commit()
        print(f'Contraseña de "{username}" actualizada correctamente.')
    return 0


if __name__ == '__main__':
    commands = {
        'create-admin': create_admin,
        'reset-admin-password': reset_admin_password,
    }
    if len(sys.argv) != 2 or sys.argv[1] not in commands:
        print('Uso: python manage.py create-admin | reset-admin-password')
        raise SystemExit(1)
    raise SystemExit(commands[sys.argv[1]]())