import './landing.css';
import {useState} from 'react';

function Landing() {
  return (
    <div className="landing">
        <p>Connect to:</p>
        <input type="text" placeholder="address...."></input>
        <button>Go!</button>
    </div>
  );
}

export default Landing;