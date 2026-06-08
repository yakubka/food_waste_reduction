import asyncio
import json
import logging

import aiomqtt

from core.config import settings
from core.database import get_pool

logger = logging.getLogger(__name__)
TOPIC = "campuseats/scales/#"


async def handle_message(message: aiomqtt.Message) -> None:
    try:
        device_id = str(message.topic).split("/")[2]
        data = json.loads(message.payload)
        weight_kg = data.get("weight_kg")
        cafeteria_id = data.get("cafeteria_id")

        if not isinstance(weight_kg, (int, float)) or weight_kg < 0:
            logger.warning("Invalid payload from %s: %s", device_id, data)
            return

        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                "INSERT INTO iot_readings (device_id, cafeteria_id, weight_kg, raw_payload) VALUES ($1,$2,$3,$4)",
                device_id, cafeteria_id, weight_kg, json.dumps(data),
            )
            if weight_kg > 5:
                await conn.execute(
                    "INSERT INTO alerts (cafeteria_id, type, severity, message) VALUES ($1,'spike','high',$2)",
                    cafeteria_id,
                    f"Scale {device_id} reported {weight_kg} kg — possible waste spike",
                )
                logger.warning("Waste spike alert: %s %.2f kg", device_id, weight_kg)
    except Exception:
        logger.exception("Error processing MQTT message")


async def run_mqtt_listener() -> None:
    while True:
        try:
            async with aiomqtt.Client(
                hostname=settings.MQTT_BROKER_HOST,
                port=settings.MQTT_BROKER_PORT,
            ) as client:
                logger.info("MQTT connected to %s:%s", settings.MQTT_BROKER_HOST, settings.MQTT_BROKER_PORT)
                await client.subscribe(TOPIC)
                async for message in client.messages:
                    await handle_message(message)
        except Exception:
            logger.exception("MQTT error, reconnecting in 5s…")
            await asyncio.sleep(5)
