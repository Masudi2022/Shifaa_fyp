import React, { useState, useRef, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Form, Button, 
  ListGroup, Badge, Spinner, Stack, OverlayTrigger, Tooltip
} from 'react-bootstrap';
import { 
  MicFill, SendFill, InfoCircleFill, LightbulbFill,
  HeartFill, ArrowRightCircleFill, EmojiSmileFill
} from 'react-bootstrap-icons';

function GoalsPage() {
    const [messages, setMessages] = useState([
        { 
            id: 1, 
            text: 'Hello! 👋 How can I assist you today?', 
            sender: 'bot',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isBotTyping, setIsBotTyping] = useState(false);
    const [suggestions] = useState([
        "Tell me about SHFAA",
        "What's your vision?",
        "Describe your mission",
        "How does the system work?"
    ]);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        // Add user message
        const userMessage = { 
            id: messages.length + 1, 
            text: inputValue, 
            sender: 'user',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsBotTyping(true);

        // Simulate bot response after delay
        setTimeout(() => {
            const botResponse = generateBotResponse(inputValue);
            setMessages(prev => [...prev, { 
                id: messages.length + 2, 
                text: botResponse.response, 
                sender: 'bot',
                timestamp: new Date()
            }]);
            speak(botResponse.response);
            setIsBotTyping(false);
        }, 1000 + Math.random() * 1000); // Random delay for more natural feel
    };

    const handleQuickSuggestion = (suggestion) => {
        setInputValue(suggestion);
    };

    const handleVoiceInput = () => {
        if (isListening) return;
        
        setIsListening(true);
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInputValue(transcript);
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const generateBotResponse = (userMessage) => {
        const message = userMessage.toLowerCase();
        let response = '';
        
        if (/shfaa/.test(message)) {
            response = 'Naam, I am here to help you learn about our healthcare system. 💊🏥';
        } else if (/describe.*system/.test(message)) {
            response = 'Our system provides comprehensive healthcare solutions, including:\n\n• Medical advice\n• Medicine information\n• Booking services\n\nOur vision is to make quality healthcare accessible to all. ❤️';
        } else if (/vision/.test(message)) {
            response = '🌟 Our Vision 🌟\nTo foster a healthier world by offering easy access to essential healthcare services and products for everyone.';
        } else if (/mission/.test(message)) {
            response = '🚀 Our Mission 🚀\nTo deliver personalized healthcare solutions and support to effectively meet individual health needs with compassion and excellence.';
        } else {
            response = 'I can help with details about:\n\n• Our system\n• Vision statement\n• Mission objectives\n\nFeel free to ask more specific questions! 😊';
        }

        return { response };
    };

    const speak = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Container className="py-4" style={{ maxWidth: '900px' }}>
            <Row className="text-center mb-4">
                <Col>
                    <h1 className="display-4 fw-bold text-primary mb-3">
                        <HeartFill className="me-2" color="#dc3545" />
                        SHFAA Healthcare Goals
                        <LightbulbFill className="ms-2" color="#ffc107" />
                    </h1>
                    <p className="lead text-muted mb-4">
                        Discover our vision, mission, and objectives for better healthcare
                    </p>
                </Col>
            </Row>
            
            <Row className="justify-content-center mb-4">
                <Col md={10} lg={8}>
                    <Card className="shadow-lg border-0 overflow-hidden">
                        <Card.Header className="bg-gradient-primary text-white d-flex justify-content-between align-items-center py-3">
                            <div className="d-flex align-items-center">
                                <div className="bg-white rounded-circle p-2 me-3">
                                    <img 
                                        src="https://cdn-icons-png.flaticon.com/512/2784/2784487.png" 
                                        alt="Bot" 
                                        width="30" 
                                        height="30"
                                    />
                                </div>
                                <div>
                                    <h5 className="mb-0">SHFAA Assistant</h5>
                                    <small className="opacity-75">
                                        {isBotTyping ? (
                                            <span className="d-flex align-items-center">
                                                <Spinner animation="grow" size="sm" className="me-1" />
                                                Typing...
                                            </span>
                                        ) : (
                                            <span className="d-flex align-items-center">
                                                <span className="bg-success rounded-circle p-1 me-1"></span>
                                                Online
                                            </span>
                                        )}
                                    </small>
                                </div>
                            </div>
                            <OverlayTrigger
                                placement="bottom"
                                overlay={<Tooltip>About SHFAA Assistant</Tooltip>}
                            >
                                <Button variant="link" className="text-white p-0">
                                    <InfoCircleFill size={20} />
                                </Button>
                            </OverlayTrigger>
                        </Card.Header>
                        
                        <Card.Body 
                            className="p-0 bg-light" 
                            style={{ height: '450px', overflowY: 'auto', background: 'url("https://www.transparenttextures.com/patterns/light-wool.png")' }}
                        >
                            <ListGroup variant="flush">
                                {messages.map((message) => (
                                    <ListGroup.Item 
                                        key={message.id}
                                        className={`border-0 d-flex ${message.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                                    >
                                        <div 
                                            className={`rounded-4 p-3 position-relative ${message.sender === 'user' 
                                                ? 'bg-primary text-white' 
                                                : 'bg-white text-dark shadow-sm'}`}
                                            style={{ 
                                                maxWidth: '85%',
                                                borderBottomLeftRadius: message.sender === 'bot' ? '0' : '',
                                                borderBottomRightRadius: message.sender === 'user' ? '0' : ''
                                            }}
                                        >
                                            {message.text.split('\n').map((line, i) => (
                                                <p key={i} className="mb-1">{line}</p>
                                            ))}
                                            <small 
                                                className={`d-block text-end mt-2 ${message.sender === 'user' ? 'text-white-50' : 'text-muted'}`}
                                            >
                                                {formatTime(message.timestamp)}
                                            </small>
                                            {message.sender === 'bot' && (
                                                <div className="position-absolute bottom-0 start-0 translate-middle">
                                                    <div className="bg-white p-1 rounded-circle shadow-sm">
                                                        <img 
                                                            src="https://cdn-icons-png.flaticon.com/512/2784/2784487.png" 
                                                            alt="Bot" 
                                                            width="20" 
                                                            height="20"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </ListGroup.Item>
                                ))}
                                {isBotTyping && (
                                    <ListGroup.Item className="border-0 d-flex justify-content-start">
                                        <div className="bg-white rounded-4 p-3 shadow-sm">
                                            <Spinner animation="grow" size="sm" className="me-2" />
                                            <Spinner animation="grow" size="sm" className="me-2" />
                                            <Spinner animation="grow" size="sm" />
                                        </div>
                                    </ListGroup.Item>
                                )}
                                <div ref={messagesEndRef} />
                            </ListGroup>
                        </Card.Body>
                        
                        <Card.Footer className="bg-white border-top">
                            <div className="mb-3">
                                <div className="d-flex flex-wrap gap-2">
                                    {suggestions.map((suggestion, index) => (
                                        <Button
                                            key={index}
                                            variant="outline-primary"
                                            size="sm"
                                            className="rounded-pill"
                                            onClick={() => handleQuickSuggestion(suggestion)}
                                        >
                                            <ArrowRightCircleFill className="me-1" />
                                            {suggestion}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            
                            <Form onSubmit={handleSendMessage}>
                                <Stack direction="horizontal" gap={2}>
                                    <Form.Control
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="Type your message here..."
                                        className="rounded-pill border-0 bg-light py-2 px-3"
                                    />
                                    <OverlayTrigger
                                        placement="top"
                                        overlay={<Tooltip>Voice Input</Tooltip>}
                                    >
                                        <Button 
                                            variant={isListening ? "danger" : "outline-secondary"} 
                                            type="button"
                                            onClick={handleVoiceInput}
                                            disabled={isListening}
                                            className="rounded-circle p-2 d-flex align-items-center justify-content-center"
                                            style={{ width: '40px', height: '40px' }}
                                        >
                                            {isListening ? (
                                                <Spinner animation="border" size="sm" />
                                            ) : (
                                                <MicFill size={18} />
                                            )}
                                        </Button>
                                    </OverlayTrigger>
                                    <Button 
                                        variant="primary" 
                                        type="submit"
                                        className="rounded-pill px-3 d-flex align-items-center"
                                        disabled={!inputValue.trim()}
                                    >
                                        <SendFill className="me-1" />
                                        Send
                                    </Button>
                                </Stack>
                            </Form>
                        </Card.Footer>
                    </Card>
                </Col>
            </Row>
            
            <Row className="mt-4 text-center">
                <Col>
                    <p className="text-muted">
                        <small>
                            <EmojiSmileFill className="me-1" />
                            SHFAA Healthcare Assistant - Providing compassionate care through technology
                        </small>
                    </p>
                </Col>
            </Row>
        </Container>
    );
}

export default GoalsPage;