import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RulesetsPage from './pages/RulesetsPage';
import RulesetDetailPage from './pages/RulesetDetailPage';
import EntityDetailPage from './pages/EntityDetailPage';
import CampaignsPage from './pages/CampaignsPage';
import NewCampaignPage from './pages/NewCampaignPage';
import CampaignDetailPage from './pages/CampaignDetailPage';
import CharactersPage from './pages/CharactersPage';
import NewCharacterPage from './pages/NewCharacterPage';
import CharacterDetailPage from './pages/CharacterDetailPage';

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
