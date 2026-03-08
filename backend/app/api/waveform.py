import os
import tempfile
import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.services.waveform_service import generate_waveform_video

router = APIRouter(prefix="/api/waveform", tags=["waveform"])

# Store temp files for download
_output_files: dict[str, str] = {}


@router.post("/convert")
async def convert_mp3_to_waveform(file: UploadFile = File(...)):
    """Upload an MP3 file and convert it to a waveform video."""
    if not file.filename or not file.filename.lower().endswith(".mp3"):
        raise HTTPException(status_code=400, detail="Only MP3 files are accepted")

    if file.size and file.size > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 50MB.")

    tmpdir = tempfile.mkdtemp()
    mp3_path = os.path.join(tmpdir, "input.mp3")
    output_path = os.path.join(tmpdir, "waveform.mp4")

    try:
        content = await file.read()
        with open(mp3_path, "wb") as f:
            f.write(content)

        generate_waveform_video(mp3_path, output_path)

        file_id = str(uuid.uuid4())
        _output_files[file_id] = output_path

        base_name = os.path.splitext(file.filename)[0]

        return {
            "file_id": file_id,
            "filename": f"{base_name}_waveform.mp4",
            "message": "Waveform video generated successfully",
        }
    except FileNotFoundError:
        raise HTTPException(
            status_code=500,
            detail="FFmpeg is not installed. Please install FFmpeg to use this feature.",
        )
    except Exception as e:
        # Clean up on error
        if os.path.exists(mp3_path):
            os.unlink(mp3_path)
        if os.path.exists(output_path):
            os.unlink(output_path)
        os.rmdir(tmpdir)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download/{file_id}")
async def download_waveform(file_id: str, filename: str = "waveform.mp4"):
    """Download a generated waveform video."""
    if file_id not in _output_files:
        raise HTTPException(status_code=404, detail="File not found or expired")

    output_path = _output_files[file_id]
    if not os.path.exists(output_path):
        del _output_files[file_id]
        raise HTTPException(status_code=404, detail="File not found or expired")

    return FileResponse(
        path=output_path,
        media_type="video/mp4",
        filename=filename,
    )
