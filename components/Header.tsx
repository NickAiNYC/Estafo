"use client";

import ExecutiveHeader from "./navigation/ExecutiveHeader";
import { useTacticalAudio } from "@/hooks/useTacticalAudio";

export type ConsoleView = "WAR_ROOM" | "NEXUS_GRAPH" | "MEDICAID_RADAR" | "PROFIT_LEDGER" | "LEGAL_WEAPONIZER";

interface HeaderProps {
  currentView: ConsoleView;
  onSelectView: (view: ConsoleView) => void;
  onOpenCommandPalette?: () => void;
}

export default function Header({
  currentView,
  onSelectView,
  onOpenCommandPalette = () => {},
}: HeaderProps) {
  const { audioEnabled, toggleAudio, playClick } = useTacticalAudio();

  const handleSelectView = (view: ConsoleView) => {
    playClick();
    onSelectView(view);
  };

  return (
    <ExecutiveHeader
      currentView={currentView}
      onSelectView={handleSelectView}
      audioEnabled={audioEnabled}
      onToggleAudio={toggleAudio}
      onOpenCommandPalette={onOpenCommandPalette}
    />
  );
}
