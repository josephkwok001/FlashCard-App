import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';

function LoginPage() {
  const navigate = useNavigate();
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    async function handleSubmite(e) {
        e.preventDefault();
        setError("");
        try{
            await api.login(email, password)
            navigate("/")
        } catch (err) {
            setError(err.message);
        }
    }


    return (

        <form onSubmite={handleSubmit}>

        </form>

    )
}

export default LoginPage;
