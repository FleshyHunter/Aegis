import React from "react";
import Navbar from "../../components/Layout/Navbar";
import Button from "../../components/Button";
import Footer from "../../components/Layout/Footer";

export default function Home() {
  return (
    <div className="page">
      <Navbar />

      <main className="hero">
        <h2 className="hero-title">Welcome to Idemia</h2>
        <p className="hero-subtitle">
          A simple, modern starting point for your project.
        </p>
        <Button label="Get Started" variant="primary" />
      </main>

      <Footer />
    </div>
  );
}
