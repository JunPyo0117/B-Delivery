const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface DateSeparatorProps {
  date: string;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const d = new Date(date);
  const label = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS[d.getDay()]}요일`;

  return (
    <div className="flex justify-center py-4">
      <span className="px-3 py-1 rounded-full bg-black/5 text-[11px] text-gray-500 font-medium">
        {label}
      </span>
    </div>
  );
}
