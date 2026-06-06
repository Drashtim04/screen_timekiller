import { useState, useEffect } from 'react';
import { TimerStatus } from '../types/pomodoro';

export function useTimer(endTime: number | null, status: TimerStatus, pausedAt: number | null, defaultDuration: number) {
  const [timeLeft, setTimeLeft] = useState(defaultDuration);

  useEffect(() => {
    if (status === 'idle') {
      setTimeLeft(defaultDuration);
      return;
    }

    if (status === 'paused' && pausedAt && endTime) {
      setTimeLeft(Math.max(0, Math.floor((endTime - pausedAt) / 1000)));
      return;
    }

    if (status === 'running' && endTime) {
      const update = () => {
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        setTimeLeft(remaining);
      };
      
      update(); // Initial tick
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    }
  }, [endTime, status, pausedAt, defaultDuration]);

  return timeLeft;
}
