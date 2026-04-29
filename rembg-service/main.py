from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from rembg import remove, new_session
from PIL import Image
import io
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Rembg Background Removal Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pre-load model on startup
session = None

@app.on_event("startup")
async def startup():
    global session
    logger.info("Loading u2net model...")
    session = new_session("u2net")
    logger.info("Model loaded successfully")

@app.get("/health")
async def health():
    return {"status": "ok", "model": "u2net"}

@app.post("/remove-bg")
async def remove_background(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await file.read()
        # Convert to PIL Image
        img = Image.open(io.BytesIO(contents)).convert("RGBA")

        # Remove background
        result = remove(img, session=session)

        # Save as PNG with transparency
        output = io.BytesIO()
        result.save(output, format="PNG", optimize=True)
        output.seek(0)

        logger.info(f"Background removed from {file.filename} ({len(contents)} bytes)")

        return Response(
            content=output.read(),
            media_type="image/png",
            headers={"X-Original-Size": str(len(contents))}
        )
    except Exception as e:
        logger.error(f"Error removing background: {e}")
        raise HTTPException(status_code=500, detail=str(e))
