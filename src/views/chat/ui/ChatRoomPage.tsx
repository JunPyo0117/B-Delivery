"use client"

import { useEffect } from "react"
import { useCentrifugoChat } from "@/features/chat/model/useCentrifugoChat"
import { useChatStore } from "@/features/chat/model/chatStore"
import { Loader2, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { ChatBubble, ChatInput } from "@/features/chat"
import type { ChatMessageResponse } from "@/types/chat"

interface ChatRoomPageProps {
  chatId: string
  currentUserId: string
  restaurantName: string
  orderId?: string
  initialMessages: ChatMessageResponse[]
  hasMore: boolean
}

/**
 * 채팅방 페이지 (FSD pages 레이어)
 * - 헤더: 연결된 주문 정보 (또는 "일반 문의")
 * - 메시지 목록 (날짜 구분선, ChatBubble 렌더링)
 * - ChatInput (텍스트/이미지 전송)
 * - 실시간 연결 (Socket.IO)
 *
 * 기존 ChatRoom 컴포넌트 로직을 직접 위임
 */
export function ChatRoomPage({
  chatId,
  currentUserId,
  restaurantName,
  orderId,
  initialMessages,
  hasMore: initialHasMore,
}: ChatRoomPageProps) {
  const setMessages = useChatStore((s) => s.setMessages)
  const setHasMore = useChatStore((s) => s.setHasMore)
  const clearChat = useChatStore((s) => s.clearChat)

  // 초기 메시지 설정
  useEffect(() => {
    setMessages(chatId, initialMessages)
    setHasMore(chatId, initialHasMore)
    return () => clearChat(chatId)
  }, [chatId, initialMessages, initialHasMore, setMessages, setHasMore, clearChat])

  const addMessage = useChatStore((s) => s.addMessage)

  const { isConnected, isConnecting, error, sendMessage, sendTyping } =
    useCentrifugoChat({
      chatId,
      onMessage: (msg) => addMessage(chatId, msg),
    })

  return (
    <div className="flex flex-col h-dvh bg-[#F8F8F8]">
      <ChatRoomHeader restaurantName={restaurantName} orderId={orderId} />

      {/* 연결 상태 배너 */}
      {(isConnecting || error) && (
        <div className="px-4 py-2 text-xs text-center bg-amber-50 text-amber-700 border-b border-amber-100">
          {isConnecting && (
            <span className="flex items-center justify-center gap-1.5">
              <Loader2 className="size-3 animate-spin" />
              연결 중...
            </span>
          )}
          {error && <span>{error}</span>}
        </div>
      )}

      {/* 메시지 목록 - 기존 ChatRoom의 MessageList를 사용 */}
      <MessageListView
        chatId={chatId}
        currentUserId={currentUserId}
        initialMessages={initialMessages}
      />

      <ChatInput
        onSend={(type, content) => sendMessage(type, content)}
        onTypingStart={() => sendTyping(true)}
        onTypingStop={() => sendTyping(false)}
        disabled={!isConnected}
      />
    </div>
  )
}

/** 채팅방 헤더 */
function ChatRoomHeader({
  restaurantName,
  orderId,
}: {
  restaurantName: string
  orderId?: string
}) {
  const router = useRouter()
  const shortOrderId = orderId ? `#${orderId.slice(0, 4).toUpperCase()}` : ""

  return (
    <header className="sticky top-0 z-40 flex items-center h-14 px-4 bg-white border-b border-gray-100 shrink-0">
      <button
        onClick={() => router.push("/chat")}
        className="p-1.5 -ml-1.5 mr-3 rounded-full active:bg-gray-100 transition-colors"
        aria-label="뒤로가기"
      >
        <ArrowLeft className="size-5 text-gray-800" />
      </button>

      <div className="flex-1 min-w-0 text-center mr-8">
        <h1 className="text-[16px] font-bold text-gray-900 truncate">
          고객센터
        </h1>
        {orderId && (
          <p className="text-[11px] text-gray-400 truncate -mt-0.5">
            주문 {shortOrderId} · {restaurantName}
          </p>
        )}
      </div>
    </header>
  )
}

/** 메시지 목록 뷰 - 기존 MessageList 컴포넌트 재구현 */
function MessageListView({
  chatId,
  currentUserId,
  initialMessages,
}: {
  chatId: string
  currentUserId: string
  initialMessages: ChatMessageResponse[]
}) {
  const messages = useChatStore((s) => s.messages[chatId] ?? initialMessages)

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      {/* 날짜 구분 + 메시지 버블 */}
      {messages.map((msg, index) => {
        const isOwn = msg.senderId === currentUserId
        const prevMsg = index > 0 ? messages[index - 1] : null
        const isContinuous = prevMsg?.senderId === msg.senderId

        // 날짜 구분선
        const currentDate = new Date(msg.createdAt).toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
        })
        const prevDate = prevMsg
          ? new Date(prevMsg.createdAt).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })
          : null

        const showDateSeparator = currentDate !== prevDate

        return (
          <div key={msg.id}>
            {showDateSeparator && (
              <div className="flex justify-center py-3">
                <span className="rounded-full bg-gray-200 px-3 py-1 text-[11px] text-gray-500">
                  {currentDate}
                </span>
              </div>
            )}
            <ChatBubble
              message={msg}
              isOwn={isOwn}
              isContinuous={isContinuous && !showDateSeparator}
            />
          </div>
        )
      })}
    </div>
  )
}
