import { useState } from "react";
import useCommunicationSession from "@/hooks/useCommunicationSession";
import SplashIntro from "@/components/brand/SplashIntro";
import WelcomeDialog from "@/components/brand/WelcomeDialog";
import StudioHeader from "@/components/studio/StudioHeader";
import SettingsPanel from "@/components/studio/SettingsPanel";
import CameraPreview from "@/components/communicate/CameraPreview";
import Readout from "@/components/studio/Readout";
import StudioControls from "@/components/studio/StudioControls";

export default function Studio() {
  const session = useCommunicationSession();
  const [panelOpen, setPanelOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const canClear =
    session.glosses.length > 0 || Boolean(session.manualText.trim()) || Boolean(session.result);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <SplashIntro onComplete={() => setWelcomeOpen(true)} />

      <a
        href="#translator"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to translator
      </a>

      <StudioHeader onOpenPanel={() => setPanelOpen(true)} />

      <main
        id="translator"
        className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-1 px-4 pb-4 pt-4 sm:px-8 sm:pb-6"
      >
        <h1 className="sr-only">SignWave translator</h1>

        <CameraPreview
          demoRunning={session.demoRunning}
          onToggleDemo={session.toggleDemo}
          onCameraStart={session.unlockLiveAudio}
          onPhrase={session.recognizePhrase}
        />

        <Readout
          result={session.result}
          glosses={session.glosses}
          manualText={session.manualText}
          status={session.status}
          error={session.error}
        />

        <StudioControls
          language={session.language}
          onLanguageChange={session.setLanguage}
          voice={session.voice}
          onVoiceChange={session.setVoice}
          onSpeak={session.speak}
          onReplay={session.replay}
          canSpeak={session.canSpeak}
          status={session.status}
        />
      </main>

      <WelcomeDialog open={welcomeOpen} onOpenChange={setWelcomeOpen} />

      <SettingsPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        demoRunning={session.demoRunning}
        onToggleDemo={session.toggleDemo}
        onClear={session.clearAll}
        canClear={canClear}
        manualText={session.manualText}
        onManualChange={session.setManualText}
        onManualSubmit={session.submitManual}
        busy={session.status === "processing"}
      />
    </div>
  );
}
