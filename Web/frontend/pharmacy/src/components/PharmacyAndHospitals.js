import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaArrowLeft, FaClinicMedical, FaPills, FaUserMd, FaSearch, FaClock, FaStar } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import './PharmacyAndHospitals.css';

function PharmacyAndHospitals() {
    const navigate = useNavigate();
    const location = useLocation();
    const { pharmacy } = location.state || {};

    if (!pharmacy) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Inapakia...</span>
                    </div>
                    <p>Hakuna duka la dawa lililochaguliwa. Inarudishwa nyuma...</p>
                </div>
            </div>
        );
    }

    const handleServiceClick = (path) => {
        navigate(path, { state: { pharmacy } });
    };

    // Data ya duka la dawa kwa Kiswahili
    const pharmacyData = {
        name: pharmacy?.name || "Duka la Dawa MedLife",
        description: pharmacy?.details || "Mshirika wako wa kuhudumia afya jijini Dar es Salaam",
        address: pharmacy?.address || "Barabara ya Afya 123",
        region: pharmacy?.region || "Dar es Salaam",
        phone: pharmacy?.phone || "+255 123 456 789",
        hours: "8:00 asubuhi - 8:00 jioni (Jumatatu - Jumamosi)",
        rating: "4.8",
        image: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?ixlib=rb-4.0.3",
        services: [
            {
                title: "Upelekaji wa Dawa",
                description: "Pata dawa zako mwako kwa urahisi",
                icon: <FaPills size={40} className="text-primary" />,
                image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?ixlib=rb-4.0.3"
            },
            {
                title: "Ushauri wa Daktari",
                description: "Panga miadi na madaktari wetu waliohitimu",
                icon: <FaUserMd size={40} className="text-primary" />,
                image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3"
            },
            {
                title: "Uchunguzi wa Afya",
                description: "Vifurushi vyote vya uchunguzi wa afya",
                icon: <FaClinicMedical size={40} className="text-primary" />,
                image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?ixlib=rb-4.0.3"
            }
        ],
        testimonials: [
            {
                text: "Huduma ya upelekaji wa dawa ilinisaidia sana nilipokuwa mgonjwa. Haraka na ya kuaminika!",
                author: "Sarah J.",
                rating: 5
            },
            {
                text: "Wafanyakazi waliohitimu na wako tayari kufafanua maelekezo ya matumizi ya dawa.",
                author: "Michael T.",
                rating: 4
            },
            {
                text: "Maeneo safi na mkusanyiko mpana wa bidhaa za afya. Napendekeza kwa uaminifu!",
                author: "Amina K.",
                rating: 5
            }
        ]
    };

    return (
        <div className="pharmacy-page">
            {/* Navbar */}
            <Navbar bg="white" expand="lg" sticky="top" className="shadow-sm">
                <Container>
                    <Navbar.Brand href="#" className="d-flex align-items-center">
                        <div className="pharmacy-logo me-2">
                            <FaClinicMedical className="text-primary" size={28} />
                        </div>
                        <span className="fw-bold">{pharmacyData.name}</span>
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="ms-auto">
                            <Nav.Link href="#kuhusu" className="mx-2">Kuhusu</Nav.Link>
                            <Nav.Link href="#huduma" className="mx-2">Huduma</Nav.Link>
                            <Nav.Link href="#mawasiliano" className="mx-2">Mawasiliano</Nav.Link>
                            <Button 
                                variant="primary" 
                                className="ms-3 px-4" 
                                onClick={() => navigate('/ingia')}
                            >
                                Ingia
                            </Button>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* Sehemu ya Kuvutia */}
            <header className="pharmacy-hero" style={{ backgroundImage: `url(${pharmacyData.image})` }}>
                <div className="hero-overlay">
                    <Container className="h-100">
                        <div className="hero-content text-white">
                            <div className="d-flex align-items-center mb-3">
                                <h1 className="display-5 fw-bold mb-0 me-3">{pharmacyData.name}</h1>
                                <div className="rating-badge d-flex align-items-center">
                                    <FaStar className="me-1" />
                                    <span>{pharmacyData.rating}</span>
                                </div>
                            </div>
                            <p className="lead mb-4">{pharmacyData.description}</p>
                            <div className="d-flex gap-3">
                                <Button variant="light" className="px-4" onClick={() => navigate(-1)}>
                                    <FaArrowLeft className="me-2" /> Rudi Nyuma
                                </Button>
                                <Button variant="outline-light" className="px-4" href="#mawasiliano">
                                    Wasiliana Nasi
                                </Button>
                            </div>
                        </div>
                    </Container>
                </div>
            </header>

            {/* Maelezo ya Haraka */}
            <div className="quick-info-bar bg-primary text-white py-3">
                <Container>
                    <Row className="align-items-center">
                        <Col md={4} className="mb-2 mb-md-0">
                            <div className="d-flex align-items-center justify-content-center">
                                <FaClock className="me-2" />
                                <span>{pharmacyData.hours}</span>
                            </div>
                        </Col>
                        <Col md={4} className="mb-2 mb-md-0">
                            <div className="d-flex align-items-center justify-content-center">
                                <FaPhone className="me-2" />
                                <span>{pharmacyData.phone}</span>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="d-flex align-items-center justify-content-center">
                                <FaMapMarkerAlt className="me-2" />
                                <span>{pharmacyData.address}, {pharmacyData.region}</span>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Sehemu ya Huduma */}
            <section id="huduma" className="py-5 bg-light">
                <Container>
                    <div className="text-center mb-5">
                        <h2 className="fw-bold mb-3">Huduma Zetu</h2>
                        <p className="text-muted">Suluhisho kamili za afya zilizoundwa kwa mahitaji yako</p>
                    </div>
                    
                    <Row className="g-4">
                        {pharmacyData.services.map((service, index) => (
                            <Col lg={4} md={6} key={index}>
                                <HudumaCard 
                                    icon={service.icon}
                                    title={service.title}
                                    description={service.description}
                                    image={service.image}
                                    onClick={() => handleServiceClick(`/huduma/${service.title.toLowerCase().replace(/\s+/g, '-')}`)}
                                />
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* Sehemu ya Kuhusu */}
            <section id="kuhusu" className="py-5">
                <Container>
                    <Row className="align-items-center">
                        <Col lg={6} className="mb-4 mb-lg-0">
                            <div className="about-image p-4">
                                <img 
                                    src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?ixlib=rb-4.0.3" 
                                    alt="Duka la dawa" 
                                    className="img-fluid rounded-3 shadow"
                                />
                            </div>
                        </Col>
                        <Col lg={6}>
                            <h2 className="fw-bold mb-4">Kuhusu {pharmacyData.name}</h2>
                            <p className="lead text-muted mb-4">
                                {pharmacyData.name} imekuwa ikiwahudumia wakazi wa {pharmacyData.region} tangu mwaka 2010, ikitoa bidhaa na huduma bora za afya.
                            </p>
                            <div className="d-flex gap-4 mb-4">
                                <div className="feature-box">
                                    <div className="icon-circle bg-primary-light">
                                        <FaClinicMedical className="text-primary" />
                                    </div>
                                    <h5 className="mt-3">Imesajiliwa</h5>
                                </div>
                                <div className="feature-box">
                                    <div className="icon-circle bg-primary-light">
                                        <FaUserMd className="text-primary" />
                                    </div>
                                    <h5 className="mt-3">Wataalamu</h5>
                                </div>
                            </div>
                            <p>
                                Timu yetu ya wataalamu wa afya imejitolea kuhakikisha unapata huduma bora zaidi kwa umakini wa kibinafsi. Tuna mkusanyiko mpana wa dawa na bidhaa za afya kukidhi mahitaji yako yote.
                            </p>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Maoni ya Wateja */}
            <section className="py-5 bg-light">
                <Container>
                    <div className="text-center mb-5">
                        <h2 className="fw-bold mb-3">Maoni ya Wateja Wetu</h2>
                        <p className="text-muted">Sikiliza kutoka kwa watu ambao wametumia huduma zetu</p>
                    </div>
                    
                    <Row className="g-4">
                        {pharmacyData.testimonials.map((testimonial, index) => (
                            <Col md={4} key={index}>
                                <TestimonialCard 
                                    text={testimonial.text}
                                    author={testimonial.author}
                                    rating={testimonial.rating}
                                />
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* Sehemu ya Mawasiliano */}
            <section id="mawasiliano" className="py-5">
                <Container>
                    <div className="text-center mb-5">
                        <h2 className="fw-bold mb-3">Tuwasiliane</h2>
                        <p className="text-muted">Tuko hapa kukusaidia kwa mahitaji yako yote ya afya</p>
                    </div>
                    
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <Card className="border-0 shadow-sm">
                                <Card.Body className="p-4">
                                    <Row>
                                        <Col md={4} className="mb-4 mb-md-0">
                                            <ContactItem 
                                                icon={<FaPhone size={24} className="text-primary" />}
                                                title="Simu"
                                                content={pharmacyData.phone}
                                            />
                                        </Col>
                                        <Col md={4} className="mb-4 mb-md-0">
                                            <ContactItem 
                                                icon={<FaEnvelope size={24} className="text-primary" />}
                                                title="Barua Pepe"
                                                content={`info@${pharmacyData.name.toLowerCase().replace(/\s+/g, '')}.com`}
                                            />
                                        </Col>
                                        <Col md={4}>
                                            <ContactItem 
                                                icon={<FaMapMarkerAlt size={24} className="text-primary" />}
                                                title="Anwani"
                                                content={`${pharmacyData.address}, ${pharmacyData.region}`}
                                            />
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Footer */}
            <footer className="bg-dark text-white py-4">
                <Container>
                    <Row className="align-items-center">
                        <Col md={6} className="mb-3 mb-md-0">
                            <div className="d-flex align-items-center">
                                <FaClinicMedical size={24} className="text-primary me-2" />
                                <span className="fw-bold">{pharmacyData.name}</span>
                            </div>
                            <p className="small text-muted mt-2 mb-0">
                                Huduma bora za afya kwa jamii yetu
                            </p>
                        </Col>
                        <Col md={6} className="text-md-end">
                            <p className="small mb-0">
                                &copy; {new Date().getFullYear()} {pharmacyData.name}. Haki zote zimehifadhiwa.
                            </p>
                        </Col>
                    </Row>
                </Container>
            </footer>
        </div>
    );
}

// Komponenti ya Kadi ya Huduma
const HudumaCard = ({ icon, title, description, image, onClick }) => {
    return (
        <Card 
            className="h-100 border-0 shadow-sm service-card" 
            onClick={onClick}
        >
            <div className="service-image-container">
                <img src={image} alt={title} className="service-image" />
            </div>
            <Card.Body className="text-center p-4">
                <div className="icon-wrapper mb-4">
                    {icon}
                </div>
                <h4 className="mb-3">{title}</h4>
                <p className="text-muted">{description}</p>
                <Button variant="outline-primary" size="sm">
                    Jifunze Zaidi
                </Button>
            </Card.Body>
        </Card>
    );
};

// Komponenti ya Kipengele cha Mawasiliano
const ContactItem = ({ icon, title, content }) => {
    return (
        <div className="text-center">
            <div className="contact-icon mb-3">
                {icon}
            </div>
            <h5 className="mb-2">{title}</h5>
            <p className="text-muted mb-0">{content}</p>
        </div>
    );
};

// Komponenti ya Kadi ya Maoni
const TestimonialCard = ({ text, author, rating }) => {
    return (
        <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="p-4">
                <div className="d-flex mb-3">
                    {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className={i < rating ? "text-warning" : "text-secondary"} />
                    ))}
                </div>
                <p className="mb-4">"{text}"</p>
                <p className="text-muted mb-0">- {author}</p>
            </Card.Body>
        </Card>
    );
};

export default PharmacyAndHospitals;