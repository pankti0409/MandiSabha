"""SSE event bus and persistence."""
from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import Any, AsyncGenerator

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import AsyncSessionLocal
from app.models import SabhaEvent

log = structlog.get_logger()

# In-memory fan-out queues: sabha_id -> list of asyncio.Queue
_listeners: dict[str, list[asyncio.Queue]] = {}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _next_seq(sabha_id: str, current_events: list) -> int:
    if not current_events:
        return 1
    return max(e.seq for e in current_events) + 1


async def emit_event(sabha_id: str, event_type: str, payload: dict[str, Any]) -> int:
    """Persist event and push to all live listeners. Returns seq number."""
    async with AsyncSessionLocal() as db:
        # Get next seq
        result = await db.execute(
            select(SabhaEvent)
            .where(SabhaEvent.sabha_id == sabha_id)
            .order_by(SabhaEvent.seq.desc())
            .limit(1)
        )
        last = result.scalar_one_or_none()
        seq = (last.seq + 1) if last else 1

        event = SabhaEvent(
            sabha_id=sabha_id,
            seq=seq,
            type=event_type,
            payload=payload,
            ts=_now(),
        )
        db.add(event)
        await db.commit()

    # Push to live listeners
    full_payload = {
        "sabhaId": sabha_id,
        "seq": seq,
        "ts": _now().isoformat(),
        "type": event_type,
        **payload,
    }
    queues = _listeners.get(sabha_id, [])
    dead = []
    for q in queues:
        try:
            q.put_nowait(full_payload)
        except asyncio.QueueFull:
            dead.append(q)
    for d in dead:
        try:
            queues.remove(d)
        except ValueError:
            pass

    log.debug("event_emitted", sabha_id=sabha_id, type=event_type, seq=seq)
    return seq


def subscribe(sabha_id: str) -> asyncio.Queue:
    """Register a new listener queue for a sabha."""
    q: asyncio.Queue = asyncio.Queue(maxsize=200)
    _listeners.setdefault(sabha_id, []).append(q)
    return q


def unsubscribe(sabha_id: str, q: asyncio.Queue) -> None:
    """Remove a listener queue."""
    try:
        _listeners.get(sabha_id, []).remove(q)
    except ValueError:
        pass


async def get_events_since(db: AsyncSession, sabha_id: str, since_seq: int = 0) -> list[dict]:
    """Replay events from DB with seq > since_seq."""
    result = await db.execute(
        select(SabhaEvent)
        .where(SabhaEvent.sabha_id == sabha_id, SabhaEvent.seq > since_seq)
        .order_by(SabhaEvent.seq)
    )
    events = result.scalars().all()
    return [
        {
            "sabhaId": sabha_id,
            "seq": e.seq,
            "ts": e.ts.isoformat(),
            "type": e.type,
            **e.payload,
        }
        for e in events
    ]


async def sse_generator(
    sabha_id: str,
    last_event_id: int,
    db: AsyncSession,
) -> AsyncGenerator[str, None]:
    """Generate SSE frames. Replays missed events then follows live."""
    # Send retry hint
    yield "retry: 3000\n\n"

    # Replay missed events
    missed = await get_events_since(db, sabha_id, last_event_id)
    for ev in missed:
        frame = _format_sse(ev)
        yield frame

    # Check if sabha is already done
    from app.models import Sabha
    result = await db.execute(select(Sabha).where(Sabha.id == sabha_id))
    sabha = result.scalar_one_or_none()
    if sabha and sabha.status in ("completed", "failed"):
        if not missed or missed[-1]["type"] != "done":
            yield f"event: done\ndata: {{\"sabhaId\":\"{sabha_id}\"}}\n\n"
        return

    # Subscribe to live events
    q = subscribe(sabha_id)
    try:
        ping_interval = 15
        elapsed = 0
        while True:
            try:
                ev = await asyncio.wait_for(q.get(), timeout=1.0)
                yield _format_sse(ev)
                if ev.get("type") == "done":
                    break
            except asyncio.TimeoutError:
                elapsed += 1
                if elapsed >= ping_interval:
                    yield ": ping\n\n"
                    elapsed = 0
    finally:
        unsubscribe(sabha_id, q)


def _format_sse(ev: dict) -> str:
    """Format an event dict as an SSE frame."""
    seq = ev.get("seq", "")
    event_type = ev.get("type", "message")
    data = json.dumps(ev)
    return f"id: {seq}\nevent: {event_type}\ndata: {data}\n\n"
