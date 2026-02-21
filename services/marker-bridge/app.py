import io
import os
import subprocess
import tempfile
import zipfile
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse


DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = 8001
DEFAULT_TIMEOUT_SECONDS = 300
DEFAULT_MARKER_BIN = "marker_single"


app = FastAPI(title="Marker Bridge", version="0.1.0")


def to_markdown_name(file_name: str) -> str:
    safe_name = Path((file_name or "document.pdf").strip() or "document.pdf").name
    if safe_name.lower().endswith(".pdf"):
        return f"{safe_name[:-4]}.md"
    return f"{safe_name}.md"


def parse_bool(value: str | None) -> bool:
    if value is None:
        return False
    return value.strip().lower() in {"1", "true", "yes", "on"}


def read_optional_env(name: str) -> str | None:
    value = os.getenv(name)
    if not value:
        return None
    stripped = value.strip()
    return stripped or None


def build_marker_command(
    input_path: Path, output_dir: Path, fast: bool, force_ocr: bool
) -> list[str]:
    marker_bin = read_optional_env("MARKER_SINGLE_BIN") or DEFAULT_MARKER_BIN
    command = [
        marker_bin,
        str(input_path),
        "--output_dir",
        str(output_dir),
        "--output_format",
        "markdown",
    ]

    extra_flags = read_optional_env("MARKER_EXTRA_FLAGS")
    if extra_flags:
        command.extend(extra_flags.split())

    if fast:
        command.append("--disable_image_extraction")

    if force_ocr:
        command.append("--force_ocr")

    return command


def run_marker(input_path: Path, output_dir: Path, fast: bool) -> Path:
    timeout_raw = read_optional_env("MARKER_TIMEOUT_SECONDS")
    try:
        timeout = int(timeout_raw) if timeout_raw else DEFAULT_TIMEOUT_SECONDS
    except ValueError:
        timeout = DEFAULT_TIMEOUT_SECONDS
    force_ocr = parse_bool(read_optional_env("MARKER_FORCE_OCR"))
    command = build_marker_command(input_path, output_dir, fast, force_ocr)

    completed = subprocess.run(
        command, check=False, capture_output=True, text=True, timeout=timeout
    )

    if completed.returncode != 0:
        stderr = (completed.stderr or "").strip()
        stdout = (completed.stdout or "").strip()
        details = stderr or stdout or f"marker exited with code {completed.returncode}"
        raise RuntimeError(details)

    markdown_files = sorted(output_dir.rglob("*.md"))
    if not markdown_files:
        raise RuntimeError("No markdown output produced by marker")

    return markdown_files[0]


def build_zip_response(markdown_path: Path, output_name: str) -> bytes:
    data = markdown_path.read_bytes()
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(
        zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED
    ) as archive:
        archive.writestr(output_name, data)

    return zip_buffer.getvalue()


@app.get("/")
async def health() -> JSONResponse:
    return JSONResponse({"ok": True, "service": "marker-bridge"})


@app.post("/markdown")
async def convert_markdown(
    file: UploadFile = File(...),
    output_file: str | None = Form(default=None),
    fast: str | None = Form(default=None),
) -> StreamingResponse:
    source_name = Path(file.filename or "document.pdf").name
    output_name = to_markdown_name(output_file or source_name)
    fast_mode = parse_bool(fast)

    payload = await file.read()
    if not payload:
        raise HTTPException(status_code=400, detail="Empty upload")

    with tempfile.TemporaryDirectory(prefix="marker-bridge-") as tmp_dir:
        input_path = Path(tmp_dir) / source_name
        output_dir = Path(tmp_dir) / "output"
        output_dir.mkdir(parents=True, exist_ok=True)
        input_path.write_bytes(payload)

        try:
            markdown_path = run_marker(
                input_path=input_path, output_dir=output_dir, fast=fast_mode
            )
        except subprocess.TimeoutExpired:
            raise HTTPException(status_code=504, detail="Marker conversion timed out")
        except RuntimeError as error:
            raise HTTPException(
                status_code=502, detail=f"Marker conversion failed: {error}"
            )

        zip_content = build_zip_response(
            markdown_path=markdown_path, output_name=output_name
        )

    headers = {"Content-Disposition": f'attachment; filename="{output_name}.zip"'}
    return StreamingResponse(
        io.BytesIO(zip_content), media_type="application/zip", headers=headers
    )


if __name__ == "__main__":
    import uvicorn

    host = read_optional_env("HOST") or DEFAULT_HOST
    port = int(read_optional_env("PORT") or DEFAULT_PORT)
    uvicorn.run("app:app", host=host, port=port)
