import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Home } from './pages/Home';
import {
  Ideas, Experiments, ExperimentDetail, MiningFlow, FactorLibrary, InspectorPage, Validation, Backtest,
  DataCenter, EnginePage, Reports, SettingsPage, Help, TasksPage,
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
            <Route path="experiments/:id" element={<ExperimentDetail />} />
            <Route path="runs" element={<RunsPage />} />
            <Route path="runs/:id" element={<RunDetail />} />

            {/* Research */}
            <Route path="idea" element={<Ideas />} />
            <Route path="mining" element={<MiningFlow />} />
            <Route path="launchpad" element={<MiningFlow />} />
            <Route path="evolution" element={<InspectorPage />} />

            {/* Factors */}
            <Route path="library" element={<FactorLibrary />} />
            <Route path="compare" element={<FactorLibrary />} />
            <Route path="correlation" element={<Validation kind="Correlation" />} />
            <Route path="lineage" element={<InspectorPage />} />
            <Route path="inspector" element={<InspectorPage />} />

            {/* Validation */}
            <Route path="validation" element={<Validation />} />
            <Route path="validation/ic" element={<Validation kind="IC Analysis" />} />
            <Route path="stability" element={<Validation kind="Stability" />} />
            <Route path="regime" element={<Validation kind="Regime" />} />
            <Route path="walk-forward" element={<Validation kind="Walk Forward" />} />
            <Route path="overfit" element={<Validation kind="Overfit" />} />

            {/* Portfolio */}
            <Route path="combination" element={<Backtest />} />
            <Route path="neutralization" element={<Backtest />} />
            <Route path="backtest" element={<Backtest />} />

            {/* Data */}
            <Route path="data" element={<DataCenter kind="Datasets" />} />
            <Route path="universes" element={<DataCenter kind="Universes" />} />
            <Route path="features" element={<DataCenter kind="Features" />} />
            <Route path="targets" element={<DataCenter kind="Targets" />} />

            {/* Engine */}
            <Route path="miners" element={<EnginePage kind="Miners" />} />
            <Route path="operators" element={<EnginePage kind="Operators" />} />
            <Route path="fitness" element={<EnginePage kind="Fitness" />} />
            <Route path="tasks" element={<TasksPage />} />

            {/* Misc */}
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="help" element={<Help />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  );
}

export default App;
