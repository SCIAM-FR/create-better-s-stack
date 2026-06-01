from streamlit.testing.v1 import AppTest


def test_app_renders_without_error() -> None:
    at = AppTest.from_file("app.py").run()
    assert not at.exception


def test_app_shows_the_project_title() -> None:
    at = AppTest.from_file("app.py").run()
    assert at.title[0].value == "ws-verify"
