from typing import Generic, List, Sequence, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: Sequence[T]
    total: int
    page: int
    size: int


def paginate(items: List[T], total: int, page: int, size: int) -> Page[T]:
    return Page(items=items, total=total, page=page, size=size)





