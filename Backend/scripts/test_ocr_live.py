import os
import sys
import json
import time
from pathlib import Path
import argparse

import requests


def main():
    parser = argparse.ArgumentParser(description="Call running OCR API with a local image file.")
    parser.add_argument("--url", default=os.environ.get("OCR_API_URL", "http://127.0.0.1:8000"), help="Base URL of running backend (default: http://127.0.0.1:8000)")
    parser.add_argument("--endpoint", default=os.environ.get("OCR_API_ENDPOINT", "/api/v1/ocr/expense:extract"), help="Endpoint path (default: /api/v1/ocr/expense:extract)")
    parser.add_argument("--session-id", default=os.environ.get("OCR_TEST_SESSION_ID", "test-session-123"), help="Session ID")
    parser.add_argument("--user-id", default=os.environ.get("OCR_TEST_USER_ID", "test-user-123"), help="User ID")
    parser.add_argument("--image", default=os.environ.get("OCR_TEST_IMAGE", None), help="Path to image file")
    parser.add_argument("--debug", action="store_true", help="Send debug=true in form data")
    args = parser.parse_args()

    # Resolve default sample image if not provided
    image_path = args.image
    if not image_path:
        # repo_root/../../ to reach project root from Chat/Backend/scripts
        repo_root = Path(__file__).resolve().parents[2]
        # image_path = str(repo_root / "gemini_adv" / "0825_vinmart5.jpg")
        image_path = "D:\\tmp10\\gemini_adv\\0825_vinmart5.jpg"
    image_file = Path(image_path)
    if not image_file.exists():
        print(f"[error] Image not found: {image_file}")
        sys.exit(1)

    url = args.url.rstrip("/") + args.endpoint
    form = {
        "session_id": args.session_id,
        "user_id": args.user_id,
        "debug": "true" if args.debug else "false",
    }

    print(f"[info] POST {url}")
    print(f"[info] session_id={args.session_id} user_id={args.user_id}")
    print(f"[info] image={image_file}")

    with open(image_file, "rb") as f:
        files = {"file": (image_file.name, f, "image/jpeg")}
        t0 = time.perf_counter()
        resp = requests.post(url, data=form, files=files, timeout=300)
        dt = time.perf_counter() - t0

    print(f"[info] status={resp.status_code} time={dt:.3f}s")
    ct = resp.headers.get("content-type", "")
    if "application/json" in ct:
        try:
            data = resp.json()
            print(json.dumps(data, ensure_ascii=False, indent=2))
            # Pretty print structured result when available
            if isinstance(data, dict) and data.get("result"):
                r = data["result"]
                print("\n[info] Parsed OCR result:")
                print(f"  - date: {r.get('transaction_date')}")
                amt = r.get('amount') or {}
                print(f"  - amount: {amt.get('value')} {amt.get('currency')}")
                cat = r.get('category') or {}
                print(f"  - category: {cat.get('name')} ({cat.get('code')})")
                items = r.get('items') or []
                if items:
                    print("  - items:")
                    for it in items:
                        print(f"    * {it.get('name')} (qty: {it.get('qty')})")
        except Exception:
            print(resp.text)
    else:
        print(resp.text)


if __name__ == "__main__":
    main()


