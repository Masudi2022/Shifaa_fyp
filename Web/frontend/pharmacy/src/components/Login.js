import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Container, 
    Row, 
    Col, 
    Form, 
    Button, 
    Alert, 
    Spinner, 
    Card 
} from 'react-bootstrap';
import axios from 'axios'; // Ensure axios is installed: npm install axios
import { FaSignInAlt, FaArrowLeft } from 'react-icons/fa'; // Importing icons

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Function to get the token from localStorage
    const getAuthToken = () => {
        return localStorage.getItem('access_token'); // Assuming the token is stored in localStorage
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Replace with your actual backend URL or use environment variables
            const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
            const response = await axios.post(`${API_URL}/api/token/`, {
                username: username,
                password: password
            });

            // Assuming the response contains access and refresh tokens
            const { access, refresh } = response.data;

            // Store tokens securely (consider using HttpOnly cookies for production)
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);

            // Check user role
            const userResponse = await axios.get(`${API_URL}/api/users/me/`, {
                headers: {
                    Authorization: `Bearer ${access}`,
                },
            });

            const isAdmin = userResponse.data.is_staff; // Check if the user is an admin

            // Redirect based on the user role
            if (isAdmin) {
                navigate('/admin'); // Redirect to admin page if user is an admin
            } else {
                const redirectTo = sessionStorage.getItem('redirectPath') || '/'; // Redirect to intended path or home
                navigate(redirectTo);
            }
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data) {
                // Display specific error messages from the backend
                setError(Object.values(err.response.data).join(' '));
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <Row className="w-100">
                <Col md={{ span: 6, offset: 3 }}>
                    <Card className="shadow-lg border-0">
                        <Card.Body className="p-4">
                            <div className="text-center mb-4">
                                <FaSignInAlt size={50} color="#0d6efd" />
                                <h2 className="mt-3">Login</h2>
                            </div>
                            {error && <Alert variant="danger">{error}</Alert>}
                            <Form onSubmit={handleLogin}>
                                <Form.Group controlId="formBasicUsername" className="mb-3">
                                    <Form.Label>Username</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Enter username" 
                                        value={username} 
                                        onChange={(e) => setUsername(e.target.value)} 
                                        required 
                                    />
                                </Form.Group>

                                <Form.Group controlId="formBasicPassword" className="mb-4">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control 
                                        type="password" 
                                        placeholder="Password" 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        required 
                                    />
                                </Form.Group>

                                <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Spinner 
                                                as="span"
                                                animation="border"
                                                size="sm"
                                                role="status"
                                                aria-hidden="true"
                                                className="me-2"
                                            /> Loading...
                                        </>
                                    ) : (
                                        'Login'
                                    )}
                                </Button>
                            </Form>
                            <Button 
                                variant="link" 
                                className="mt-3 d-flex align-items-center justify-content-center" 
                                onClick={() => navigate(-1)}
                                style={{ textDecoration: 'none', color: '#0d6efd' }}
                            >
                                <FaArrowLeft className="me-2" /> Back
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default Login;
