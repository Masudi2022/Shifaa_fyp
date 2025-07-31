import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home/Home';
import Login from './components/Login';
import Goals from './components/Goals';
import Pharmacies from './components/Pharmacies';
import Counseling from './components/Counseling';
import Explore from './components/Explore';
import PharmacyAndHospitals from './components/PharmacyAndHospitals';
import Medicine from './components/Medicine';
import { CartProvider } from './components/CartProvider';
import Order from './components/Order';
import HomeAdmin from './admin/Home'; // Import the OrderPage component

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                {/* <Route path="/*" element={<AdminPage />} /> */}
                <Route path="/shifaa" element={<Goals />} />
                <Route path="/login" element={<Login />} />
                <Route path="/pharmacies" element={<Pharmacies />} />
                <Route path="/counseling" element={<Counseling />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/pharmacy-and-hospital" element={<PharmacyAndHospitals />} />
                <Route path="/services/medicines" element={<Medicine />} />
                <Route path="/medicine/:name" element={<Order />} />
                <Route path="/admin" element={<HomeAdmin />} />
                <Route path="/cart" element={<CartProvider />} />
                 {/* Added route for OrderPage */}
            </Routes>
        </Router>
    );
}

export default App;
