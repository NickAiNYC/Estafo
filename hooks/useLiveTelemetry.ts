"use client";

import { useState, useEffect } from "react";

export interface TelemetryAlert {
  id: string;
  timestamp: string;
  track: string;
  title: string;
  amount: string;
  location: string;
  type: "CRITICAL" | "SUCCESS" | "INFO";
}

export function useLiveTelemetry() {
  const [latency, setLatency] = useState(18);
  const [activeFeeds, setActiveFeeds] = useState(6);
  const [lastPingTime, setLastPingTime] = useState<string>("JUST NOW");
  const [recentAlerts, setRecentAlerts] = useState<TelemetryAlert[]>([
    {
      id: "ALERT-881",
      timestamp: "10:24:12",
      track: "TRACK 5",
      title: "Commercial Hauler Unloading #NY-88291",
      amount: "+$9,000",
      location: "Maspeth Creek Choke",
      type: "CRITICAL",
    },
    {
      id: "ALERT-880",
      timestamp: "10:19:40",
      track: "TRACK 1",
      title: "Clean Air Act CAC Video Verified",
      amount: "+$1,000",
      location: "Herald Square Corridor",
      type: "SUCCESS",
    },
    {
      id: "ALERT-879",
      timestamp: "10:14:05",
      track: "TRACK 6",
      title: "SADC Kickback Pattern Match (NPI: 1942008812)",
      amount: "+$3.55M Est.",
      location: "Flushing 38th Ave",
      type: "CRITICAL",
    },
  ]);

  // Periodic latency & incoming event simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // Natural jitter in serverless edge latency: 14ms - 22ms
      setLatency(Math.floor(14 + Math.random() * 8));
      
      const now = new Date();
      setLastPingTime(now.toLocaleTimeString("en-US", { hour12: false }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return {
    latency,
    activeFeeds,
    lastPingTime,
    recentAlerts,
    sparklineData: {
      dumping: [12, 14, 15, 18, 19, 22, 25, 27, 31, 34, 38, 42],
      idling: [24, 26, 28, 25, 30, 32, 35, 39, 41, 46, 48, 52],
      medicaid: [5, 6, 8, 8, 9, 11, 14, 16, 19, 21, 23, 25],
      revenue: [4.2, 5.1, 5.8, 6.4, 7.2, 8.1, 8.9, 9.6],
    },
  };
}
