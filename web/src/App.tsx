import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Home } from './pages/Home';
import { Ideas, Experiments, ExperimentDetail, MiningFlow, FactorLibrary, InspectorPage, Validation, Backtest, DataCenter, Reports, SettingsPage, Help, TasksPage } from './pages/PlatformPages';
import { useEffect } from 'react';
import { I18nProvider } from './i18n';

function App() {
  // Force dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="launchpad" element={<MiningFlow />} />
            <Route path="mining" element={<MiningFlow />} />
            <Route path="idea" element={<Ideas />} />
            <Route path="experiments" element={<Experiments />} />
            <Route path="experiments/:id" element={<ExperimentDetail />} />
            <Route path="evolution" element={<Validation kind="演化追踪" />} />
            <Route path="library" element={<FactorLibrary />} />
            <Route path="inspector" element={<InspectorPage />} />
            <Route path="compare" element={<FactorLibrary />} />
            <Route path="lineage" element={<Validation kind="因子血缘" />} />
            <Route path="validation" element={<Validation />} />
            <Route path="stability" element={<Validation kind="稳定性" />} />
            <Route path="backtest" element={<Backtest />} />
            <Route path="data" element={<DataCenter />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="help" element={<Help />} />
            <Route path="tasks" element={<TasksPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  );
}

export default App;
