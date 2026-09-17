import { Routes, Route } from 'react-router-dom';
import PatGate from './components/PatGate';
import Home from './pages/Home';
import Signup from './pages/Signup';
import Record from './pages/Record';
import Rankings from './pages/Rankings';
import Club from './pages/Club';
import Admin from './pages/Admin';

export default function App() {
  return (
    <PatGate>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/record" element={<Record />} />
        <Route path="/rankings" element={<Rankings />} />
        <Route path="/club" element={<Club />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </PatGate>
  );
}
