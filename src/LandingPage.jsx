import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const cursorRef = useRef(null);
  const codeContainerRef = useRef(null);
  
  // Handle cursor animation following mouse movement
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // Animate code typing effect
    const codeContainer = codeContainerRef.current;
    if (codeContainer) {
      const codeSnippet = `function helloWorld() {
  console.log("Welcome to Geist Editor!");
  
  // The modern coding experience
  const features = [
    "Multiple languages",
    "Syntax highlighting",
    "Dark/light themes",
    "Real-time output"
  ];
  
  return features.map(f => \`✓ \${f}\`).join("\\n");
}`;

      let i = 0;
      const typeCode = () => {
        if (i < codeSnippet.length) {
          codeContainer.innerHTML += codeSnippet.charAt(i);
          i++;
          setTimeout(typeCode, Math.random() * 100 + 20);
        }
      };
      
      typeCode();
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleGetStarted = () => {
    navigate('/editor'); // Navigate to the editor page
  };

  return (
    <div className="landing-container">
      <div className="cursor" ref={cursorRef}></div>
      
      <div className="floating-shapes">
        <div className="shape shape1"></div>
        <div className="shape shape2"></div>
        <div className="shape shape3"></div>
        <div className="shape shape4"></div>
        <div className="shape shape5"></div>
      </div>
      
      <header className="landing-header">
        <div className="logo">Geist<span>Editor</span></div>
      </header>
      
      <main className="landing-main">
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="gradient-text">Code</span> with 
              <span className="gradient-text"> Power</span>,<br/>
              <span className="gradient-text">Create</span> with 
              <span className="gradient-text"> Ease</span>
            </h1>
            
            <p className="hero-description">
              A modern, intuitive code editor with support for multiple languages,
              real-time output, and a beautiful interface that helps you focus on what matters.
            </p>
            
            <button className="cta-button" onClick={handleGetStarted}>
              <span>Launch Editor</span>
              <div className="button-glow"></div>
            </button>
          </div>
          
          <div className="code-preview">
            <div className="code-editor-preview">
              <div className="editor-header">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
                <span className="file-name">main.js</span>
              </div>
              <div className="editor-body">
                <pre ref={codeContainerRef} className="code-container"></pre>
              </div>
            </div>
          </div>
        </div>
        
        <div className="features-section">
          <div className="feature-card">
            <div className="feature-icon">🚀</div>
            <h3>Lightning Fast</h3>
            <p>Optimized for performance to handle your most complex projects.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>Beautiful Themes</h3>
            <p>Choose from light or dark themes to code in comfort.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔌</div>
            <h3>Multiple Languages</h3>
            <p>Support for JavaScript, TypeScript, HTML, CSS, Python, and more.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;