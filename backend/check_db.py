import pandas as pd
from sqlalchemy import create_engine, text

# Neon DB 주소
NEON_DB_URL = "postgresql://neondb_owner:npg_DRxUAHng3t9h@ep-muddy-field-a12h777r-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def check_data():
    print("🔎 Neon DB를 조회합니다...")
    
    # 엔진 생성
    engine = create_engine(NEON_DB_URL)

    try:
        # 1. 연결 테스트
        with engine.connect() as conn:
            print("✅ DB 서버 연결 성공!")
            
            # 2. 테이블 목록 확인
            # (PostgreSQL에서 테이블 목록을 조회하는 쿼리입니다)
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            tables = [row[0] for row in result]
            print(f"📋 현재 존재하는 테이블: {tables}")

            if not tables:
                print("✨ 테이블이 하나도 없습니다. (아주 깨끗한 상태!)")
                return

            # 3. 만약 'store' 테이블이 있다면 데이터 조회
            if 'store' in tables:
                df = pd.read_sql("SELECT * FROM store", conn)
                print(f"\n📊 'store' 테이블 데이터 개수: {len(df)}개")
                if not df.empty:
                    print(df.head()) # 상위 5개 출력
            else:
                print("⚠️ 'store' 테이블이 아직 없습니다. (데이터 이전 필요)")

    except Exception as e:
        print(f"❌ 조회 중 오류 발생: {e}")

if __name__ == "__main__":
    check_data()