import React from 'react';
import { DefaultEngine, Theme, useSettingsStore } from '../stores/useSettingsStore';

const themes: Array<{ label: string; value: Theme }> = [
  { label: 'Dark', value: 'dark' },
  { label: 'Light', value: 'light' },
  { label: 'System', value: 'system' },
];

const engines: Array<{ label: string; value: DefaultEngine }> = [
  { label: 'Suno', value: 'suno' },
  { label: 'MusicGen', value: 'musicgen' },
];

export const SettingsPage: React.FC = () => {
  const {
    theme,
    defaultEngine,
    defaultDuration,
    autoPlay,
    showVisualization,
    setTheme,
    setDefaultEngine,
    setDefaultDuration,
    setAutoPlay,
    setShowVisualization,
  } = useSettingsStore();

  return (
    <div className="max-w-3xl p-6">
      <h2 className="mb-6 text-2xl font-bold">Settings</h2>

      <div className="space-y-8">
        <section>
          <h3 className="mb-3 text-lg font-semibold">Appearance</h3>
          <div className="flex flex-wrap gap-2">
            {themes.map((item) => (
              <button
                key={item.value}
                onClick={() => setTheme(item.value)}
                className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                  theme === item.value
                    ? 'bg-green-500 text-gray-950'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-lg font-semibold">Generation Defaults</h3>
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm text-gray-400">Default engine</span>
              <select
                value={defaultEngine}
                onChange={(event) => setDefaultEngine(event.target.value as DefaultEngine)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none focus:border-green-500"
              >
                {engines.map((engine) => (
                  <option key={engine.value} value={engine.value}>
                    {engine.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-gray-400">Default duration</span>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="15"
                  max="300"
                  step="15"
                  value={defaultDuration}
                  onChange={(event) => setDefaultDuration(Number(event.target.value))}
                  className="flex-1 accent-green-500"
                />
                <span className="w-20 rounded-lg bg-gray-800 px-3 py-2 text-center text-sm">
                  {defaultDuration}s
                </span>
              </div>
            </label>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-lg font-semibold">Playback</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between gap-4 rounded-lg bg-gray-800 px-4 py-3">
              <span>
                <span className="block text-sm font-medium">Auto play</span>
                <span className="text-xs text-gray-400">Start playback when a generated track is ready.</span>
              </span>
              <input
                type="checkbox"
                checked={autoPlay}
                onChange={(event) => setAutoPlay(event.target.checked)}
                className="h-5 w-5 accent-green-500"
              />
            </label>

            <label className="flex items-center justify-between gap-4 rounded-lg bg-gray-800 px-4 py-3">
              <span>
                <span className="block text-sm font-medium">Show visualization</span>
                <span className="text-xs text-gray-400">Display animated audio visuals during playback.</span>
              </span>
              <input
                type="checkbox"
                checked={showVisualization}
                onChange={(event) => setShowVisualization(event.target.checked)}
                className="h-5 w-5 accent-green-500"
              />
            </label>
          </div>
        </section>
      </div>
    </div>
  );
};
