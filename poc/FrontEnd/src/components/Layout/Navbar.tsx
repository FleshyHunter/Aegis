import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="navbar">
      <h1 className="navbar-logo">Idemia</h1>
      <nav className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/ba">BA</Link>
        <Link to="/">Building Blocks</Link>
        <Link to="/">Sets</Link>
        <Link to="/tickets">Tickets</Link>
      </nav>
    </header>
  );
}
