-- PostGIS 확장 활성화
CREATE EXTENSION IF NOT EXISTS postgis;

-- Restaurant 테이블에 geometry 컬럼 추가 (nullable — Prisma ORM이 직접 쓸 수 없으므로)
ALTER TABLE "Restaurant"
  ADD COLUMN "location" geometry(Point, 4326);

-- 기존 lat/lng 데이터를 geometry로 변환
UPDATE "Restaurant"
SET "location" = ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326);

-- GIST 공간 인덱스 생성
CREATE INDEX "Restaurant_location_gist_idx"
  ON "Restaurant" USING GIST ("location");

-- location이 NULL인 행이 생기지 않도록 트리거로 자동 동기화
CREATE OR REPLACE FUNCTION sync_restaurant_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW."location" = ST_SetSRID(ST_MakePoint(NEW."longitude", NEW."latitude"), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_restaurant_location
  BEFORE INSERT OR UPDATE OF "latitude", "longitude"
  ON "Restaurant"
  FOR EACH ROW
  EXECUTE FUNCTION sync_restaurant_location();
