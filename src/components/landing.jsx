import './landing.css';
import {useState} from 'react';


function Landing(props) {
  const [name, setName] = useState("");

  const handleChange = (evt) => {
    setName(evt.target.value);
  }

  return (
    <div className="landing">
        <p>Here you can chat with strangers or friends!</p>
        <h2>Enter your display name to get started</h2>
        <input type="text" value={name} onChange = {(evt) => handleChange(evt)} ></input>
        <button onClick={() => props.connect(name)}>Connect!</button>
    </div>
  );
}

export default Landing;