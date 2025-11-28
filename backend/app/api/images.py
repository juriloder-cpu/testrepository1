from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import os
import zipfile
import io
from app.core.database import get_db
from app.core.config import settings
from app.models.image import Image
from app.models.script import Script
from app.schemas.image import ImageCreate, ImageResponse, ImageGenerateRequest
from app.services.image_service import (
    generate_prompts_from_script,
    generate_image_leonardo,
    generate_image_stable_diffusion,
    generate_image_midjourney
)

router = APIRouter(prefix="/api/images", tags=["images"])


@router.get("/", response_model=List[ImageResponse])
def get_images(project_id: int = None, db: Session = Depends(get_db)):
    """Get all images, optionally filtered by project."""
    query = db.query(Image)
    if project_id:
        query = query.filter(Image.project_id == project_id)
    images = query.order_by(Image.scene_number).all()
    return images


@router.get("/{image_id}", response_model=ImageResponse)
def get_image(image_id: int, db: Session = Depends(get_db)):
    """Get a specific image by ID."""
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    return image


@router.post("/generate-prompts")
async def generate_image_prompts(script_id: int, db: Session = Depends(get_db)):
    """Generate image prompts from a script."""
    script = db.query(Script).filter(Script.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")

    prompts = await generate_prompts_from_script(script.content)
    return {"prompts": prompts}


@router.post("/generate", response_model=List[ImageResponse])
async def generate_images(
    request: ImageGenerateRequest,
    db: Session = Depends(get_db)
):
    """Generate images using specified providers."""
    try:
        prompts_to_use = []

        # Auto-generate prompts from script if requested
        if request.auto_generate_from_script and request.script_id:
            script = db.query(Script).filter(Script.id == request.script_id).first()
            if not script:
                raise HTTPException(status_code=404, detail="Script not found")

            generated_prompts = await generate_prompts_from_script(script.content)
            prompts_to_use = [
                {"prompt": p["prompt"], "scene_number": p["scene_number"]}
                for p in generated_prompts
            ]
        elif request.prompts:
            prompts_to_use = [
                {"prompt": p, "scene_number": i + 1}
                for i, p in enumerate(request.prompts)
            ]
        else:
            raise HTTPException(
                status_code=400,
                detail="Either provide prompts or enable auto_generate_from_script with script_id"
            )

        generated_images = []

        # Generate images for each prompt with each provider
        for provider in request.providers:
            for prompt_data in prompts_to_use:
                try:
                    # Generate image
                    if provider == "leonardo":
                        image_bytes = await generate_image_leonardo(db, prompt_data["prompt"])
                    elif provider == "stable_diffusion":
                        image_bytes = await generate_image_stable_diffusion(db, prompt_data["prompt"])
                    elif provider == "midjourney":
                        image_bytes = await generate_image_midjourney(db, prompt_data["prompt"])
                    else:
                        continue

                    # Save image to storage
                    storage_path = os.path.join(settings.STORAGE_PATH, "images")
                    os.makedirs(storage_path, exist_ok=True)

                    # Create unique filename
                    image_count = db.query(Image).count()
                    filename = f"image_{image_count + 1}_{provider}.png"
                    file_path = os.path.join(storage_path, filename)

                    with open(file_path, "wb") as f:
                        f.write(image_bytes)

                    # Save to database
                    image = Image(
                        project_id=request.project_id,
                        prompt=prompt_data["prompt"],
                        file_path=file_path,
                        scene_number=prompt_data["scene_number"],
                        provider=provider
                    )
                    db.add(image)
                    db.commit()
                    db.refresh(image)

                    generated_images.append(image)

                except Exception as e:
                    print(f"Error generating image with {provider}: {str(e)}")
                    continue

        return generated_images

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating images: {str(e)}")


@router.get("/{image_id}/download")
def download_image(image_id: int, db: Session = Depends(get_db)):
    """Download a single image."""
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    if not os.path.exists(image.file_path):
        raise HTTPException(status_code=404, detail="Image file not found")

    filename = os.path.basename(image.file_path)
    return FileResponse(
        image.file_path,
        media_type="image/png",
        filename=filename
    )


@router.get("/project/{project_id}/download-all")
def download_all_images(project_id: int, db: Session = Depends(get_db)):
    """Download all images for a project as a zip file."""
    images = db.query(Image).filter(Image.project_id == project_id).all()

    if not images:
        raise HTTPException(status_code=404, detail="No images found for this project")

    # Create zip file in memory
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for image in images:
            if os.path.exists(image.file_path):
                filename = os.path.basename(image.file_path)
                zip_file.write(image.file_path, filename)

    zip_buffer.seek(0)

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=project_{project_id}_images.zip"}
    )


@router.delete("/{image_id}")
def delete_image(image_id: int, db: Session = Depends(get_db)):
    """Delete an image."""
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    # Delete file
    if os.path.exists(image.file_path):
        os.remove(image.file_path)

    db.delete(image)
    db.commit()
    return {"message": "Image deleted successfully"}
