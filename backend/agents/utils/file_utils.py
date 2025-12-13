"""
File Utilities for Agent Nodes
"""

import os
import base64
import logging
import mimetypes
from pathlib import Path
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

def get_file_message_content(filename: str) -> Optional[Dict[str, Any]]:
    """
    Read a local file from backend/data and return the content block for Anthropic API.
    
    Supports:
    - PDF: returns base64 encoded document block
    - Images: returns base64 encoded image block (jpeg, png, gif, webp)
    - Text: returns text block
    
    Args:
        filename: Name of file in backend/data directory
        
    Returns:
        Dict compatible with LangChain/Anthropic message content or None if error/unsupported
    """
    try:
        data_dir = Path(os.getcwd()) / "backend" / "data"
        if not data_dir.exists():
            # Fallback if running from backend root
            data_dir = Path(os.getcwd()) / "data"
            
        file_path = data_dir / filename
        
        if not file_path.exists():
            # Try absolute path or just the filename directly if it's already a full path
            if Path(filename).exists():
                 file_path = Path(filename)
            else:
                logger.warning(f"[FILE_UTILS] File not found: {file_path}")
                return None
            
        mime_type, _ = mimetypes.guess_type(file_path)
        
        if not mime_type:
            # Default to text if unknown
            mime_type = "text/plain"
            
        logger.info(f"[FILE_UTILS] Reading {filename} as {mime_type}")
        
        # 1. PDF Handling
        if mime_type == "application/pdf":
            with open(file_path, "rb") as f:
                data = base64.b64encode(f.read()).decode("utf-8")
                return {
                    "type": "document",
                    "source": {
                        "type": "base64",
                        "media_type": mime_type,
                        "data": data
                    }
                }
                
        # 2. Image Handling
        elif mime_type.startswith("image/"):
            with open(file_path, "rb") as f:
                data = base64.b64encode(f.read()).decode("utf-8")
                return {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": mime_type,
                        "data": data
                    }
                }
                
        # 3. Text Handling (default)
        else:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    text_content = f.read()
                    return {
                        "type": "text", 
                        "text": f"--- DOCUMENT: {filename} ---\n{text_content}\n--- END DOCUMENT ---\n"
                    }
            except UnicodeDecodeError:
                logger.warning(f"[FILE_UTILS] Could not read {filename} as text. Skipping.")
                return None
                
    except Exception as e:
        logger.error(f"[FILE_UTILS] Error reading file {filename}: {e}")
        return None
