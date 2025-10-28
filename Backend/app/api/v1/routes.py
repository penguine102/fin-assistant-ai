from fastapi import APIRouter
from app.modules.users.routes import router as users_router
from app.modules.auth.routes import router as auth_router
from app.modules.chat.routes import router as chat_router
from app.modules.transactions.routes import router as transactions_router
from app.modules.ocr_expense.routes import router as ocr_expense_router

router = APIRouter()


@router.get("/ping", tags=["health"])
async def ping():
    return {"message": "pong"}


api_router = APIRouter()
api_router.include_router(router, prefix="/health")
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(chat_router)
api_router.include_router(transactions_router)
api_router.include_router(ocr_expense_router)


