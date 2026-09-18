import os
import shutil
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import yt_dlp

app = FastAPI(title="MediaFlow Hub Backend")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "temp_downloads"
os.makedirs(TEMP_DIR, exist_ok=True)


class DownloadRequest(BaseModel):
    url: str
    platform: str
    format: str = "mp4"
    resolution: str = "1080"


@app.post("/api/download")
async def download_media(req: DownloadRequest):
    out_template = os.path.join(TEMP_DIR, "%(id)s.%(ext)s")

    ydl_opts = {
        'outtmpl': out_template,
        'quiet': True,
    }

    if req.format == "mp3":
        ydl_opts.update({
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '320',
            }],
        })
    else:
        # Video with resolution limit
        res = req.resolution if req.resolution in ["1080", "720", "480", "360"] else "1080"
        ydl_opts['format'] = f'bestvideo[height<={res}]+bestaudio/best/best'

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(req.url, download=True)
            filename = ydl.prepare_filename(info)
            if req.format == "mp3":
                filename = os.path.splitext(filename)[0] + ".mp3"

            return FileResponse(filename, media_type="application/octet-stream", filename=os.path.basename(filename))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/convert")
async def convert_file(
        file: UploadFile = File(...),
        from_format: str = Form(...),
        to_format: str = Form(...)
):
    input_path = os.path.join(TEMP_DIR, file.filename)
    output_filename = f"converted_{os.path.splitext(file.filename)[0]}.{to_format.lower()}"
    output_path = os.path.join(TEMP_DIR, output_filename)

    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Example using ffmpeg for audio/video media conversion
        if from_format.lower() in ["mp4", "mp3", "wav", "mov"] and to_format.lower() in ["mp3", "wav", "mp4", "mov"]:
            os.system(f'ffmpeg -y -i "{input_path}" "{output_path}"')
        else:
            # Fallback simple copy or text format simulation for demo
            shutil.copy(input_path, output_path)

        return FileResponse(output_path, media_type="application/octet-stream", filename=output_filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)