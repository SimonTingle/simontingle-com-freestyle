"use client";

import { useEffect, useState } from "react";

const flipClockStyles = `
  @keyframes flip {
    0% {
      transform: rotateX(0deg);
    }
    100% {
      transform: rotateX(360deg);
    }
  }

  .flip-clock {
    font-family: 'Courier New', monospace;
    font-weight: bold;
  }

  .flip-digit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1rem;
    background: linear-gradient(to bottom, #1f2937 0%, #111827 100%);
    border: 1px solid #374151;
    border-radius: 0.25rem;
    color: #ffffff;
    font-size: 0.75rem;
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
    position: relative;
  }

  .flip-separator {
    display: inline-flex;
    align-items: center;
    margin: 0 0.125rem;
    color: #ffffff;
    font-size: 0.75rem;
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
  }

  .flip-label {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    margin-left: 0.5rem;
  }

  .flip-day {
    color: #ffffff;
    font-size: 0.5rem;
    font-weight: bold;
    letter-spacing: 0.1em;
  }

  .flip-date {
    color: #ffffff;
    font-size: 0.5rem;
    margin-top: 0.125rem;
  }
`;

export function FlipClock({ scale = 1.5, transformOrigin = 'top-left' }: { scale?: number; transformOrigin?: string }) {
  const [time, setTime] = useState({ hours: "00", minutes: "00", day: "MON", date: "01 JAN" });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");

      const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const day = days[now.getDay()];

      const monthShort = now.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
      const dateNum = String(now.getDate()).padStart(2, "0");

      setTime({
        hours,
        minutes,
        day,
        date: `${dateNum} ${monthShort}`,
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{flipClockStyles}</style>
      <div className="flip-clock flex items-center gap-2 text-white" style={{ transform: `scale(${scale})`, transformOrigin, opacity: 0.5 }}>
        <div className="flex items-center gap-0.5">
          <div className="flip-digit">{time.hours[0]}</div>
          <div className="flip-digit">{time.hours[1]}</div>
          <span className="flip-separator">:</span>
          <div className="flip-digit">{time.minutes[0]}</div>
          <div className="flip-digit">{time.minutes[1]}</div>
        </div>
        <div className="flip-label">
          <div className="flip-day">{time.day}</div>
          <div className="flip-date">{time.date}</div>
        </div>
      </div>
    </>
  );
}
