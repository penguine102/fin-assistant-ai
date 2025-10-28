import logging


def configure_logging(level: str = "INFO") -> None:
    numeric_level = getattr(logging, level.upper(), logging.INFO)
    logging.basicConfig(
        level=numeric_level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )

    # Tăng log chi tiết cho SQLAlchemy và asyncpg khi bật DEBUG
    sa_loggers = [
        "sqlalchemy.engine",
        "sqlalchemy.pool",
        "sqlalchemy.dialects",
    ]
    for name in sa_loggers:
        logging.getLogger(name).setLevel(numeric_level)

    # Thư viện asyncpg (lỗi DNS, TLS, kết nối...)
    logging.getLogger("asyncpg").setLevel(numeric_level)





