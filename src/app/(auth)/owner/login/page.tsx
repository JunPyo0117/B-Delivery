import { signIn } from "@/auth";

export const metadata = { title: "사장님 로그인 - B-Delivery" };

export default async function OwnerLoginPage() {

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-6">
      <div className="mb-6 flex h-[120px] w-[120px] items-center justify-center rounded-3xl bg-[#1a1a2e]">
        <span className="text-[56px] font-bold text-white">B</span>
      </div>

      <h1 className="text-[28px] font-bold tracking-tight">사장님 전용</h1>
      <p className="mt-2 text-sm text-gray-500">B-Delivery 사장님 관리 시스템</p>

      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/owner/dashboard" });
        }}
        className="mt-12 w-full"
      >
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-medium shadow-sm transition-colors hover:bg-gray-50"
        >
          <span className="text-lg font-bold text-[#4285F4]">G</span>
          <span>Google로 시작하기</span>
        </button>
      </form>

      {process.env.E2E_TESTING === "true" && (
        <form
          action={async (formData: FormData) => {
            "use server";
            await signIn("test-credentials", {
              email: formData.get("email") as string,
              redirectTo: "/owner/dashboard",
            });
          }}
          className="mt-6 w-full"
        >
          <p className="mb-2 text-center text-xs text-muted-foreground">테스트 로그인</p>
          <div className="flex gap-2">
            <input name="email" type="email" defaultValue="owner@bdelivery.com" className="flex-1 rounded-lg border px-3 py-2 text-sm" />
            <button type="submit" className="rounded-lg bg-[#1a1a2e] px-4 py-2 text-sm font-medium text-white">로그인</button>
          </div>
        </form>
      )}

      <p className="mt-auto pb-8 text-center text-[11px] leading-relaxed text-gray-400">
        로그인 시 서비스 이용약관 및<br />개인정보 처리방침에 동의하게 됩니다.
      </p>
    </div>
  );
}
