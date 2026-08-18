import os
from fastapi import APIRouter, HTTPException, Request, Header
from typing import Optional
from app.services.telemetry_service import insert_telemetry
from app.models.telemetry import TelemetryInput
from app.utils.logger import logger

router = APIRouter(prefix="/api/ttn", tags=["TTN LoRaWAN"])

# Secreto opcional para validar que el webhook viene de TTN.
# Configúralo en TTN como "X-Downlink-Apikey" o usa un header custom.
TTN_WEBHOOK_SECRET = os.getenv("TTN_WEBHOOK_SECRET", "")


@router.post("/uplink")
async def ttn_uplink(
    request: Request,
    x_webhook_secret: Optional[str] = Header(None, alias="X-Webhook-Secret"),
):
    """
    Webhook receptor de uplinks desde The Things Network (TTN).
    TTN envía un POST con el payload decodificado cuando llega
    telemetría de un dispositivo LoRaWAN.
    """

    # Validar secreto si está configurado
    if TTN_WEBHOOK_SECRET and x_webhook_secret != TTN_WEBHOOK_SECRET:
        logger.warning("🔒 TTN webhook: secreto inválido")
        raise HTTPException(status_code=401, detail="Webhook secret inválido")

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Payload JSON inválido")

    # Extraer identificadores del dispositivo
    end_device_ids = body.get("end_device_ids", {})
    dev_eui = end_device_ids.get("dev_eui", "unknown")
    device_id = end_device_ids.get("device_id", dev_eui)

    # Extraer el payload decodificado
    uplink_message = body.get("uplink_message", {})
    decoded = uplink_message.get("decoded_payload", {})

    if not decoded:
        logger.warning(f"⚠️  TTN uplink sin decoded_payload | device={device_id}")
        # Retornamos 200 igual para que TTN no reintente
        return {"message": "Uplink recibido sin decoded_payload, ignorado"}

    # Mapear campos del decoder al modelo interno
    temperatura  = decoded.get("temperatura")
    humedad_aire = decoded.get("humedad_aire")
    humedad_suelo = decoded.get("humedad_suelo")
    ph           = decoded.get("ph")
    voltaje      = decoded.get("voltaje") or decoded.get("BatV")

    # humedad legacy (fallback si el decoder usa campo genérico)
    humedad = decoded.get("humedad") or humedad_aire

    telemetry_data = TelemetryInput(
        deveui=dev_eui,
        humedad=humedad,
        temperatura=temperatura,
        ph=ph,
        voltaje=voltaje,
        humedad_aire=humedad_aire,
        humedad_suelo=humedad_suelo,
    )

    result = insert_telemetry(telemetry_data)

    logger.info(
        f"✅ TTN uplink procesado | device={device_id} | "
        f"temp={temperatura} hum_aire={humedad_aire} hum_suelo={humedad_suelo}"
    )

    return {
        "message": "Telemetría TTN insertada correctamente",
        "device_id": device_id,
        "dev_eui": dev_eui,
        "decoded_payload": decoded,
        "result": result,
    }
