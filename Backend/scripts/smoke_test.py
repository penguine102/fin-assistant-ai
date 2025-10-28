import os
import sys
import json
import time
import uuid
import argparse
from pathlib import Path

import requests


def pp(title: str, data):
    print(f"\n=== {title} ===")
    if isinstance(data, (dict, list)):
        print(json.dumps(data, ensure_ascii=False, indent=2))
    else:
        print(str(data))


def request_json(method: str, url: str, **kwargs):
    resp = requests.request(method, url, timeout=300, **kwargs)
    content_type = resp.headers.get("content-type", "")
    try:
        data = resp.json() if "application/json" in content_type else {"text": resp.text}
    except Exception:
        data = {"text": resp.text}
    return resp.status_code, data


def main():
    parser = argparse.ArgumentParser(description="End-to-end smoke test for Backend APIs")
    parser.add_argument("--base", default=os.environ.get("API_BASE", "http://127.0.0.1:8000"))
    parser.add_argument("--image", default=os.environ.get("OCR_TEST_IMAGE", "D:/tmp10/gemini_adv/0825_vinmart5.jpg"))
    parser.add_argument("--user-id", default=os.environ.get("TEST_USER_ID", None))
    parser.add_argument("--session-id", default=os.environ.get("TEST_SESSION_ID", None))
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    base = args.base.rstrip("/")

    # 1) Health & OpenAPI
    status, data = request_json("GET", f"{base}/api/v1/ocr/health")
    pp("Health OCR", {"status": status, "data": data})

    status, _ = request_json("GET", f"{base}/api/v1/openapi.json")
    pp("OpenAPI", {"status": status})

    # 2) Ensure user (for Postgres FK)
    user_id = args.user_id
    auto_user_created = False
    if not user_id:
        rand_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
        user_payload = {"email": rand_email, "full_name": "Smoke User", "password": "pass123"}
        status, data = request_json("POST", f"{base}/api/v1/users", json=user_payload)
        if status != 201:
            pp("Create user FAILED", {"status": status, "data": data})
            sys.exit(1)
        user_id = data.get("id")
        auto_user_created = True
        pp("Create user", {"status": status, "data": data})
    else:
        pp("Using provided user", {"user_id": user_id})

    # 3) Ensure session
    session_id = args.session_id
    if not session_id:
        status, data = request_json("POST", f"{base}/api/v1/chat/sessions", params={"user_id": user_id})
        if status != 200:
            pp("Create session FAILED", {"status": status, "data": data})
            sys.exit(1)
        session_id = data.get("id")
        pp("Create session", data)
    else:
        pp("Using provided session", {"session_id": session_id})

    # 4) OCR call into this session
    image_path = Path(args.image)
    if not image_path.exists():
        pp("OCR image missing", str(image_path))
        sys.exit(1)
    form = {
        "session_id": session_id,
        "user_id": user_id,
        "debug": "false",
    }
    with open(image_path, "rb") as f:
        files = {"file": (image_path.name, f, "image/jpeg")}
        t0 = time.perf_counter()
        resp = requests.post(f"{base}/api/v1/ocr/expense:extract", data=form, files=files, timeout=600)
        dt = time.perf_counter() - t0
    try:
        ocr_data = resp.json()
    except Exception:
        ocr_data = {"text": resp.text}
    pp("OCR extract", {"status": resp.status_code, "ms": int(dt * 1000), "data": ocr_data})

    # 5) Chat with same session
    chat_payload = {
        "user_id": user_id,
        "session_id": session_id,
        "query": "Tóm tắt hóa đơn: ngày, tổng tiền, hạng mục, items.",
        "suggestion": False,
    }
    status, data = request_json("POST", f"{base}/api/v1/chat", json=chat_payload)
    pp("Chat", {"status": status, "data": data})

    # 6) History (twice to warm cache)
    history_url = f"{base}/api/v1/chat/history"
    status, data = request_json("GET", history_url, params={"session_id": session_id, "limit": 20})
    pp("History#1", {"status": status, "data": data})
    status, data = request_json("GET", history_url, params={"session_id": session_id, "limit": 20})
    pp("History#2", {"status": status, "data": data})

    # 7) Cache stats
    status, data = request_json("GET", f"{base}/api/v1/chat/cache/{session_id}/stats")
    pp("Cache stats", {"status": status, "data": data})

    # 8) Transactions + summary (use the same user_id)

    tx_payload = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "amount": 120000,
        "type": "expense",
        "category": "GRO",
        "note": "Vinmart",
        "occurred_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    status, data = request_json("POST", f"{base}/api/v1/transactions", json=tx_payload)
    pp("Create transaction", {"status": status, "data": data})

    status, data = request_json(
        "GET",
        f"{base}/api/v1/transactions/summary",
        params={
            "user_id": user_id,
            "start": "2025-01-01 00:00:00",
            "end": "2025-12-31 23:59:59",
        },
    )
    pp("Summary", {"status": status, "data": data})

    print("\nAll smoke steps completed.")


if __name__ == "__main__":
    main()


