import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
        <img src="/AEGIS.png" alt="Aegis logo" style={{ width: "28px", height: "28px", objectFit: "contain" }} />
        <h1 className="navbar-logo" style={{ fontFamily: "'Zen Dots', sans-serif" }}>AEGIS</h1>
      </Link>
      <nav className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => isActive ? "navbar-pill active" : "navbar-pill"}>Home</NavLink>
        <NavLink to="/ba" className={({ isActive }) => isActive ? "navbar-pill active" : "navbar-pill"}>BA Rules</NavLink>
        <NavLink to="/building-blocks" className={({ isActive }) => isActive ? "navbar-pill active" : "navbar-pill"}>Building Blocks</NavLink>
        <NavLink to="/ticket-sets" className={({ isActive }) => isActive ? "navbar-pill active" : "navbar-pill"}>Ticket Sets</NavLink>
        <NavLink to="/tickets" className={({ isActive }) => isActive ? "navbar-pill active" : "navbar-pill"}>Tickets</NavLink>
      </nav>
    </header>
  );
}
