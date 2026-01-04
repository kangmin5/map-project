from sqlmodel import create_engine, Session

# 형식: postgresql://아이디:비번@주소:포트/DB이름
# Docker 내부 통신이 아니라면 localhost, Docker Compose라면 서비스명(postgres 등)을 씁니다.
DATABASE_URL = "postgresql://postgres:mkscsi31@localhost:5432/study"

engine = create_engine(DATABASE_URL)

def get_session():
    with Session(engine) as session:
        yield session