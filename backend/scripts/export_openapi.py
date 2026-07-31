import json
from pathlib import Path

from app.main import app


def main() -> None:
    output_path = Path(__file__).resolve().parents[1] / "openapi.json"
    schema = app.openapi()
    output_path.write_text(json.dumps(schema, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OpenAPI schema exported to: {output_path}")


if __name__ == "__main__":
    main()
