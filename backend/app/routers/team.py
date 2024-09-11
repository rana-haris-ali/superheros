from typing import List
from fastapi import APIRouter, HTTPException
from sqlalchemy.exc import IntegrityError
from starlette import status

from app.dependencies.db_dependency import DBSessionDep
from app.schemas.team import CreateTeamSchema, TeamBaseSchema, TeamWithMembersSchema
from app.services.team import create_new_team, get_teams_by_creator_id
from app.dependencies.get_current_user import CurrentUserDep

team_router = APIRouter(prefix="/teams", tags=["Team"])


@team_router.get(
    "/",
    status_code=status.HTTP_200_OK,
    # response_model=List[TeamWithMembersSchema]
)
def get_my_teams(current_user: CurrentUserDep, db: DBSessionDep):
    return get_teams_by_creator_id(current_user.id, db)


@team_router.post(
    "/", status_code=status.HTTP_201_CREATED, response_model=TeamBaseSchema
)
def create_team(
    team_params: CreateTeamSchema, current_user: CurrentUserDep, db: DBSessionDep
):
    try:
        team = create_new_team(team_params, current_user.id, db)
        if not team:
            raise HTTPException(status_code=400, detail="Please try later")
        return team
    except IntegrityError as e:
        raise HTTPException(
            status_code=400, detail="Team must contain unique and valid superheroes"
        )
