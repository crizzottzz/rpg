import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './stores/auth-store';
import AppShell from './components/app-shell';
import ProtectedRoute from './components/protected-route';
import LoginPage from './pages/login-page';
import DashboardPage from './pages/dashboard-page';
import RulesetsPage from './pages/rulesets-page';
import RulesetDetailPage from './pages/ruleset-detail-page';
import EntityDetailPage from './pages/entity-detail-page';
import CampaignsPage from './pages/campaigns-page';
import NewCampaignPage from './pages/new-campaign-page';
import CampaignDetailPage from './pages/campaign-detail-page';
import CharactersPage from './pages/characters-page';
import NewCharacterPage from './pages/new-character-page';
import CharacterDetailPage from './pages/character-detail-page';

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/rulesets" element={<RulesetsPage />} />
          <Route path="/rulesets/:id" element={<RulesetDetailPage />} />
          <Route path="/rulesets/:id/entities/:entityId" element={<EntityDetailPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/campaigns/new" element={<NewCampaignPage />} />
          <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
          <Route path="/campaigns/:campaignId/characters/new" element={<NewCharacterPage />} />
          <Route path="/characters" element={<CharactersPage />} />
          <Route path="/characters/:characterId" element={<CharacterDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
