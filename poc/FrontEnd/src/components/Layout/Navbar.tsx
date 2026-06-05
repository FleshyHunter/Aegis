import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="navbar">
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <img src="/AEGIS.png" alt="Aegis logo" style={{ width: "28px", height: "28px", objectFit: "contain" }} />
        <h1 className="navbar-logo" style={{ fontFamily: "'Zen Dots', sans-serif" }}>AEGIS</h1>
      </div>
      <nav className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/ba">BA Rules</Link>
        <Link to="/building-blocks">Building Blocks</Link>
        <Link to="/ticket-sets">Ticket Sets</Link>
        <Link to="/tickets">Tickets</Link>
      </nav>
    </header>
  );
}
