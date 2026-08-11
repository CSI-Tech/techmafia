import { useEffect, useState } from 'react';

interface TimerProps {
  timerEndsAt: number | null;
  totalSeconds: number; // used for the ring progress
  size?: 'sm' | 'lg';
}

export function Timer({ timerEndsAt, totalSeconds, size = 'lg' }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!timerEndsAt) return;
    const update = () => {
      const diff = Math.max(0, Math.floor((timerEndsAt - Date.now()) / 1000));
      setTimeLeft(diff);
    };
    update();
    const id = setInterval(update, 500);
    return () => clearInterval(id);
  }, [timerEndsAt]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const radius = size === 'lg' ? 100 : 42;
  const stroke = size === 'lg' ? 10 : 5;
  const cx = radius + stroke;
  const cy = radius + stroke;
  const svgSize = (radius + stroke) * 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? timeLeft / totalSeconds : 0;
  const dashOffset = circumference * (1 - progress);
  const isUrgent = timeLeft <= 10;

  if (size === 'sm') {
    return (
      <div className={`text-2xl font-extrabold tabular-nums ${isUrgent ? 'text-primary' : 'text-gray-700'}`}>
        {timeStr}
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center">
      <svg width={svgSize} height={svgSize} className="-rotate-90">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
        <circle
          cx={cx} cy={cy} r={radius} fill="none"
          stroke={isUrgent ? '#991B1B' : '#991B1B'}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease', opacity: isUrgent ? 1 : 0.7 }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-5xl font-extrabold tabular-nums ${isUrgent ? 'text-primary' : 'text-gray-900'}`}>
          {timeStr}
        </span>
      </div>
    </div>
  );
}
