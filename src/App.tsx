import { useState } from 'react';
import { Toolbox } from './components/Toolbox';
import { Header } from './components/Header';
import { SimulatorCanvas } from './components/Canvas';
import { CableGuidePanel } from './components/CableGuidePanel';

export default function App() {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="w-screen h-screen flex flex-col bg-[#08080a] text-slate-200 select-none overflow-hidden">
      <Header onOpenGuide={() => setShowGuide(true)} />
      <div className="flex-1 flex overflow-hidden">
        <Toolbox />
        <main className="flex-1 relative overflow-hidden">
          <SimulatorCanvas />
        </main>
      </div>
      {showGuide && <CableGuidePanel onClose={() => setShowGuide(false)} />}
    </div>
  );
}
