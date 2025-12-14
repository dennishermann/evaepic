from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Any
import logging
import json
import asyncio

# Import the graph application
# We need to make sure this import works based on python path, usually 'agents.graph' should work if running from backend root
from agents.graph import app as graph_app

router = APIRouter()
logger = logging.getLogger(__name__)

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection established")
    
    try:
        # 1. Wait for the initial "start_negotiation" message
        initial_data = await websocket.receive_json()
        logger.info(f"Received start command: {initial_data}")
        
        user_input = initial_data.get("user_input", "")
        order_object = initial_data.get("order_object")
        
        if not order_object and user_input:
             # Fallback if no order object provided - but typically it should be provided now
             # We could technically call the agent here or let the graph fail, but let's just log warning
             logger.warning("No order_object provided in start command")

        # Prepare initial state
        initial_state = {
            "user_input": user_input,
            "webhook_url": None,
            "order_object": order_object,
            "all_vendors": [],
            "relevant_vendors": [],
            "vendor_strategies": {},
            "negotiation_history": {},
            "leaderboard": {},
            "conversation_ids": {},
            "rounds_completed": 0,
            "max_rounds": 3,
            "market_analysis": None,
            "final_comparison_report": None,
            "phase": "starting",
            "error": None
        }

        # Override defaults if provided
        if "max_rounds" in initial_data:
            initial_state["max_rounds"] = initial_data["max_rounds"]
            
        # 2. Run the graph stream
        # Using a sync wrapper if needed, or if app.stream is sync/async compatible
        # LangGraph app.stream is usually synchronous generator, but can be async?
        # If app.stream is sync, we might need run_in_executor to not block the event loop
        
        # Let's try iterating directly assuming it yields events
        # We need to send updates back to the frontend
        
        logger.info("Starting graph execution stream...")
        
        # Note: If app.stream is blocking, we should wrap it. 
        # Standard LangGraph compiled graph .stream() is usually synchronous unless async nodes are used.
        # However, for this environment, let's assume we can iterate.
        # To be safe against blocking the WS heartbeat, we might need to be careful.
        
        # Ideally we use app.astream if available for async support
        if hasattr(graph_app, "astream"):
            async for event in graph_app.astream(initial_state):
                await process_and_send_event(websocket, event)
        else:
            # Fallback for sync stream - might block
            for event in graph_app.stream(initial_state):
                await process_and_send_event(websocket, event)
                # Small yield to let other tasks run
                await asyncio.sleep(0.01)

        # 3. Send completion message
        await websocket.send_json({
            "type": "complete",
            "payload": {}
        })
        logger.info("Graph execution completed")
        
        # Keep connection open until client closes? Or close it?
        # Usually keep it open so client can read everything
        await websocket.receive_text() # Wait for close

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"Error in websocket endpoint: {e}", exc_info=True)
        try:
            await websocket.send_json({
                "type": "error",
                "payload": {"message": str(e)}
            })
        except:
            pass

async def process_and_send_event(websocket: WebSocket, event: Dict[str, Any]):
    """
    Process a LangGraph event and send a formatted message to the frontend.
    """
    for node_name, state_update in event.items():
        # Determine the message type based on the node
        msg_type = "progress"
        payload = {"node": node_name, "state_update": state_update}
        
        # Create a more user-friendly message based on the node
        user_message = f"Completed step: {node_name}"
        
        if node_name == "extract_order":
            # should not happen anymore in new flow, but keeping for safety
            user_message = "Order details extracted successfully."
            
        elif node_name == "fetch_vendors":
            count = len(state_update.get("all_vendors", []))
            user_message = f"Found {count} potential vendors in the database."
            
        elif node_name == "evaluate_vendor":
            # This might happen multiple times in parallel/sequence
            user_message = "Evaluated vendor suitability."
            
        elif node_name == "generate_strategy":
            user_message = "Generated negotiation strategy."
            
        elif node_name == "negotiate":
            # This is a big one, maybe we can extract partial results
            # state_update might contain 'leaderboard'
            user_message = "Negotiation round completed."
            
        elif node_name == "aggregator":
            user_message = "Finalizing market analysis and reports."
            
        # Send the raw event + formatted text
        await websocket.send_json({
            "type": msg_type,
            "message": user_message,
            "payload": payload
        })
