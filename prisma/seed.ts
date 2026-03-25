import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // 관리자 계정
  const admin = await prisma.user.upsert({
    where: { email: "admin@bdelivery.com" },
    update: {},
    create: {
      email: "admin@bdelivery.com",
      nickname: "관리자",
      role: "ADMIN",
    },
  });
  console.log("Created admin:", admin.email);

  // 테스트 사장 계정
  const owner = await prisma.user.upsert({
    where: { email: "owner@bdelivery.com" },
    update: {},
    create: {
      email: "owner@bdelivery.com",
      nickname: "테스트사장",
      role: "OWNER",
      defaultAddress: "서울특별시 강남구 테헤란로 123",
      latitude: 37.5665,
      longitude: 126.978,
    },
  });
  console.log("Created owner:", owner.email);

  // 테스트 고객 계정
  const customer = await prisma.user.upsert({
    where: { email: "user@bdelivery.com" },
    update: {},
    create: {
      email: "user@bdelivery.com",
      nickname: "테스트고객",
      role: "USER",
      defaultAddress: "서울특별시 강남구 역삼동 456",
      latitude: 37.5012,
      longitude: 127.0396,
    },
  });
  console.log("Created customer:", customer.email);

  // 테스트 음식점
  const restaurant = await prisma.restaurant.upsert({
    where: { ownerId: owner.id },
    update: {},
    create: {
      ownerId: owner.id,
      name: "맛있는 치킨집",
      category: "CHICKEN",
      description: "바삭바삭 맛있는 치킨 전문점",
      minOrderAmount: 15000,
      deliveryFee: 3000,
      deliveryTime: 30,
      isOpen: true,
      latitude: 37.5665,
      longitude: 126.978,
    },
  });
  console.log("Created restaurant:", restaurant.name);

  // 테스트 메뉴
  const menus = [
    {
      name: "후라이드 치킨",
      price: 18000,
      description: "바삭바삭 후라이드",
      category: "치킨",
    },
    {
      name: "양념 치킨",
      price: 19000,
      description: "달콤 매콤 양념 치킨",
      category: "치킨",
    },
    {
      name: "반반 치킨",
      price: 19000,
      description: "후라이드 + 양념 반반",
      category: "치킨",
    },
    {
      name: "콜라 1.25L",
      price: 2500,
      description: "시원한 콜라",
      category: "음료",
    },
  ];

  // 기존 메뉴 삭제 후 재생성 (시드 멱등성)
  await prisma.menu.deleteMany({
    where: { restaurantId: restaurant.id },
  });

  await prisma.menu.createMany({
    data: menus.map((menu) => ({
      restaurantId: restaurant.id,
      ...menu,
    })),
  });
  console.log(`Created ${menus.length} menus`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
