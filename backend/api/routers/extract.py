from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging
from agents.nodes.extractor import OrderExtractorAgent

router = APIRouter()
logger = logging.getLogger(__name__)

class ExtractRequest(BaseModel):
    text: str

@router.post("/extract")
async def extract_order(request: ExtractRequest):
    """
    Extracts structured order data from natural language text.
    """
    try:
        if not request.text:
            raise HTTPException(status_code=400, detail="Text input is required")

        logger.info(f"Extracting order from text: {request.text[:50]}...")
        
        agent = OrderExtractorAgent()
        order = agent.extract(request.text)
        
        logger.info(f"Successfully extracted order for: {order.item}")
        return order
        
    except Exception as e:
        logger.error(f"Error extracting order: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
