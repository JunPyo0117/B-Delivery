# 채팅 메시지 중복 버그 리포트

**날짜**: 2026-03-26
**영향 범위**: 채팅 메시지 전송 (모바일 환경)
**심각도**: Medium
**상태**: 해결 완료

## 증상

- 모바일(사설 IP 접속)에서 채팅 메시지를 전송하면 같은 메시지가 2개 렌더링됨
- React 콘솔에 `Encountered two children with the same key` 경고 발생
- PC(localhost)에서는 재현되지 않음

## 원인 분석

### 메시지 전송 흐름

```
1. sendMessage() 호출
   → optimistic 메시지 추가 (id: "temp_xxx", _tempId: "temp_xxx")

2. 서버가 message:new 이벤트 broadcast
   → addMessage()에서 real ID("78970d10-...")로 메시지 추가

3. 서버 ack 콜백 수신
   → confirmMessage()가 temp 메시지의 id를 real ID로 교체
```

### Race Condition

`addMessage`의 중복 체크 로직:

```typescript
if (message.id && existing.some((m) => m.id === message.id)) {
  return state; // 같은 id가 있으면 무시
}
```

이 로직은 **id가 동일한 경우**만 걸러낸다. 문제는 `message:new`가 `ack`보다 먼저 도착할 때 발생한다.

| 순서 | 이벤트 | 스토어 상태 |
|------|--------|------------|
| 1 | sendMessage → optimistic 추가 | `[{id: "temp_xxx", _tempId: "temp_xxx"}]` |
| 2 | message:new 도착 (real ID) | `[{id: "temp_xxx"}, {id: "78970d10-..."}]` ← **중복 체크 통과** |
| 3 | ack 콜백 → confirmMessage | `[{id: "78970d10-..."}, {id: "78970d10-..."}]` ← **동일 키 2개** |

2단계에서 temp ID(`temp_xxx`)와 real ID(`78970d10-...`)가 다르기 때문에 중복 체크를 통과하고, 3단계에서 temp 메시지의 id가 real ID로 교체되면서 동일한 키를 가진 메시지가 2개가 된다.

### PC에서 재현되지 않는 이유

localhost 환경에서는 네트워크 지연이 거의 없어 ack 콜백이 `message:new`보다 먼저 도착한다. 이 경우:

1. `confirmMessage`가 먼저 실행 → temp ID가 real ID로 교체됨
2. `message:new` 도착 → `addMessage`에서 이미 real ID가 존재하므로 중복 체크에 걸림

모바일(사설 IP 경유)에서는 추가 네트워크 홉으로 인해 이벤트 도착 순서가 역전되어 버그가 발생했다.

## 수정 내용

**파일**: `src/stores/chat.ts` — `confirmMessage` 액션

```typescript
// Before
confirmMessage: (tempId, ack) =>
  set((state) => {
    const updated = { ...state.messages };
    for (const chatId of Object.keys(updated)) {
      updated[chatId] = updated[chatId].map((m) =>
        m._tempId === tempId
          ? { ...m, id: ack.id, createdAt: ack.createdAt, _pending: false, _tempId: undefined }
          : m
      );
    }
    return { messages: updated };
  }),

// After
confirmMessage: (tempId, ack) =>
  set((state) => {
    const updated = { ...state.messages };
    for (const chatId of Object.keys(updated)) {
      updated[chatId] = updated[chatId]
        // message:new가 ack보다 먼저 도착한 경우 중복 제거
        .filter((m) => !(m.id === ack.id && m._tempId !== tempId))
        .map((m) =>
          m._tempId === tempId
            ? { ...m, id: ack.id, createdAt: ack.createdAt, _pending: false, _tempId: undefined }
            : m
        );
    }
    return { messages: updated };
  }),
```

`confirmMessage` 실행 시 `.filter()`로 `message:new`를 통해 이미 추가된 중복 메시지(같은 real ID, 다른 _tempId)를 먼저 제거한 뒤 temp 메시지를 확정 처리한다. 이벤트 도착 순서에 관계없이 메시지가 항상 1개만 유지된다.
