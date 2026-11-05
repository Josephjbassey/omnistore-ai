"use client";

import React from "react";
import { ModeToggleHeader, ActiveTab } from "./ModeToggleHeader";

interface NavbarProps {
  backendConnected: boolean;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  inventoryCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  backendConnected,
  activeTab,
  setActiveTab,
  inventoryCount,
}) => {
  return (
    <ModeToggleHeader
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      backendConnected={backendConnected}
      inventoryCount={inventoryCount}
    />
  );
};

export default Navbar;
