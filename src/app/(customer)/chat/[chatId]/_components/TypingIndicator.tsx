export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-2">
      <div className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-gray-100">
        <span className="size-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
        <span className="size-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
        <span className="size-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}
