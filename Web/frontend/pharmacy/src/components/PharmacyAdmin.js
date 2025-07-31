import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { Navbar, Nav, Container, Row, Col } from 'react-bootstrap';
import Medicines from './Medicines';
import Statistics from './Statistics';
import Settings from './Settings';

function PharmacyAdmin() {
    return (
        <Router>
            {/* Top Navbar */}
            <Navbar bg="dark" variant="dark" expand="lg" className="mb-3">
                <Container>
                    <Navbar.Brand href="/">Admin Dashboard</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <Nav.Link as={Link} to="/medicines">Medicines</Nav.Link>
                            <Nav.Link as={Link} to="/statistics">Statistics</Nav.Link>
                            <Nav.Link as={Link} to="/settings">Settings</Nav.Link>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <Container fluid>
                <Row>
                    {/* Sidebar */}
                    <Col xs={2} id="sidebar-wrapper" className="bg-light sidebar">
                        <Nav className="flex-column">
                            <Nav.Link as={Link} to="/medicines">Manage Medicines</Nav.Link>
                            <Nav.Link as={Link} to="/statistics">View Statistics</Nav.Link>
                            <Nav.Link as={Link} to="/settings">Admin Settings</Nav.Link>
                        </Nav>
                    </Col>

                    {/* Page Content */}
                    <Col xs={10} id="page-content-wrapper">
                        <Routes>
                            <Route path="/medicines" element={<Medicines />} />
                            <Route path="/statistics" element={<Statistics />} />
                            <Route path="/settings" element={<Settings />} />
                        </Routes>
                    </Col>
                </Row>
            </Container>
        </Router>
    );
}

export default PharmacyAdmin;
