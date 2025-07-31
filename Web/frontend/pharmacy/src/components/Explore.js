import React from 'react';
import pharmacist from './Images/pharmacist.jpeg';
import './Services.css';

function Explore() {
    return (
        <div className="counseling-container service">
            <div className="counseling-image">
                <img src={pharmacist} alt="Counseling with a pharmacist" />
            </div>
            <div className="counseling-content">
                <h2>Exprole</h2>
                <p>Let's Exprole more for Your Better Health</p>
            </div>
        </div>
    );
}

export default Explore;
