const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface DateSeparatorProps {
  date: string;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const d = new Date(date);
  const label = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS[d.getDay()]}요일`;

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}
