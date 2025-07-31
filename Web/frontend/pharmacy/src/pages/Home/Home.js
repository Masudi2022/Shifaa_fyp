import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Navbar,
  Nav,
  Button,
  Row,
  Col,
  Card,
  Image,
  Badge,
  ListGroup
} from 'react-bootstrap';
import {
  FaCommentMedical,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaUserMd,
  FaPills,
  FaHeartbeat,
  FaRegComments,
  FaHome,
  FaInfoCircle,
  FaConciergeBell,
  FaFileAlt,
  FaSignInAlt,
  FaHospital,
  FaClinicMedical,
  FaAmbulance,
  FaComments
} from 'react-icons/fa';

// Image URLs
const doctor = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80';
const healthEducation = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80';
const hospitalBg = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80';
const choose = 'https://images.unsplash.com/photo-1530026186672-2cd00ffc50fe?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80';
const emergencyBg = 'https://images.unsplash.com/photo-1588776814546-ec07b6655f51?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';

function Home() {
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);

  const handleServiceClick = (path) => {
    sessionStorage.setItem('redirectPath', path);
    navigate(path);
  };

  const toggleChat = () => {
    setShowChat(!showChat);
  };

  return (
    <div className="bg-light">
      {/* Floating Chat Button */}
      <Button
        variant="primary"
        className="rounded-circle position-fixed bottom-0 end-0 m-4"
        style={{ width: '60px', height: '60px', zIndex: 1000 }}
        onClick={toggleChat}
      >
        <FaRegComments size={24} />
        <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle">
          Moja kwa Moja
        </Badge>
      </Button>

      {showChat && (
        <Card className="position-fixed bottom-0 end-0 mb-5 me-4 shadow-lg" style={{ width: '350px', height: '450px', zIndex: 1000 }}>
          <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Msaidizi wa Afya</h5>
            <Button variant="link" className="text-white p-0" onClick={toggleChat}>
              <span style={{ fontSize: '1.5rem' }}>&times;</span>
            </Button>
          </Card.Header>
          <Card.Body className="overflow-auto">
            <div className="bg-light p-3 rounded">
              <p className="mb-0">Habari! Mimi ni msaidizi wako wa afya. Naweza kukusaidiaje leo?</p>
            </div>
          </Card.Body>
          <Card.Footer className="bg-white">
            <div className="d-flex">
              <input type="text" placeholder="Andika swali lako la kiafya..." className="form-control rounded-pill me-2" />
              <Button variant="primary" className="rounded-pill">Tuma</Button>
            </div>
          </Card.Footer>
        </Card>
      )}

      {/* Navigation Bar */}
      <Navbar bg="primary" expand="lg" sticky="top" className="px-4 py-3">
        <Navbar.Brand className="text-white fs-3 fw-bold">Shifaa</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" className="text-white" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link href="#home" className="text-white mx-2 d-flex align-items-center">
              <FaHome className="me-1" /> Mwanzo
            </Nav.Link>
            <Nav.Link href="#about" className="text-white mx-2 d-flex align-items-center">
              <FaInfoCircle className="me-1" /> Kuhusu Sisi
            </Nav.Link>
            <Nav.Link href="#services" className="text-white mx-2 d-flex align-items-center">
              <FaConciergeBell className="me-1" /> Huduma
            </Nav.Link>
            <Nav.Link href="#education" className="text-white mx-2 d-flex align-items-center">
              <FaFileAlt className="me-1" /> Elimu ya Afya
            </Nav.Link>
            <Nav.Link href="/login" className="text-white mx-2 d-flex align-items-center">
              <FaSignInAlt className="me-1" /> Ingia
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      {/* Hero Section */}
      <section id="home" className="py-5 bg-white">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-4 mb-lg-0">
              <h6 className="text-info mb-3">Karibu Shifaa Afya</h6>
              <h1 className="display-4 fw-bold mb-4">Pata Huduma za <span className="text-primary">Afya Bora</span> Tanzania</h1>
              <p className="lead mb-4">
                Shifaa ni jukwaa la kidigitali linalokusaidia kupata huduma za afya, ushauri wa kitaalamu, na ramani ya vituo vya afya karibu nawe – kwa urahisi na kwa Kiswahili.
              </p>
              <Button variant="primary" size="lg" className="rounded-pill px-4" onClick={() => handleServiceClick('/services')}>
                Tafuta Huduma Sasa
              </Button>
            </Col>
            <Col lg={6}>
              <Image src={doctor} fluid rounded className="shadow" />
            </Col>
          </Row>
        </Container>
      </section>

      <hr className="my-5 border-2 border-top border-primary opacity-25" />

      {/* Services Section */}
      <section id="services" className="py-5 bg-light">
        <Container>
          <h2 className="text-center text-primary mb-5">HUDUMA ZETU</h2>
          <Row className="g-4">
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm" onClick={() => handleServiceClick('/health-facilities')}>
                <div
                  style={{
                    backgroundImage: `url(${hospitalBg})`,
                    height: '180px',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderTopLeftRadius: '0.5rem',
                    borderTopRightRadius: '0.5rem'
                  }}
                />
                <Card.Body className="text-center p-4">
                  <Card.Title className="fs-4 text-primary">Vituo vya Afya</Card.Title>
                  <Card.Text className="text-muted">Tafuta hospitali, vituo vya afya na kliniki zilizo karibu nawe kwa usahihi na haraka.</Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm" onClick={() => handleServiceClick('/pharmacies')}>
                <div
                  style={{
                    backgroundImage: `url(${emergencyBg})`,
                    height: '180px',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderTopLeftRadius: '0.5rem',
                    borderTopRightRadius: '0.5rem'
                  }}
                />
                <Card.Body className="text-center p-4">
                  <Card.Title className="fs-4 text-primary">Huduma za Dharura</Card.Title>
                  <Card.Text className="text-muted">Pata msaada wa haraka wakati wa dharura kwa kupata vituo vya karibu na nambari za msaada.</Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm" onClick={() => handleServiceClick('/counseling')}>
                <Card.Body className="text-center p-4">
                  <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3">
                    <FaComments size={40} className="text-primary" />
                  </div>
                  <Card.Title className="fs-4 text-primary">Ushauri wa Afya</Card.Title>
                  <Card.Text className="text-muted">Pata ushauri wa kitaalamu kutoka kwa wataalamu wa afya kuhusu hali yako.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      <hr className="my-5 border-2 border-top border-primary opacity-25" />

      {/* Health Education Section */}
      <section id="education" className="py-5 bg-white">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-4 mb-lg-0">
              <Image src={healthEducation} fluid rounded className="shadow" />
            </Col>
            <Col lg={6}>
              <h6 className="text-primary mb-3">ELIMU YA AFYA</h6>
              <h2 className="display-6 fw-bold mb-4">Jifunze Kuhusu Afya Yako</h2>
              <p className="lead mb-4">
                Shifaa inakupa mwongozo wa kujikinga na magonjwa na kushiriki maarifa muhimu ya kiafya kwa familia yako na jamii.
              </p>
              <ListGroup variant="flush">
                <ListGroup.Item className="border-0 ps-0">
                  <FaHeartbeat className="text-primary me-2" /> Vidokezo vya kujikinga na magonjwa
                </ListGroup.Item>
                <ListGroup.Item className="border-0 ps-0">
                  <FaClinicMedical className="text-primary me-2" /> Ufahamu wa dalili za magonjwa
                </ListGroup.Item>
                <ListGroup.Item className="border-0 ps-0">
                  <FaUserMd className="text-primary me-2" /> Ushauri wa matibabu na chanjo
                </ListGroup.Item>
              </ListGroup>
            </Col>
          </Row>
        </Container>
      </section>

      {/* About Section */}
      <section id="about" className="py-5 bg-light">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-4 mb-lg-0">
              <h2 className="display-6 fw-bold mb-4">Jukwaa Lako la Huduma za Afya Tanzania</h2>
              <p className="lead mb-4">
                Shifaa inalenga kusaidia Watanzania kupata huduma bora za afya kupitia teknolojia. Tunawaunganisha na watoa huduma za afya wenye taaluma na huruma – bila ubaguzi wala matangazo ya kibiashara.
              </p>
              <Button variant="outline-primary" size="lg" onClick={() => handleServiceClick('/about')}>
                Jifunze Zaidi
              </Button>
            </Col>
            <Col lg={6}>
              <Image src={choose} fluid rounded className="shadow" />
            </Col>
          </Row>
        </Container>
      </section>

      {/* Call to Action */}
      <section className="py-5" style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${hospitalBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Container className="text-center">
          <Card className="bg-info bg-opacity-75 text-white p-4 d-inline-block">
            <Card.Body>
              <h2 className="mb-0">
                Shifaa inakusaidia kupata huduma bora za afya popote ulipo Tanzania. Tupo kwa ajili yako!
              </h2>
            </Card.Body>
          </Card>
        </Container>
      </section>

      {/* Why Choose Us */}
      <section className="py-5 bg-white">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-4 mb-lg-0">
              <h6 className="text-primary mb-3">KWANINI UTUCHAGUE</h6>
              <h2 className="display-6 fw-bold mb-4">Shifaa: Mwenzako wa Afya</h2>
              <div className="d-flex mb-4 p-3 bg-light rounded shadow-sm">
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '30px', height: '30px', flexShrink: 0 }}>1</div>
                <div>
                  <h4 className="text-primary">Huduma kwa Wote</h4>
                  <p className="mb-0 text-muted">Tunasaidia wananchi wote wa Tanzania kupata huduma za afya bila ugumu.</p>
                </div>
              </div>
              <div className="d-flex mb-4 p-3 bg-light rounded shadow-sm">
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '30px', height: '30px', flexShrink: 0 }}>2</div>
                <div>
                  <h4 className="text-primary">Taarifa Zaidi</h4>
                  <p className="mb-0 text-muted">Tunakupa maelezo kamili kuhusu vituo vya afya, gharama, na huduma zinazopatikana.</p>
                </div>
              </div>
              <div className="d-flex p-3 bg-light rounded shadow-sm">
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '30px', height: '30px', flexShrink: 0 }}>3</div>
                <div>
                  <h4 className="text-primary">Msaada wa Haraka</h4>
                  <p className="mb-0 text-muted">Tunaunganisha na huduma za dharura wakati wowote unahitaji msaada wa haraka.</p>
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <Image src={choose} fluid rounded className="shadow" />
            </Col>
          </Row>
        </Container>
      </section>

      {/* Footer */}
      <footer className="py-5 bg-dark text-white">
        <Container>
          <Row>
            <Col md={4} className="mb-4 mb-md-0">
              <h4 className="fw-bold mb-3"><span className="text-primary">Shifaa</span> Afya</h4>
              <p className="text-muted">Jukwaa la kidigitali linalosaidia Watanzania kupata huduma za afya kwa njia rahisi, ya haraka, na salama.</p>
            </Col>
            <Col md={4} className="mb-4 mb-md-0">
              <h5 className="fw-bold mb-3 border-bottom border-primary pb-2 d-inline-block">Mawasiliano</h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <FaPhoneAlt className="text-primary me-2" />
                  Namba ya Dharura: 112
                </li>
                <li className="mb-2">
                  <FaMapMarkerAlt className="text-primary me-2" />
                  Dar es Salaam, Tanzania
                </li>
                <li>
                  <span className="text-primary me-2">@</span>
                  info@shifaa.go.tz
                </li>
              </ul>
            </Col>
            <Col md={4}>
              <h5 className="fw-bold mb-3 border-bottom border-primary pb-2 d-inline-block">Tufuate</h5>
              <div className="d-flex gap-3 mb-3">
                <Button variant="outline-light" size="sm" className="rounded-circle p-2">
                  <FaFacebook />
                </Button>
                <Button variant="outline-light" size="sm" className="rounded-circle p-2">
                  <FaTwitter />
                </Button>
                <Button variant="outline-light" size="sm" className="rounded-circle p-2">
                  <FaInstagram />
                </Button>
              </div>
              <p className="text-muted small">Wadau: Wizara ya Afya, TMDA, NHIF</p>
            </Col>
          </Row>
          <hr className="my-4 bg-secondary" />
          <Row>
            <Col className="text-center">
              <p className="small mb-0 text-muted">
                &copy; {new Date().getFullYear()} Shifaa Afya. Haki zote zimehifadhiwa. Huduma ya Serikali ya Tanzania.
              </p>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
}

export default Home;