import re
import httpx
from typing import List, Dict
from sqlalchemy.orm import Session
from app.models.script import Script
from app.services.setting_service import get_setting_value


async def generate_prompts_from_script(script_content: str) -> List[Dict[str, any]]:
    """Extract scenes from script and generate image prompts."""

    # Extract scenes using regex
    scene_pattern = r'\[SCENE\s+(\d+):?\s*([^\]]+)\]([^[]*)'
    scenes = re.findall(scene_pattern, script_content, re.IGNORECASE | re.DOTALL)

    prompts = []
    for scene_num, description, content in scenes:
        # Clean up the description and content
        description = description.strip()
        content = content.strip()[:200]  # Limit content for context

        # Create a detailed image prompt
        prompt = f"{description}. {content[:100]}"
        prompts.append({
            "scene_number": int(scene_num),
            "prompt": prompt.strip(),
            "description": description
        })

    # If no scenes found, try to split by paragraphs
    if not prompts:
        paragraphs = [p.strip() for p in script_content.split('\n\n') if p.strip()]
        for i, para in enumerate(paragraphs[:10], 1):  # Limit to 10 scenes
            prompts.append({
                "scene_number": i,
                "prompt": para[:200],
                "description": f"Scene {i}"
            })

    return prompts


async def generate_image_leonardo(
    db: Session,
    prompt: str
) -> bytes:
    """Generate image using Leonardo.ai API."""

    api_key = get_setting_value(db, "LEONARDO_API_KEY")
    if not api_key:
        raise ValueError("Leonardo API key not configured in settings")

    # Leonardo.ai API implementation
    # Note: This is a placeholder - actual implementation depends on Leonardo API
    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "prompt": prompt,
            "num_images": 1,
            "width": 1024,
            "height": 1024,
        }

        # Placeholder - replace with actual Leonardo API endpoint
        response = await client.post(
            "https://cloud.leonardo.ai/api/rest/v1/generations",
            headers=headers,
            json=payload,
            timeout=60.0
        )

        if response.status_code != 200:
            raise Exception(f"Leonardo API error: {response.text}")

        data = response.json()
        # Download the generated image
        image_url = data.get("url")  # Adjust based on actual API response

        image_response = await client.get(image_url)
        return image_response.content


async def generate_image_stable_diffusion(
    db: Session,
    prompt: str
) -> bytes:
    """Generate image using Stable Diffusion API."""

    api_key = get_setting_value(db, "STABLE_DIFFUSION_API_KEY")
    if not api_key:
        raise ValueError("Stable Diffusion API key not configured in settings")

    # Placeholder for Stable Diffusion implementation
    # You can use Stability AI's API or run locally
    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "text_prompts": [{"text": prompt}],
            "cfg_scale": 7,
            "height": 1024,
            "width": 1024,
            "samples": 1,
            "steps": 30,
        }

        # Stability AI endpoint
        response = await client.post(
            "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
            headers=headers,
            json=payload,
            timeout=60.0
        )

        if response.status_code != 200:
            raise Exception(f"Stable Diffusion API error: {response.text}")

        data = response.json()
        # Extract image from response
        import base64
        image_data = data["artifacts"][0]["base64"]
        return base64.b64decode(image_data)


async def generate_image_midjourney(
    db: Session,
    prompt: str
) -> bytes:
    """Generate image using Midjourney (unofficial API or manual workflow)."""

    # Note: Midjourney doesn't have an official API
    # This is a placeholder for integration with unofficial APIs or manual workflow
    raise NotImplementedError(
        "Midjourney integration requires unofficial API or manual workflow. "
        "Consider using midjourney-api or similar third-party solutions."
    )
