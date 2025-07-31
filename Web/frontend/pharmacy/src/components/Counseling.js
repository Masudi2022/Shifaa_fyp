import React, { useState } from 'react';
import ChatBot from 'react-simple-chatbot';
import pharmacist from './Images/pharmacist.jpeg';
import './Services.css';

function Counseling() {
    const [lastResponse, setLastResponse] = useState('');
    const [steps, setSteps] = useState([
        {
            id: '1',
            message: 'Hello! How can I assist you today?',
            trigger: 'userResponse',
        },
        {
            id: 'userResponse',
            user: true,
            trigger: 'analyzeResponse',
        },
        {
            id: 'analyzeResponse',
            component: <AnalyzeResponse setLastResponse={setLastResponse} />,
            waitAction: true,
            trigger: 'askAnythingElse',
        },
        {
            id: 'askAnythingElse',
            message: 'Is there anything else you would like to know?',
            trigger: 'userResponse',
        },
    ]);

    return (
        <div className="counseling-container service">
            <div className="counseling-image">
                <img src={pharmacist} alt="Counseling with a pharmacist" />
            </div>
            <div className="counseling-content">
                <h2>Counseling Services</h2>
                <p>Get professional advice and counseling from our certified pharmacists.</p>
                <ChatBot steps={steps} />
            </div>
        </div>
    );
}

function AnalyzeResponse({ previousStep, setLastResponse }) {
    const userMessage = previousStep?.message?.toLowerCase() || '';

    let response = '';
    if (/fever/.test(userMessage)) {
        response = 'For fever, it is advisable to rest and stay hydrated. If the fever persists for more than 48 hours or is accompanied by severe symptoms, please visit a hospital.';
    } else if (/headache/.test(userMessage)) {
        response = 'For headaches, over-the-counter pain relievers may help. If you experience severe headaches or if it is accompanied by vision problems or nausea, consult a healthcare provider.';
    } else if (/nausea/.test(userMessage)) {
        response = 'Nausea can be caused by various factors. Try sipping clear fluids and avoiding solid foods until it improves. If nausea is severe or persistent, visit a hospital.';
    } else if (/chest pain/.test(userMessage)) {
        response = 'Chest pain can be a sign of a serious condition. If you experience chest pain, seek emergency medical attention immediately.';
    } else if (/shortness of breath/.test(userMessage)) {
        response = 'Shortness of breath requires urgent medical evaluation. If you experience this, visit a hospital right away.';
    } else if (/abdominal pain/.test(userMessage)) {
        response = 'For abdominal pain, you can try over-the-counter antacids or pain relievers. If the pain is severe or persists, consult a healthcare provider or visit a hospital.';
    } else if (/dizziness/.test(userMessage)) {
        response = 'Dizziness can be caused by dehydration or low blood pressure. Drink plenty of fluids and rest. If dizziness is frequent or severe, seek medical advice.';
    } else if (/cough/.test(userMessage)) {
        response = 'For a cough, consider using cough syrup or lozenges. If the cough persists for more than a week or is accompanied by chest pain or difficulty breathing, visit a hospital.';
    } else if (/rash/.test(userMessage)) {
        response = 'A rash can be caused by an allergy or infection. Apply soothing lotions and avoid scratching. If the rash is widespread or severe, visit a healthcare provider.';
    } else if (/fatigue/.test(userMessage)) {
        response = 'Fatigue may result from various causes including stress or lack of sleep. Ensure you are getting adequate rest. If fatigue is persistent and severe, consult a healthcare provider.';
    } else if (/swelling/.test(userMessage)) {
        response = 'For swelling, you can use ice packs to reduce inflammation. If swelling is sudden or severe, consult a healthcare provider immediately.';
    } else if (/sore throat/.test(userMessage)) {
        response = 'A sore throat can be eased with warm salt water gargles or lozenges. If symptoms persist or are severe, consider visiting a healthcare provider.';
    } else if (/earache/.test(userMessage)) {
        response = 'For earaches, you can use warm compresses. If the earache is persistent or accompanied by fever, seek medical attention.';
    } else if (/muscle pain/.test(userMessage)) {
        response = 'Muscle pain can be treated with over-the-counter pain relievers and rest. If the pain is severe or lasts for an extended period, consult a healthcare provider.';
    } else if (/joint pain/.test(userMessage)) {
        response = 'Joint pain may be managed with rest and pain relievers. If joint pain persists or is accompanied by swelling, visit a healthcare provider.';
    } else if (/diarrhea/.test(userMessage)) {
        response = 'For diarrhea, ensure you stay hydrated with clear fluids. If diarrhea persists for more than 48 hours or is accompanied by severe pain, consult a healthcare provider.';
    } else if (/constipation/.test(userMessage)) {
        response = 'For constipation, increase your fiber intake and drink plenty of water. If constipation persists, consider visiting a healthcare provider.';
    } else if (/skin infection/.test(userMessage)) {
        response = 'For minor skin infections, you can use over-the-counter topical antibiotics. If the infection is severe or spreading, visit a healthcare provider.';
    } else if (/flu/.test(userMessage)) {
        response = 'For flu symptoms, rest and stay hydrated. Over-the-counter medications may help. If symptoms are severe or persist for more than a week, consult a healthcare provider.';
    } else if (/cold/.test(userMessage)) {
        response = 'For a cold, rest and fluids are recommended. Over-the-counter cold remedies may help. If symptoms are severe or persist, consider visiting a healthcare provider.';
    } else if (/allergy/.test(userMessage)) {
        response = 'For allergies, antihistamines may help. If you experience severe allergic reactions or symptoms persist, seek medical attention.';
    } else if (/back pain/.test(userMessage)) {
        response = 'For back pain, rest and pain relievers may be helpful. If the pain is severe or persistent, visit a healthcare provider for further evaluation.';
    } else if (/high blood pressure/.test(userMessage)) {
        response = 'For high blood pressure, lifestyle changes and medications may be necessary. Monitor your blood pressure regularly and consult a healthcare provider if needed.';
    } else if (/diabetes/.test(userMessage)) {
        response = 'For diabetes management, monitor your blood sugar levels and follow your prescribed treatment plan. If you experience unusual symptoms, visit a healthcare provider.';
    } else if (/kidney pain/.test(userMessage)) {
        response = 'Kidney pain may require medical evaluation. If you experience severe or persistent pain, consult a healthcare provider or visit a hospital.';
    } else if (/blurry vision/.test(userMessage)) {
        response = 'Blurry vision can be caused by various conditions. If you experience sudden or severe changes in vision, consult a healthcare provider.';
    } else if (/weight loss/.test(userMessage)) {
        response = 'Unexplained weight loss should be evaluated by a healthcare provider to determine the underlying cause.';
    } else if (/insomnia/.test(userMessage)) {
        response = 'For insomnia, consider improving sleep hygiene and relaxation techniques. If insomnia persists, consult a healthcare provider.';
    } else if (/memory loss/.test(userMessage)) {
        response = 'Memory loss should be evaluated by a healthcare provider to determine the underlying cause and appropriate treatment.';
    } else if (/anxiety/.test(userMessage)) {
        response = 'For anxiety, consider stress management techniques or therapy. If anxiety is severe or persistent, consult a mental health professional.';
    } else if (/depression/.test(userMessage)) {
        response = 'Depression should be addressed with counseling or medication. Consult a mental health professional for appropriate treatment.';
    } else if (/asthma/.test(userMessage)) {
        response = 'For asthma, ensure you are using your prescribed inhalers and avoiding triggers. If you experience severe symptoms or an asthma attack, seek immediate medical attention.';
    } else {
        response = 'I can help with various symptoms and conditions. Feel free to ask more specific questions or describe your symptoms in detail!';
    }

    setLastResponse(response);
    return <div>{response}</div>;
}

export default Counseling;
