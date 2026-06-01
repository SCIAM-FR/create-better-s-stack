from fastapi import FastAPI

app = FastAPI(title="ws-verify")


@app.get("/")
def read_root() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}
