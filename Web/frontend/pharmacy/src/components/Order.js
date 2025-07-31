import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Order.css';  // Custom styles for the order form
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { CartContext } from './CartProvider';
import { BiCartAdd } from 'react-icons/bi';  // React icon for adding to cart
import Swal from 'sweetalert2';  // SweetAlert2

function Order() {
  const { name } = useParams();  // Extract medicine name from URL
  const [medicine, setMedicine] = useState(null);  // Holds medicine details
  const [quantity, setQuantity] = useState(1);  // Default quantity is 1
  const [customerName, setCustomerName] = useState('');  // Customer's name
  const [customerEmail, setCustomerEmail] = useState('');  // Customer's email
  const [customerPhone, setCustomerPhone] = useState('');  // Customer's phone number
  const [customerAddress, setCustomerAddress] = useState('');  // Customer's address
  const [loading, setLoading] = useState(true);  // Loading state
  const [error, setError] = useState(null);  // Error state
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);  // Access the addToCart function from CartContext

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/medicine/${name}/`);
        setMedicine(response.data);
      } catch (error) {
        setError('Failed to load medicine details.');
      } finally {
        setLoading(false);
      }
    };
    fetchMedicine();
  }, [name]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!medicine) return;

    const validQuantity = Number(quantity);
    if (validQuantity <= 0) {
      setError('Quantity must be greater than 0.');
      Swal.fire('Error', 'Quantity must be greater than 0.', 'error');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(customerEmail)) {
      setError('Please enter a valid email address.');
      Swal.fire('Error', 'Please enter a valid email address.', 'error');
      return;
    }

    const orderData = {
      customer_name: customerName,
      email: customerEmail,
      phone_number: customerPhone,
      address: customerAddress,
      description: `Order of ${medicine.name}`,
      medicine: [medicine.name],
      quantity: validQuantity,
    };

    try {
      await axios.post(`http://127.0.0.1:8000/api/order/`, orderData);
      Swal.fire('Success', 'Order placed successfully!', 'success');
      resetForm();
    } catch (error) {
      setError('Failed to place the order. Please try again.');
      Swal.fire('Error', 'Failed to place the order. Please try again.', 'error');
    }
  };

  const resetForm = () => {
    setQuantity(1);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setCustomerAddress('');
  };

  const handleAddToCart = () => {
    if (medicine && Number(quantity) > 0) {
      addToCart(medicine, Number(quantity));
      navigate('/cart');
      Swal.fire('Added to Cart', 'Medicine added to cart!', 'success');
    } else {
      setError('Quantity must be greater than 0.');
      Swal.fire('Error', 'Quantity must be greater than 0.', 'error');
    }
  };

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status" />
        <p className="mt-3">Loading medicine details...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={() => navigate(-1)}>
          ← Back
        </Button>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow-lg">
            {medicine?.image && (
              <Card.Img variant="top" src={medicine.image} alt={medicine.name} />
            )}
            <Card.Body>
              <Card.Title as="h2" className="mb-3">Order Medicine: {medicine?.name}</Card.Title>
              <Card.Text className="text-muted mb-4">{medicine?.description}</Card.Text>

              <Form onSubmit={handleSubmit}>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="customerName">
                      <Form.Label>Your Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter your name"
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group controlId="customerEmail">
                      <Form.Label>Your Email</Form.Label>
                      <Form.Control
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="customerPhone">
                      <Form.Label>Phone Number</Form.Label>
                      <Form.Control
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Enter your phone number"
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group controlId="customerAddress">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        type="text"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="Enter your address"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-4">
                  <Col>
                    <Form.Group controlId="quantity">
                      <Form.Label>Quantity</Form.Label>
                      <InputGroup>
                        <Button
                          variant="outline-secondary"
                          onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                        >
                          −
                        </Button>
                        <Form.Control
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          min="1"
                          required
                          className="text-center"
                        />
                        <Button
                          variant="outline-secondary"
                          onClick={() => setQuantity((prev) => Number(prev) + 1)}
                        >
                          +
                        </Button>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <Button variant="success" type="submit" className="me-2">
                  Place Order
                </Button>

                <Button variant="outline-secondary" onClick={handleAddToCart}>
                  <BiCartAdd className="me-1" /> Add to Cart
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Order;
