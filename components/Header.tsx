"use client";

import ExecutiveHeader from "./navigation/ExecutiveHeader";
import { useTacticalAudio } from "@/hooks/useTacticalAudio";

export type ConsoleView = "OVERVIEW" | "WAR_ROOM" | "NEXUS_GRAPH" | "MEDICAID_RADAR" | "CASE_TIMELINE" | "LEGAL_WEAPONIZER" | "PROFIT_LEDGER";

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
