"use client";

import React from "react";
import { ModeToggleHeader, ViewMode, ActiveTab } from "./ModeToggleHeader";

interface NavbarProps {
  backendConnected: boolean;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  inventoryCount: number;
  viewMode?: ViewMode;
  setViewMode?: (mode: ViewMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  backendConnected,
  activeTab,
  setActiveTab,
  inventoryCount,
  viewMode = "merchant",
  setViewMode = () => {},
}) => {
  return (
    <ModeToggleHeader
      viewMode={viewMode}
      onToggleViewMode={setViewMode}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      backendConnected={backendConnected}
      inventoryCount={inventoryCount}
    />
  );
};

export default Navbar;
