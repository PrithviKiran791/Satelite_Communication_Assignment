import { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import { LandingPage } from "./components/landing/LandingPage";
import { AnalyticsDashboard } from "./components/analytics/AnalyticsDashboard";
import { SettingsView } from "./components/settings/SettingsView";
import { SimulationForm } from "./components/simulation/SimulationForm";
import { SimulationLoadingScreen } from "./components/simulation/SimulationLoadingScreen";
import { ShootingStars } from "./components/ui/shooting-stars";
import { StarsBackground } from "./components/ui/stars-background";
import { DEFAULT_PARAMETERS } from "./simulation/constants";
import type { LinkBudgetInputs } from "./simulation/types";

function App() {
  const [activeTab, setActiveTab] = useState("Landing");
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [pendingInputs, setPendingInputs] = useState<LinkBudgetInputs | null>(null);
  const [parameters, setParameters] = useState<LinkBudgetInputs>(DEFAULT_PARAMETERS);

  const handleSelectTab = (tab: string) => {
    if (tab === "Simulation") {
      setIsConfigOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleStartSimulation = () => {
    setIsConfigOpen(true);
  };

  const handleViewAnalytics = () => {
    setActiveTab("Analytics");
  };

  const handleRunSimulation = (newInputs: LinkBudgetInputs) => {
    setIsConfigOpen(false);
    setPendingInputs(newInputs);
    setIsSimulating(true);
  };

  const handleSimulationComplete = (completedInputs: LinkBudgetInputs) => {
    setParameters(completedInputs);
    setIsSimulating(false);
    setPendingInputs(null);
    setActiveTab("Analytics");
  };

  const handleSimulationCancel = () => {
    setIsSimulating(false);
    setPendingInputs(null);
    setIsConfigOpen(true);
  };

  const handleResetToDefault = () => {
    setParameters(DEFAULT_PARAMETERS);
  };

  // Dedicated Full-Screen Simulation Loading Experience
  if (isSimulating && pendingInputs) {
    return (
      <SimulationLoadingScreen
        inputs={pendingInputs}
        onComplete={handleSimulationComplete}
        onCancel={handleSimulationCancel}
      />
    );
  }

  // Full-screen cinematic Landing Page (no header, no sidebar)
  if (activeTab === "Landing") {
    return (
      <div className="fixed inset-0 h-screen h-[100dvh] w-screen bg-[#030303] text-white overflow-hidden selection:bg-white selection:text-black">
        <LandingPage
          onStartSimulation={handleStartSimulation}
          onViewAnalytics={handleViewAnalytics}
        />

        {/* Global Simulation Configuration Modal */}
        {isConfigOpen && (
          <SimulationForm
            currentInputs={parameters}
            onRunSimulation={handleRunSimulation}
            onResetToDefault={handleResetToDefault}
            onClose={() => setIsConfigOpen(false)}
            isModal={true}
          />
        )}
      </div>
    );
  }

  // Mission Control Application Shell (Analytics & Settings)
  return (
    <div className="fixed inset-0 h-screen h-[100dvh] w-screen bg-[#030303] text-white flex overflow-hidden selection:bg-white selection:text-black">
      {/* Space Atmosphere: Grid + Radial Lighting + Stars */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#030303]">
        {/* Subtle aerospace grid pattern */}
        <div className="absolute inset-0 space-grid-pattern opacity-30" />

        {/* Subtle monochrome ambient radial lighting */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,255,255,0.06),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_90%,rgba(255,255,255,0.025),transparent_40%)]" />

        {/* Minimal white starfield */}
        <StarsBackground
          starDensity={0.00012}
          allStarsTwinkle={true}
          twinkleProbability={0.65}
          minTwinkleSpeed={0.4}
          maxTwinkleSpeed={1.0}
          className="opacity-40"
        />

        {/* Monochrome Pure White Shooting Stars */}
        <ShootingStars
          minSpeed={12}
          maxSpeed={26}
          minDelay={2500}
          maxDelay={6000}
          starColor="#ffffff"
          trailColor="#555555"
          starWidth={14}
          starHeight={1.5}
        />

        <ShootingStars
          minSpeed={16}
          maxSpeed={32}
          minDelay={4500}
          maxDelay={9000}
          starColor="#e5e5e5"
          trailColor="#333333"
          starWidth={18}
          starHeight={1.5}
        />
      </div>

      <div className="relative z-10 flex w-full h-full overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          parameters={parameters}
          onParametersChange={setParameters}
        />

        <div className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden flex flex-col custom-scrollbar">
          <Header activeTab={activeTab} onNavigateLanding={() => setActiveTab("Landing")} />

          <div className="flex-1">
            {activeTab === "Analytics" && (
              <AnalyticsDashboard
                parameters={parameters}
                onOpenConfig={() => setIsConfigOpen(true)}
              />
            )}

            {activeTab === "Settings" && (
              <SettingsView
                parameters={parameters}
                onParametersChange={setParameters}
                onOpenConfig={() => setIsConfigOpen(true)}
              />
            )}
          </div>

          {/* Global Simulation Configuration Modal */}
          {isConfigOpen && (
            <SimulationForm
              currentInputs={parameters}
              onRunSimulation={handleRunSimulation}
              onResetToDefault={handleResetToDefault}
              onClose={() => setIsConfigOpen(false)}
              isModal={true}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
