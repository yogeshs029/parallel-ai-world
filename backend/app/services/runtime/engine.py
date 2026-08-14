import logging
from .worker import runtime_worker

logger = logging.getLogger(__name__)

class WorldRuntimeEngine:
    """
    Top-level lifecycle controller for World Runtime.
    Manages startup, shutdown, and worker thread lifecycle.
    """
    def __init__(self):
        self.worker = runtime_worker

    def start(self):
        logger.info("Initializing World Runtime Engine...")
        self.worker.start()
        logger.info("World Runtime Engine active.")

    def stop(self):
        logger.info("Shutting down World Runtime Engine...")
        self.worker.stop()
        logger.info("World Runtime Engine offline.")

runtime_engine = WorldRuntimeEngine()
