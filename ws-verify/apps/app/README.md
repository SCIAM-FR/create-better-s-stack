# ws-verify

A [Streamlit](https://streamlit.io) app scaffolded with [Better-T-Stack](https://better-t-stack.dev).

With Streamlit the UI _is_ the server — one process renders the interface and runs your Python.

## Getting started

Install dependencies and create the virtual environment with [uv](https://docs.astral.sh/uv/):

```sh
uv sync
```

Run the app:

```sh
uv run streamlit run app.py
```

The app is then available at http://localhost:8501.

Run the test suite:

```sh
uv run pytest
```
