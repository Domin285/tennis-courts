import { useEffect, useState } from "react";

export const useNow = (refreshInterval = 30_000): number => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, refreshInterval);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshInterval]);

  return now;
};
