import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import { FinanceProvider } from './context/FinanceContext';

import Transactions from './pages/Transactions';
import Goals from './pages/Goals';

function App() {
  return (
    <FinanceProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="goals" element={<Goals />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FinanceProvider>
  );
}

export default App;
