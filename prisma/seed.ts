import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// ─── 지역 중심 좌표 ───
const GANGNAM = { lat: 37.5053, lng: 127.0492, label: "강남" }; // 테헤란로 427
const YEONGDEUNGPO = { lat: 37.544, lng: 126.8967, label: "영등포" }; // 선유서로25길 28

function jitter(base: number, range = 0.012) {
  return base + (Math.random() - 0.5) * 2 * range;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── 음식점 템플릿 (카테고리별) ───
type Category =
  | "KOREAN"
  | "CHINESE"
  | "JAPANESE"
  | "CHICKEN"
  | "PIZZA"
  | "BUNSIK"
  | "JOKBAL"
  | "CAFE"
  | "FASTFOOD"
  | "ETC";

interface RestaurantTemplate {
  names: string[];
  category: Category;
  description: string[];
  menus: { name: string; price: number; description: string; category: string }[];
}

const templates: RestaurantTemplate[] = [
  {
    category: "KOREAN",
    names: [
      "백종원의 한식당",
      "시골밥상",
      "할매순대국",
      "놀부부대찌개",
      "본가 감자탕",
      "한솥도시락",
      "미소야 김치찌개",
      "산골한정식",
      "고봉민 김밥",
      "토속촌 삼계탕",
      "이모네 된장",
      "참좋은밥집",
      "온달 비빔밥",
      "명동 칼국수",
      "진짜 국밥",
      "시래기마을",
      "엄마손 반찬",
      "오복 한정식",
      "다래 쌈밥",
      "보리밭 보리밥",
    ],
    description: [
      "정성 가득 엄마의 손맛",
      "신선한 재료로 만든 건강한 한식",
      "매일 새벽 직접 우린 육수",
      "푸짐한 반찬과 따뜻한 밥",
    ],
    menus: [
      { name: "된장찌개", price: 8000, description: "구수한 된장찌개", category: "찌개" },
      { name: "김치찌개", price: 8000, description: "얼큰한 김치찌개", category: "찌개" },
      { name: "제육볶음", price: 10000, description: "매콤 제육볶음 정식", category: "정식" },
      { name: "순두부찌개", price: 8500, description: "부드러운 순두부", category: "찌개" },
      { name: "비빔밥", price: 9000, description: "신선한 나물 비빔밥", category: "밥" },
      { name: "돼지갈비", price: 13000, description: "양념 돼지갈비", category: "구이" },
      { name: "불고기 정식", price: 11000, description: "달콤한 불고기 정식", category: "정식" },
      { name: "계란찜", price: 3000, description: "폭신폭신 계란찜", category: "반찬" },
      { name: "공기밥", price: 1000, description: "갓 지은 공기밥", category: "밥" },
    ],
  },
  {
    category: "CHINESE",
    names: [
      "홍콩반점",
      "북경 짬뽕",
      "용문각",
      "만리장성",
      "짜장의 신",
      "대박 중화요리",
      "천지 중식당",
      "태화루",
      "황궁 중식",
      "금룡각",
      "양자강",
      "일품 짜장",
      "사천성 마라탕",
      "동방명주",
      "진미 짬뽕",
    ],
    description: [
      "정통 중화요리 전문점",
      "30년 전통 중식 맛집",
      "화덕에서 볶아낸 정통 중식",
      "면발이 살아있는 짬뽕",
    ],
    menus: [
      { name: "짜장면", price: 7000, description: "춘장 듬뿍 짜장면", category: "면" },
      { name: "짬뽕", price: 8000, description: "얼큰한 해물짬뽕", category: "면" },
      { name: "탕수육 (소)", price: 15000, description: "바삭한 찹쌀 탕수육", category: "튀김" },
      { name: "탕수육 (대)", price: 22000, description: "대자 탕수육", category: "튀김" },
      { name: "볶음밥", price: 8000, description: "새우볶음밥", category: "밥" },
      { name: "간짜장", price: 8000, description: "건더기 가득 간짜장", category: "면" },
      { name: "깐풍기", price: 18000, description: "매콤달콤 깐풍기", category: "튀김" },
      { name: "마파두부", price: 9000, description: "얼얼한 마파두부", category: "요리" },
      { name: "군만두 (5개)", price: 5000, description: "바삭 군만두", category: "만두" },
    ],
  },
  {
    category: "JAPANESE",
    names: [
      "스시야",
      "이치란 라멘",
      "텐동의 정석",
      "사쿠라 초밥",
      "미소노 돈카츠",
      "하나 우동",
      "큐슈 라멘",
      "오마카세 스시",
      "나가사키 짬뽕",
      "마루 카레",
      "돈카츠 명인",
      "카쯔야",
      "후쿠오카 라멘",
      "모리 소바",
      "야키토리 이자카야",
    ],
    description: [
      "정통 일식 전문점",
      "매일 아침 공수하는 신선한 재료",
      "장인의 정성이 담긴 일식",
      "본고장의 맛 그대로",
    ],
    menus: [
      { name: "돈코츠 라멘", price: 11000, description: "진한 돼지뼈 육수 라멘", category: "라멘" },
      { name: "로스카츠", price: 13000, description: "두껍고 바삭한 로스카츠", category: "돈카츠" },
      { name: "히레카츠", price: 14000, description: "부드러운 안심 돈카츠", category: "돈카츠" },
      { name: "연어초밥 (8p)", price: 15000, description: "신선한 연어초밥", category: "초밥" },
      { name: "새우텐동", price: 12000, description: "바삭한 새우 텐동", category: "텐동" },
      { name: "카레라이스", price: 9000, description: "걸쭉한 일본식 카레", category: "카레" },
      { name: "우동", price: 8000, description: "쫄깃한 사누끼 우동", category: "우동" },
      { name: "미소시루", price: 2000, description: "된장국", category: "국물" },
    ],
  },
  {
    category: "CHICKEN",
    names: [
      "교촌치킨",
      "BBQ치킨",
      "BHC치킨",
      "네네치킨",
      "굽네치킨",
      "호식이 두마리치킨",
      "바른치킨",
      "또래오래",
      "치킨플러스",
      "페리카나",
      "푸라닭 치킨",
      "노랑통닭",
      "60계 치킨",
      "치킨 매니아",
      "이가네 숯불치킨",
    ],
    description: [
      "바삭바삭 갓 튀긴 치킨",
      "자체 개발 소스의 깊은 맛",
      "국내산 신선한 닭만 사용",
      "주문 즉시 바로 튀기는 치킨",
    ],
    menus: [
      { name: "후라이드 치킨", price: 18000, description: "바삭 후라이드", category: "치킨" },
      { name: "양념 치킨", price: 19000, description: "달콤 매콤 양념", category: "치킨" },
      { name: "간장 치킨", price: 19000, description: "달콤한 간장 소스", category: "치킨" },
      { name: "마늘 치킨", price: 19000, description: "알싸한 마늘 치킨", category: "치킨" },
      { name: "반반 치킨", price: 19000, description: "후라이드 + 양념 반반", category: "치킨" },
      { name: "뿌링클", price: 20000, description: "치즈가루 뿌링클", category: "치킨" },
      { name: "치킨텐더 (8p)", price: 12000, description: "부드러운 순살 텐더", category: "사이드" },
      { name: "치즈볼 (5p)", price: 4000, description: "쫀득 치즈볼", category: "사이드" },
      { name: "콜라 1.25L", price: 2500, description: "시원한 콜라", category: "음료" },
    ],
  },
  {
    category: "PIZZA",
    names: [
      "도미노피자",
      "피자헛",
      "미스터피자",
      "파파존스",
      "7번가 피자",
      "피자알볼로",
      "피자스쿨",
      "청년피자",
      "오구피자",
      "반올림 피자",
      "빽보이 피자",
      "고피자",
      "피자마루",
      "피자나라 치킨공주",
      "에땅 피자",
    ],
    description: [
      "화덕에서 구워낸 정통 피자",
      "넉넉한 토핑의 프리미엄 피자",
      "신선한 재료로 만든 수제 피자",
      "바삭한 도우의 맛있는 피자",
    ],
    menus: [
      { name: "페퍼로니 피자 (L)", price: 19000, description: "클래식 페퍼로니", category: "피자" },
      { name: "콤비네이션 피자 (L)", price: 22000, description: "푸짐한 콤비네이션", category: "피자" },
      { name: "고구마 피자 (L)", price: 23000, description: "달콤한 고구마 무스", category: "피자" },
      { name: "불고기 피자 (L)", price: 22000, description: "한국식 불고기 토핑", category: "피자" },
      { name: "치즈 피자 (L)", price: 17000, description: "모짜렐라 듬뿍", category: "피자" },
      { name: "포테이토 웨지", price: 5000, description: "바삭한 감자 웨지", category: "사이드" },
      { name: "치즈 오븐 스파게티", price: 8000, description: "치즈 스파게티", category: "사이드" },
      { name: "콜라 1.25L", price: 2500, description: "시원한 콜라", category: "음료" },
    ],
  },
  {
    category: "BUNSIK",
    names: [
      "신전떡볶이",
      "죠스떡볶이",
      "엽기떡볶이",
      "응급실 떡볶이",
      "동대문 엽기 떡볶이",
      "이삭토스트",
      "김밥천국",
      "바른 김밥",
      "고봉민 김밥인",
      "핫도그 천국",
      "감탄 떡볶이",
      "두끼 떡볶이",
      "국대떡볶이",
      "청년 다방",
      "명랑 핫도그",
    ],
    description: [
      "매콤달콤 추억의 분식",
      "가성비 끝판왕 분식점",
      "학생들이 사랑하는 맛",
      "든든한 한끼 분식",
    ],
    menus: [
      { name: "떡볶이", price: 5000, description: "매콤 쫀득 떡볶이", category: "떡볶이" },
      { name: "순대", price: 4000, description: "당면 순대", category: "순대" },
      { name: "튀김 모듬", price: 4500, description: "야채+고구마+김말이", category: "튀김" },
      { name: "라볶이", price: 6000, description: "라면 + 떡볶이", category: "떡볶이" },
      { name: "참치 김밥", price: 4000, description: "참치마요 김밥", category: "김밥" },
      { name: "소떡소떡", price: 3000, description: "소시지 + 떡", category: "간식" },
      { name: "치즈 핫도그", price: 3500, description: "쫀득 치즈 핫도그", category: "간식" },
      { name: "오뎅탕", price: 3000, description: "따뜻한 어묵탕", category: "국물" },
    ],
  },
  {
    category: "JOKBAL",
    names: [
      "만족오향족발",
      "원할머니 보쌈",
      "놀부 보쌈",
      "장충동 왕족발",
      "족발야시장",
      "보쌈 마을",
      "태릉 족발",
      "대왕 족발보쌈",
      "참족발",
      "명동 족발",
      "서울 왕보쌈",
      "마포 원조 족발",
      "황금 족발",
      "족발 대가",
      "오늘 족발",
    ],
    description: [
      "쫀득쫀득 콜라겐 가득 족발",
      "12시간 정성껏 삶은 족발",
      "신선한 보쌈과 함께",
      "특제 소스에 숙성한 족발",
    ],
    menus: [
      { name: "족발 (소)", price: 29000, description: "앞다리 족발 소", category: "족발" },
      { name: "족발 (중)", price: 35000, description: "앞다리 족발 중", category: "족발" },
      { name: "보쌈 (소)", price: 27000, description: "수육 보쌈 소", category: "보쌈" },
      { name: "보쌈 (중)", price: 33000, description: "수육 보쌈 중", category: "보쌈" },
      { name: "막국수", price: 7000, description: "시원한 물막국수", category: "면" },
      { name: "쟁반막국수", price: 9000, description: "비빔 쟁반막국수", category: "면" },
      { name: "쪽파겉절이", price: 3000, description: "아삭한 쪽파겉절이", category: "반찬" },
    ],
  },
  {
    category: "CAFE",
    names: [
      "스타벅스",
      "투썸플레이스",
      "이디야커피",
      "메가MGC커피",
      "컴포즈커피",
      "빽다방",
      "파스쿠찌",
      "할리스커피",
      "카페베네",
      "달콤커피",
      "더벤티",
      "설빙",
      "요거프레소",
      "카페드플로어",
      "폴바셋",
    ],
    description: [
      "향긋한 원두로 내린 커피",
      "달콤한 디저트와 함께",
      "편안한 분위기의 카페",
      "매일 로스팅하는 신선한 원두",
    ],
    menus: [
      { name: "아메리카노", price: 4500, description: "깔끔한 아메리카노", category: "커피" },
      { name: "카페라떼", price: 5000, description: "부드러운 라떼", category: "커피" },
      { name: "바닐라라떼", price: 5500, description: "달콤한 바닐라라떼", category: "커피" },
      { name: "아이스티", price: 4500, description: "복숭아 아이스티", category: "음료" },
      { name: "딸기 스무디", price: 6000, description: "신선한 딸기 스무디", category: "음료" },
      { name: "초코 케이크", price: 6500, description: "진한 초코 케이크", category: "디저트" },
      { name: "크로플", price: 5000, description: "바삭 쫀득 크로플", category: "디저트" },
      { name: "티라미수", price: 6500, description: "이탈리안 티라미수", category: "디저트" },
      { name: "마카롱 (3개)", price: 5500, description: "수제 마카롱 세트", category: "디저트" },
    ],
  },
  {
    category: "FASTFOOD",
    names: [
      "맥도날드",
      "버거킹",
      "롯데리아",
      "맘스터치",
      "노브랜드버거",
      "KFC",
      "써브웨이",
      "쉐이크쉑",
      "파이브가이즈",
      "슈퍼두퍼",
      "다운타우너",
      "프랭크버거",
      "이삭버거",
      "줄라이",
      "드롭탑 버거",
    ],
    description: [
      "빠르고 맛있는 버거",
      "주문 즉시 조리하는 신선한 버거",
      "100% 순쇠고기 패티",
      "가성비 좋은 수제버거",
    ],
    menus: [
      { name: "클래식 버거", price: 7000, description: "기본에 충실한 클래식", category: "버거" },
      { name: "치즈버거", price: 7500, description: "체다치즈 버거", category: "버거" },
      { name: "더블 버거", price: 9500, description: "패티 두 장 더블", category: "버거" },
      { name: "치킨버거", price: 7500, description: "바삭한 치킨 패티", category: "버거" },
      { name: "감자튀김 (M)", price: 3000, description: "바삭 감자튀김", category: "사이드" },
      { name: "감자튀김 (L)", price: 4000, description: "대자 감자튀김", category: "사이드" },
      { name: "너겟 (6p)", price: 4000, description: "치킨 너겟 6조각", category: "사이드" },
      { name: "콜라 (M)", price: 2000, description: "콜라", category: "음료" },
      { name: "밀크셰이크", price: 4500, description: "바닐라 밀크셰이크", category: "음료" },
    ],
  },
  {
    category: "ETC",
    names: [
      "동남아 쌀국수",
      "인도커리 하우스",
      "타코벨",
      "서브웨이 샐러드",
      "포메인 쌀국수",
      "월남쌈 전문점",
      "터키 케밥",
      "태국음식 방콕",
      "멕시칸 브리또",
      "그릭요거트 바",
      "샐러디",
      "뷔페 왕국",
      "하노이의 아침",
      "이태원 팟타이",
      "사이공 포",
    ],
    description: [
      "이색적인 세계 음식",
      "본고장의 맛 그대로 재현",
      "건강하고 신선한 세계 음식",
      "다양한 세계 요리를 한자리에서",
    ],
    menus: [
      { name: "쌀국수", price: 10000, description: "베트남 정통 쌀국수", category: "면" },
      { name: "월남쌈 (4p)", price: 8000, description: "신선한 월남쌈", category: "쌈" },
      { name: "카레라이스", price: 9000, description: "향신료 가득 카레", category: "밥" },
      { name: "팟타이", price: 11000, description: "새콤달콤 팟타이", category: "면" },
      { name: "케밥", price: 8000, description: "양고기 케밥", category: "케밥" },
      { name: "브리또", price: 9000, description: "치킨 브리또", category: "브리또" },
      { name: "똠양꿍", price: 12000, description: "새콤매콤 똠양꿍", category: "국물" },
      { name: "망고 스무디", price: 5000, description: "달콤한 망고 스무디", category: "음료" },
    ],
  },
];

// ─── 지역별 주소 접미사 ───
const gangnamAddresses = [
  "서울 강남구 테헤란로",
  "서울 강남구 역삼로",
  "서울 강남구 논현로",
  "서울 강남구 봉은사로",
  "서울 강남구 삼성로",
  "서울 강남구 선릉로",
  "서울 강남구 도산대로",
  "서울 강남구 학동로",
  "서울 강남구 압구정로",
  "서울 강남구 영동대로",
];

const yeongdeungpoAddresses = [
  "서울 영등포구 선유서로",
  "서울 영등포구 당산로",
  "서울 영등포구 영등포로",
  "서울 영등포구 양평로",
  "서울 영등포구 국제금융로",
  "서울 영등포구 여의대방로",
  "서울 영등포구 문래로",
  "서울 마포구 양화로",
  "서울 마포구 월드컵북로",
  "서울 마포구 홍익로",
];

interface RestaurantSeed {
  ownerEmail: string;
  ownerNickname: string;
  name: string;
  category: Category;
  description: string;
  address: string;
  lat: number;
  lng: number;
  minOrderAmount: number;
  deliveryFee: number;
  deliveryTime: number;
  menus: { name: string; price: number; description: string; category: string }[];
}

function generateRestaurants(
  region: { lat: number; lng: number; label: string },
  addresses: string[],
  startIdx: number,
  count: number
): RestaurantSeed[] {
  const result: RestaurantSeed[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    const tmpl = templates[i % templates.length];
    // 같은 지역 내 이름 중복 방지
    let name: string;
    do {
      name = pick(tmpl.names);
    } while (usedNames.has(name));
    usedNames.add(name);

    const suffix = region.label === "강남" ? pick(["강남점", "역삼점", "삼성점", "선릉점", "대치점"]) : pick(["영등포점", "당산점", "문래점", "여의도점", "양평점"]);
    const fullName = `${name} ${suffix}`;

    // 3~6개 메뉴 랜덤 선택
    const shuffled = [...tmpl.menus].sort(() => Math.random() - 0.5);
    const menuCount = randInt(3, Math.min(6, shuffled.length));
    const selectedMenus = shuffled.slice(0, menuCount);

    const addr = pick(addresses);
    const num = randInt(1, 200);

    result.push({
      ownerEmail: `owner${startIdx + i}@test.com`,
      ownerNickname: `사장${startIdx + i}`,
      name: fullName,
      category: tmpl.category,
      description: pick(tmpl.description),
      address: `${addr} ${num}`,
      lat: jitter(region.lat),
      lng: jitter(region.lng),
      minOrderAmount: pick([10000, 12000, 13000, 14000, 15000, 16000, 18000, 20000]),
      deliveryFee: pick([0, 1000, 2000, 2500, 3000, 3500, 4000]),
      deliveryTime: pick([20, 25, 30, 35, 40, 45, 50]),
      menus: selectedMenus,
    });
  }
  return result;
}

async function main() {
  console.log("🌱 시드 데이터 생성 시작...\n");

  // ─── 기존 계정 유지 ───
  const admin = await prisma.user.upsert({
    where: { email: "admin@bdelivery.com" },
    update: {},
    create: {
      email: "admin@bdelivery.com",
      nickname: "관리자",
      role: "ADMIN",
    },
  });
  console.log("✓ admin:", admin.email);

  const owner = await prisma.user.upsert({
    where: { email: "owner@bdelivery.com" },
    update: {},
    create: {
      email: "owner@bdelivery.com",
      nickname: "테스트사장",
      role: "OWNER",
      defaultAddress: "서울특별시 강남구 테헤란로 123",
      latitude: 37.5053,
      longitude: 127.0492,
    },
  });
  console.log("✓ owner:", owner.email);

  const customer = await prisma.user.upsert({
    where: { email: "user@bdelivery.com" },
    update: {},
    create: {
      email: "user@bdelivery.com",
      nickname: "테스트고객",
      role: "USER",
      defaultAddress: "서울특별시 강남구 테헤란로 427",
      latitude: 37.5053,
      longitude: 127.0492,
    },
  });
  console.log("✓ customer:", customer.email);

  // ─── RIDER 계정 ───
  const rider = await prisma.user.upsert({
    where: { email: "rider@bdelivery.com" },
    update: {},
    create: {
      email: "rider@bdelivery.com",
      nickname: "테스트기사",
      role: "RIDER",
      defaultAddress: "서울특별시 강남구 역삼로 100",
      latitude: 37.5013,
      longitude: 127.0396,
    },
  });

  await prisma.riderProfile.upsert({
    where: { userId: rider.id },
    update: {},
    create: {
      userId: rider.id,
      transportType: "MOTORCYCLE",
      activityArea: "서울 강남구",
      activityLat: 37.5053,
      activityLng: 127.0492,
      activityRadius: 5,
    },
  });

  await prisma.riderLocation.upsert({
    where: { userId: rider.id },
    update: {},
    create: {
      userId: rider.id,
      latitude: 37.5013,
      longitude: 127.0396,
      isOnline: false,
    },
  });
  console.log("✓ rider:", rider.email);

  // 기존 테스트 음식점 유지
  const existingRestaurant = await prisma.restaurant.upsert({
    where: { ownerId: owner.id },
    update: {},
    create: {
      ownerId: owner.id,
      name: "맛있는 치킨집",
      category: "CHICKEN",
      description: "바삭바삭 맛있는 치킨 전문점",
      address: "서울 강남구 테헤란로 123",
      minOrderAmount: 15000,
      deliveryFee: 3000,
      deliveryTime: 30,
      isOpen: true,
      latitude: 37.5053,
      longitude: 127.049,
    },
  });

  await prisma.menu.deleteMany({ where: { restaurantId: existingRestaurant.id } });
  await prisma.menu.createMany({
    data: [
      { restaurantId: existingRestaurant.id, name: "후라이드 치킨", price: 18000, description: "바삭바삭 후라이드", category: "치킨" },
      { restaurantId: existingRestaurant.id, name: "양념 치킨", price: 19000, description: "달콤 매콤 양념 치킨", category: "치킨" },
      { restaurantId: existingRestaurant.id, name: "반반 치킨", price: 19000, description: "후라이드 + 양념 반반", category: "치킨" },
      { restaurantId: existingRestaurant.id, name: "콜라 1.25L", price: 2500, description: "시원한 콜라", category: "음료" },
    ],
  });
  console.log("✓ 기존 음식점:", existingRestaurant.name);

  // ─── 대량 음식점 생성 ───
  const gangnamRestaurants = generateRestaurants(GANGNAM, gangnamAddresses, 1, 100);
  const ydpRestaurants = generateRestaurants(YEONGDEUNGPO, yeongdeungpoAddresses, 101, 100);
  const allRestaurants = [...gangnamRestaurants, ...ydpRestaurants];

  console.log(`\n📍 강남 지역: ${gangnamRestaurants.length}개 음식점`);
  console.log(`📍 영등포 지역: ${ydpRestaurants.length}개 음식점`);
  console.log(`📦 총 ${allRestaurants.length}개 음식점 생성 중...\n`);

  let created = 0;
  for (const r of allRestaurants) {
    // 사장 계정 생성
    const ownerUser = await prisma.user.upsert({
      where: { email: r.ownerEmail },
      update: {},
      create: {
        email: r.ownerEmail,
        nickname: r.ownerNickname,
        role: "OWNER",
        defaultAddress: r.address,
        latitude: r.lat,
        longitude: r.lng,
      },
    });

    // 음식점 생성
    const rest = await prisma.restaurant.upsert({
      where: { ownerId: ownerUser.id },
      update: {
        name: r.name,
        category: r.category,
        description: r.description,
        address: r.address,
        minOrderAmount: r.minOrderAmount,
        deliveryFee: r.deliveryFee,
        deliveryTime: r.deliveryTime,
        latitude: r.lat,
        longitude: r.lng,
        isOpen: true,
      },
      create: {
        ownerId: ownerUser.id,
        name: r.name,
        category: r.category,
        description: r.description,
        address: r.address,
        minOrderAmount: r.minOrderAmount,
        deliveryFee: r.deliveryFee,
        deliveryTime: r.deliveryTime,
        latitude: r.lat,
        longitude: r.lng,
        isOpen: true,
      },
    });

    // 메뉴 생성 (기존 삭제 후)
    await prisma.menu.deleteMany({ where: { restaurantId: rest.id } });
    await prisma.menu.createMany({
      data: r.menus.map((m) => ({ restaurantId: rest.id, ...m })),
    });

    created++;
    if (created % 20 === 0) {
      console.log(`  ... ${created}/${allRestaurants.length} 완료`);
    }
  }

  console.log(`\n✅ 시드 완료! 총 ${created}개 음식점 + 메뉴 생성 (PostGIS location은 트리거로 자동 동기화)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
