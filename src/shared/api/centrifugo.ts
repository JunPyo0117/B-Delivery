/**
 * Centrifugo Server API 클라이언트
 * Next.js API Routes에서 Centrifugo에 메시지를 발행할 때 사용
 */

const CENTRIFUGO_API_URL =
  process.env.CENTRIFUGO_API_URL || "http://localhost:8080/api";
const CENTRIFUGO_API_KEY = process.env.CENTRIFUGO_API_KEY || "";

async function centrifugoRequest(endpoint: string, body: Record<string, unknown>) {
  const res = await fetch(`${CENTRIFUGO_API_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": CENTRIFUGO_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Centrifugo API error: ${res.status} ${text}`);
  }

  return res.json();
}

/** 특정 채널에 데이터 발행 */
export async function publish(channel: string, data: unknown) {
  return centrifugoRequest("publish", { channel, data });
}

/** 특정 사용자를 채널에 서버 사이드 구독 */
export async function subscribe(user: string, channel: string) {
  return centrifugoRequest("subscribe", { user, channel });
}

/** 특정 사용자를 채널에서 구독 해제 */
export async function unsubscribe(user: string, channel: string) {
  return centrifugoRequest("unsubscribe", { user, channel });
}
