import os
import sys
import tempfile

import pytest

# Point the app at a fresh, empty SQLite file BEFORE importing it so that
# create_app() (which runs at module import) initialises a database that is
# missing the contact_messages table — exactly the condition on a fresh
# production deployment. This makes the test fail if startup does not create
# the schema.
_TMPDIR = tempfile.mkdtemp(prefix="portfolio-test-")
os.environ["DATABASE_URI"] = f"sqlite:///{os.path.join(_TMPDIR, 'portfolio.db')}"
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["TURNSTILE_SECRET_KEY"] = "test-turnstile-key"
os.environ["ADMIN_EMAIL"] = "admin@example.com"
os.environ["ADMIN_PASSWORD"] = "test-password"

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app as app_instance, db, ContactMessage  # noqa: E402

ADMIN_CREDENTIALS = {"email": "admin@example.com", "password": "test-password"}


@pytest.fixture()
def client():
    yield app_instance.test_client()
    with app_instance.app_context():
        db.session.query(ContactMessage).delete()
        db.session.commit()


def _login(client):
    return client.post("/admin/login", data=ADMIN_CREDENTIALS, follow_redirects=False)


def test_admin_messages_requires_login(client):
    resp = client.get("/admin/messages")
    assert resp.status_code == 302
    assert resp.headers["Location"].endswith("/admin/login")


def test_admin_messages_returns_200_on_empty_database(client):
    login = _login(client)
    assert login.status_code == 302
    assert login.headers["Location"].endswith("/admin/messages")

    resp = client.get("/admin/messages")
    assert resp.status_code == 200
    assert b"No contact messages yet." in resp.data


def test_admin_messages_renders_seeded_messages(client):
    with app_instance.app_context():
        msg = ContactMessage(
            name="Alice",
            email="alice@example.com",
            subject="Hello",
            message="Testing the admin dashboard",
        )
        db.session.add(msg)
        db.session.commit()

    _login(client)
    resp = client.get("/admin/messages")
    assert resp.status_code == 200
    assert b"Alice" in resp.data
    assert b"alice@example.com" in resp.data
    assert b"Testing the admin dashboard" in resp.data


def test_admin_login_redirects_to_messages_when_authenticated(client):
    _login(client)
    resp = client.get("/admin/login")
    assert resp.status_code == 302
    assert resp.headers["Location"].endswith("/admin/messages")
