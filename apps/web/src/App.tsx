import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LoginForm } from "./components/login";
import { SignupForm } from "./components/signup-form";
import ClimaPage from "./pages/clima";
import UsersPage from "./pages/users";
import ShipsPage from "./pages/ships";
import { DashboardLayout } from "./layouts/dashboard-layout";
import { ProtectedLayout } from "./layouts/protected-layout";
import { RequireAdmin } from "./layouts/require-admin";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/register" element={<SignupForm />} />
        <Route element={<ProtectedLayout />}>
          <Route element={<DashboardLayout />}>
            <Route path="/clima" element={<ClimaPage />} />
            <Route
              path="/users"
              element={
                <RequireAdmin>
                  <UsersPage />
                </RequireAdmin>
              }
            />
            <Route path="/ships" element={<ShipsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
