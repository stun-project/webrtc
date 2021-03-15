import './landing.css';
import {useState} from 'react';


function Landing(props) {
  const [name, setName] = useState("");

  const handleChange = (evt) => {
    setName(evt.target.value);
  }

  return (
    <div className="landing">
        <h2>Enter your display name</h2>
        <input type="text" value={name} onChange = {(evt) => handleChange(evt)} ></input>
        <button onClick={(name) => props.connect(name)}>Connect!</button>
    </div>
  );
}

export default Landing;