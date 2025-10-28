"""
Image preprocessing service for OCR expense extraction.
Handles auto-rotation, deskew, contrast adjustment, and resizing.
"""

import io
from pathlib import Path
from typing import Tuple, Optional
import logging

from PIL import Image, ImageOps, ImageEnhance
import pdf2image

from app.core.config import settings

logger = logging.getLogger(__name__)


class ImagePreprocessor:
    """Handles image preprocessing for OCR."""
    
    def __init__(self):
        self.max_dimension = settings.OCR_MAX_DIMENSION
        self.dpi = settings.OCR_DPI
    
    async def preprocess_file(self, file_path: str, content_type: str) -> bytes:
        """
        Preprocess file based on content type.
        
        Args:
            file_path: Path to the file
            content_type: MIME type of the file
            
        Returns:
            Preprocessed image as bytes
        """
        if content_type == "application/pdf":
            return await self._preprocess_pdf(file_path)
        elif content_type.startswith("image/"):
            return await self._preprocess_image(file_path)
        else:
            raise ValueError(f"Unsupported content type: {content_type}")
    
    async def _preprocess_pdf(self, file_path: str) -> bytes:
        """Convert PDF first page to image and preprocess."""
        try:
            # Convert first page to image
            images = pdf2image.convert_from_path(
                file_path,
                dpi=self.dpi,
                first_page=1,
                last_page=1
            )
            
            if not images:
                raise ValueError("Failed to convert PDF to image")
            
            image = images[0]
            return await self._preprocess_image_object(image)
            
        except Exception as e:
            logger.error(f"PDF preprocessing failed: {e}")
            raise ValueError(f"PDF preprocessing failed: {e}")
    
    async def _preprocess_image(self, file_path: str) -> bytes:
        """Preprocess image file."""
        try:
            with Image.open(file_path) as image:
                return await self._preprocess_image_object(image)
        except Exception as e:
            logger.error(f"Image preprocessing failed: {e}")
            raise ValueError(f"Image preprocessing failed: {e}")
    
    async def _preprocess_image_object(self, image: Image.Image) -> bytes:
        """
        Preprocess PIL Image object.
        
        Steps:
        1. Auto-rotate based on EXIF
        2. Convert to RGB if needed
        3. Light deskew and contrast adjustment
        4. Resize to max dimension
        """
        try:
            # Step 1: Auto-rotate based on EXIF
            image = ImageOps.exif_transpose(image)
            
            # Step 2: Convert to RGB if needed
            if image.mode not in ('RGB', 'L'):
                image = image.convert('RGB')
            
            # Step 3: Light deskew and contrast adjustment
            image = await self._enhance_image(image)
            
            # Step 4: Resize to max dimension
            image = await self._resize_image(image)
            
            # Convert to bytes
            img_bytes = io.BytesIO()
            image.save(img_bytes, format='JPEG', quality=95, optimize=True)
            return img_bytes.getvalue()
            
        except Exception as e:
            logger.error(f"Image object preprocessing failed: {e}")
            raise ValueError(f"Image preprocessing failed: {e}")
    
    async def _enhance_image(self, image: Image.Image) -> Image.Image:
        """Apply light enhancement to improve OCR accuracy."""
        try:
            # Light contrast enhancement
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(1.2)  # 20% increase
            
            # Light sharpness enhancement
            enhancer = ImageEnhance.Sharpness(image)
            image = enhancer.enhance(1.1)  # 10% increase
            
            # Light brightness adjustment
            enhancer = ImageEnhance.Brightness(image)
            image = enhancer.enhance(1.05)  # 5% increase
            
            return image
            
        except Exception as e:
            logger.warning(f"Image enhancement failed, using original: {e}")
            return image
    
    async def _resize_image(self, image: Image.Image) -> Image.Image:
        """Resize image to max dimension while preserving aspect ratio."""
        try:
            width, height = image.size
            max_dim = self.max_dimension
            
            # Calculate new dimensions
            if width <= max_dim and height <= max_dim:
                return image
            
            # Calculate scaling factor
            scale_factor = min(max_dim / width, max_dim / height)
            new_width = int(width * scale_factor)
            new_height = int(height * scale_factor)
            
            # Resize with high quality
            resized = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            logger.info(f"Resized image from {width}x{height} to {new_width}x{new_height}")
            return resized
            
        except Exception as e:
            logger.error(f"Image resize failed: {e}")
            raise ValueError(f"Image resize failed: {e}")
    
    def get_image_info(self, image_bytes: bytes) -> dict:
        """Get image information for debugging."""
        try:
            with Image.open(io.BytesIO(image_bytes)) as img:
                return {
                    "format": img.format,
                    "mode": img.mode,
                    "size": img.size,
                    "width": img.width,
                    "height": img.height,
                    "has_transparency": img.mode in ('RGBA', 'LA') or 'transparency' in img.info
                }
        except Exception as e:
            logger.error(f"Failed to get image info: {e}")
            return {"error": str(e)}


# Global preprocessor instance
preprocessor = ImagePreprocessor()