from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.db.database import get_db
from backend.app.models.saved_filter import SavedFilter
from backend.app.schemas.filter_ast import SavedFilterCreate, SavedFilterRead

router = APIRouter(prefix="/filters", tags=["filters"])

@router.get("", response_model=List[SavedFilterRead])
def list_saved_filters(db: Session = Depends(get_db)):
    filters = db.query(SavedFilter).order_by(SavedFilter.created_at.desc()).all()
    return [
        SavedFilterRead(
            id=f.id,
            name=f.name,
            ast=f.ast,
            is_favorite=f.is_favorite,
            created_at=f.created_at.isoformat()
        )
        for f in filters
    ]

@router.post("", response_model=SavedFilterRead)
def save_filter(payload: SavedFilterCreate, db: Session = Depends(get_db)):
    new_filter = SavedFilter(
        name=payload.name,
        ast=payload.ast.model_dump(),
        is_favorite=payload.is_favorite or False
    )
    db.add(new_filter)
    db.commit()
    db.refresh(new_filter)

    return SavedFilterRead(
        id=new_filter.id,
        name=new_filter.name,
        ast=new_filter.ast,
        is_favorite=new_filter.is_favorite,
        created_at=new_filter.created_at.isoformat()
    )

@router.delete("/{id}")
def delete_filter(id: int, db: Session = Depends(get_db)):
    f = db.query(SavedFilter).filter(SavedFilter.id == id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Filter not found")
    db.delete(f)
    db.commit()
    return {"status": "deleted", "id": id}
