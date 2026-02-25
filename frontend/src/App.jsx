import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth'; // Import AuthProvider
import CustomerLayout from './components/layout/customerLayout/Layout';
import HomePage from './pages/public/HomePage';

function App() {
  return (
    <AuthProvider> {/* Wrap everything with AuthProvider */}
      <BrowserRouter>
        <Routes>
          <Route element={<CustomerLayout />}>
            <Route path="/" element={<HomePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;