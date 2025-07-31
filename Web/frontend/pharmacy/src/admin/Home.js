import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Navbar, Nav, Container, Row, Col, Button } from 'react-bootstrap';
import { FaBars, FaTimes } from 'react-icons/fa';  // Icons for toggle button
import Medicines from './Medicines';
import Statistics from './Statistics';
import Settings from './Settings';
import './PharmacyAdmin.css'; // Custom CSS for styling

function PharmacyAdmin() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // State to control sidebar

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <>
            {/* Top Navbar */}
            <Navbar bg="dark" variant="dark" expand="lg" className="sticky-top">  {/* Add sticky-top class */}
                <Container>
                    <Navbar.Brand href="/" className="text-light">Admin Dashboard</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="ms-auto">
                            <Nav.Link as={Link} to="/admin/medicines" className="text-light">Medicines</Nav.Link>
                            <Nav.Link as={Link} to="/admin/statistics" className="text-light">Statistics</Nav.Link>
                            <Nav.Link as={Link} to="/admin/settings" className="text-light">Settings</Nav.Link>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <Container fluid className="main-content">
                <Row>
                    {/* Sidebar */}
                    <Col
                        xs={isSidebarOpen ? 2 : 1}  // Toggle width between open and collapsed state
                        id="sidebar-wrapper"
                        className={`bg-dark sidebar ${isSidebarOpen ? '' : 'collapsed'}`}
                    >
                        <Button
                            variant="link"
                            className="sidebar-toggle"
                            onClick={toggleSidebar}
                        >
                            {isSidebarOpen ? <FaTimes className="text-light" /> : <FaBars className="text-light" />}
                        </Button>
                        {isSidebarOpen && (
                            <Nav className="flex-column p-3">
                                <Nav.Link as={Link} to="/admin/medicines" className="text-light">Manage Medicines</Nav.Link>
                                <Nav.Link as={Link} to="/admin/statistics" className="text-light">View Statistics</Nav.Link>
                                <Nav.Link as={Link} to="/admin/settings" className="text-light">Admin Settings</Nav.Link>
                            </Nav>
                        )}
                    </Col>

                    {/* Page Content */}
                    <Col xs={isSidebarOpen ? 10 : 11} id="page-content-wrapper">
                        <div className="content-wrapper p-4">
                            <Routes>
                                <Route path="medicines" element={<Medicines />} />
                                <Route path="statistics" element={<Statistics />} />
                                <Route path="settings" element={<Settings />} />
                            </Routes>
                        </div>
                    </Col>
                </Row>
            </Container>

            {/* Footer */}
            <footer className="bg-dark text-center text-light py-3 mt-auto">
                <Container>
                    <p className="mb-0">Admin Dashboard &copy; 2024</p>
                    <p>All rights reserved</p>
                </Container>
            </footer>
        </>
    );
}

export default PharmacyAdmin;
