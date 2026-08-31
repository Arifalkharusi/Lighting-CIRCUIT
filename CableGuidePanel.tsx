import React from 'react';
import { CABLE_SIZES, CIRCUIT_REFERENCE } from '../data/cableGuide';

export const CableGuidePanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800 sticky top-0 bg-slate-950">
          <h2 className="text-sm font-bold text-slate-100">UK Domestic Cable &amp; Circuit Reference</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-lg leading-none">✕</button>
        </div>

        <div className="p-4 space-y-6">
          <section>
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Cable sizes (twin &amp; earth)</h3>
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr className="text-slate-500 text-left border-b border-slate-800">
                  <th className="py-1.5 pr-2">CSA</th>
                  <th className="py-1.5 pr-2">Typical use</th>
                  <th className="py-1.5">Approx. rating</th>
                </tr>
              </thead>
              <tbody>
                {CABLE_SIZES.map(cs => (
                  <tr key={cs.csa} className="border-b border-slate-900 text-slate-300">
                    <td className="py-1.5 pr-2 text-amber-400 font-bold whitespace-nowrap">{cs.label}</td>
                    <td className="py-1.5 pr-2">{cs.typicalUse}</td>
                    <td className="py-1.5 whitespace-nowrap">{cs.approxRatingA}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Circuit design reference</h3>
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr className="text-slate-500 text-left border-b border-slate-800">
                  <th className="py-1.5 pr-2">Circuit</th>
                  <th className="py-1.5 pr-2">Cable</th>
                  <th className="py-1.5 pr-2">Protection</th>
                  <th className="py-1.5">Notes</th>
                </tr>
              </thead>
              <tbody>
                {CIRCUIT_REFERENCE.map(row => (
                  <tr key={row.circuit} className="border-b border-slate-900 text-slate-300 align-top">
                    <td className="py-1.5 pr-2 text-slate-100 font-semibold whitespace-nowrap">{row.circuit}</td>
                    <td className="py-1.5 pr-2 text-amber-400 whitespace-nowrap">{row.cable}</td>
                    <td className="py-1.5 pr-2 whitespace-nowrap">{row.protection}</td>
                    <td className="py-1.5 text-slate-500">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <p className="text-[10px] text-slate-600 font-mono leading-relaxed">
            Indicative figures only, for a clipped-direct (Method C) twin &amp; earth cable. Real designs must
            be verified against BS 7671 current tables, correction factors for grouping/insulation/ambient
            temperature, volt-drop, and diversity — this app is a wiring-logic trainer, not a design tool.
          </p>
        </div>
      </div>
    </div>
  );
};
