import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Home } from './pages/Home';
import {
  Experiments, ExperimentBuilder, ExperimentDetail, FactorLibrary, InspectorPage, Validation, Backtest,
  DataCenter, EnginePage, Reports, SettingsPage, Help, TasksPage, NotFound,
} from './pages/PlatformPages';
import { Projects, ProjectDetail, RunsPage, RunDetail } from './pages/WorkspacePages';
import { I18nProvider } from './i18n';

function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />

            {/* Workspace */}
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="projects/:id/experiments" element={<Experiments />} />
            <Route path="projects/:id/runs" element={<RunsPage />} />
            <Route path="projects/:id/factors" element={<FactorLibrary />} />
            <Route path="projects/:id/validation" element={<Validation />} />
            <Route path="experiments" element={<Experiments />} />
            <Route path="experiments/new" element={<ExperimentBuilder />} />
            <Route path="experiments/:id" element={<ExperimentDetail />} />
            <Route path="runs" element={<RunsPage />} />
            <Route path="runs/:id" element={<RunDetail />} />

            {/* Factors */}
            <Route path="library" element={<FactorLibrary />} />
            <Route path="compare" element={<FactorLibrary kind="Compare" />} />
            <Route path="correlation" element={<Validation kind="Correlation" />} />
            <Route path="lineage" element={<InspectorPage tab="Lineage" />} />
            <Route path="factors/:id" element={<InspectorPage />} />

            {/* Validation */}
            <Route path="validation" element={<Validation />} />
            <Route path="validation/ic" element={<Validation kind="IC Analysis" />} />
            <Route path="stability" element={<Validation kind="Stability" />} />
            <Route path="regime" element={<Validation kind="Regime" />} />
            <Route path="walk-forward" element={<Validation kind="Walk Forward" />} />
            <Route path="overfit" element={<Validation kind="Overfit" />} />

            {/* Portfolio */}
            <Route path="portfolios" element={<Backtest kind="Portfolios" />} />
            <Route path="backtests" element={<Backtest />} />
            <Route path="risk" element={<Backtest kind="Risk" />} />

            {/* Data */}
            <Route path="data" element={<DataCenter kind="Datasets" />} />
            <Route path="universes" element={<DataCenter kind="Universes" />} />
            <Route path="features" element={<DataCenter kind="Features" />} />
            <Route path="targets" element={<DataCenter kind="Targets" />} />

            {/* Engine */}
            <Route path="miners" element={<EnginePage kind="Miners" />} />
            <Route path="operators" element={<EnginePage kind="Operators" />} />
            <Route path="fitness" element={<EnginePage kind="Fitness" />} />
            <Route path="models" element={<EnginePage kind="Models" />} />
            <Route path="compute" element={<TasksPage />} />
            <Route path="tasks" element={<TasksPage />} />

            {/* Misc */}
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="help" element={<Help />} />

            {/* Legacy redirects — capabilities moved to their correct home */}
            <Route path="idea" element={<Navigate to="/experiments/new" replace />} />
            <Route path="mining" element={<Navigate to="/experiments/new" replace />} />
            <Route path="launchpad" element={<Navigate to="/experiments/new" replace />} />
            <Route path="evolution" element={<Navigate to="/library" replace />} />
            <Route path="inspector" element={<Navigate to="/library" replace />} />
            <Route path="combination" element={<Navigate to="/backtests" replace />} />
            <Route path="neutralization" element={<Navigate to="/backtests" replace />} />
            <Route path="backtest" element={<Navigate to="/backtests" replace />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  );
}

export default App;
