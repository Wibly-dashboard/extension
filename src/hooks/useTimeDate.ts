import { useState, useEffect } from "react";

const useTimeDate = () => {
  const [time, setTime] = useState<string>("");
  const [date, setDate] = useState<string>("");

  const daysOfWeek = ["월", "화", "수", "목", "금", "토", "일"];

  useEffect(() => {
    const updateTimeAndDate = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString());
      setDate(now.toLocaleDateString());
    };

    updateTimeAndDate();
    const interval = setInterval(updateTimeAndDate, 1000);

    return () => clearInterval(interval);
  }, []);

  return { time, date, daysOfWeek };
};

export default useTimeDate;
