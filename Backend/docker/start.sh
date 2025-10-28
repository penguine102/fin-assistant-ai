#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Chat AI Backend...${NC}"

# Function to check if database is ready
check_database() {
    echo -e "${YELLOW}⏳ Checking database connection...${NC}"
    python -c "
import asyncio
import sys
from sqlalchemy import text
from app.db.session import engine

async def check_db():
    try:
        async with engine.begin() as conn:
            await conn.execute(text('SELECT 1'))
        print('✅ Database connection successful')
        return True
    except Exception as e:
        print(f'❌ Database connection failed: {e}')
        return False

if not asyncio.run(check_db()):
    sys.exit(1)
"
}

# Function to run migrations
run_migrations() {
    echo -e "${YELLOW}🔄 Running database migrations...${NC}"
    
    # Check current migration status
    echo -e "${BLUE}📋 Current migration status:${NC}"
    alembic current
    
    # Run migrations
    echo -e "${BLUE}⬆️  Upgrading database to latest version...${NC}"
    if alembic upgrade head; then
        echo -e "${GREEN}✅ Database migration completed successfully!${NC}"
    else
        echo -e "${RED}❌ Database migration failed!${NC}"
        exit 1
    fi
}

# Function to start FastAPI
start_fastapi() {
    echo -e "${GREEN}🚀 Starting FastAPI application...${NC}"
    echo -e "${BLUE}📡 Server will be available at: http://localhost:${APP_PORT:-8000}${NC}"
    echo -e "${BLUE}📚 API Documentation: http://localhost:${APP_PORT:-8000}/docs${NC}"
    
    uvicorn app.main:app --host 0.0.0.0 --port ${APP_PORT:-8000}
}

# Main execution
main() {
    # Wait a bit for database to be ready
    sleep 2
    
    # Check database connection
    if ! check_database; then
        echo -e "${RED}❌ Database is not ready. Exiting...${NC}"
        exit 1
    fi
    
    # Run migrations
    run_migrations
    
    # Start FastAPI
    start_fastapi
}

# Run main function
main
