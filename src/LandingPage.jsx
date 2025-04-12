import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const cursorRef = useRef(null);
  const codeContainerRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(null);
  
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
    
    // Close dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (!e.target.closest('.nav-dropdown-trigger')) {
        setShowDropdown(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleGetStarted = () => {
    navigate('/editor'); // Navigate to the editor page
  };
  
  const toggleDropdown = (menu) => {
    setShowDropdown(showDropdown === menu ? null : menu);
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
        
        <nav className="main-nav">
          <ul className="nav-links">
            <li className="nav-item nav-dropdown-trigger" onClick={() => toggleDropdown('features')}>
              <span>Features</span>
              <span className="dropdown-arrow">▼</span>
              
              {showDropdown === 'features' && (
                <div className="nav-dropdown">
                  <div className="dropdown-item">
                    <span className="dropdown-icon">🚀</span>
                    <div>
                      <h4>Smart Editor</h4>
                      <p>Advanced code completion and syntax highlighting</p>
                    </div>
                  </div>
                  <div className="dropdown-item">
                    <span className="dropdown-icon">🤖</span>
                    <div>
                      <h4>AI Assistant</h4>
                      <p>Get intelligent code suggestions and improvements</p>
                    </div>
                  </div>
                  <div className="dropdown-item">
                    <span className="dropdown-icon">⚡</span>
                    <div>
                      <h4>Real-time Execution</h4>
                      <p>Run your code instantly within the editor</p>
                    </div>
                  </div>
                </div>
              )}
            </li>
            
            <li className="nav-item nav-dropdown-trigger" onClick={() => toggleDropdown('resources')}>
              <span>Resources</span>
              <span className="dropdown-arrow">▼</span>
              
              {showDropdown === 'resources' && (
                <div className="nav-dropdown">
                  <a href="#" className="dropdown-item">Documentation</a>
                  <a href="#" className="dropdown-item">Tutorials</a>
                  <a href="#" className="dropdown-item">API Reference</a>
                  <a href="#" className="dropdown-item">Community Forums</a>
                </div>
              )}
            </li>
            
            <li className="nav-item">
              <a href="#">Pricing</a>
            </li>
          </ul>
        </nav>
        
        <div className="header-actions">
          <button className="login-button">Log In</button>
          <button className="signup-button" onClick={handleGetStarted}>Try Now</button>
        </div>
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
              real-time output, AI-powered assistance, and a beautiful interface
              that helps you focus on what matters.
            </p>
            
            <div className="hero-buttons">
              <button className="cta-button" onClick={handleGetStarted}>
                <span>Launch Editor</span>
                <div className="button-glow"></div>
              </button>
              
              <button className="secondary-button">
                <span>View Demo</span>
              </button>
            </div>
            
            <div className="supported-langs">
              <span className="lang-label">Supported languages:</span>
              <div className="lang-icons">
                <span className="lang-icon" title="JavaScript">
                  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" alt="JavaScript" />
                </span>
                <span className="lang-icon" title="Python">
                  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" alt="Python" />
                </span>
                <span className="lang-icon" title="Java">
                  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" alt="Java" />
                </span>
                <span className="lang-icon" title="C++">
                  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg" alt="C++" />
                </span>
                <span className="lang-icon" title="HTML">
                  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" alt="HTML" />
                </span>
                <span className="lang-icon" title="CSS">
                  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" alt="CSS" />
                </span>
              </div>
            </div>
          </div>
          
          <div className="code-preview">
            <div className="code-editor-preview">
              <div className="editor-header">
                <div className="window-controls">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <span className="file-name">main.js</span>
                <div className="editor-tabs">
                  <span className="editor-tab active">main.js</span>
                  <span className="editor-tab">index.html</span>
                </div>
              </div>
              <div className="editor-body">
                <div className="line-numbers">
                  {Array(15).fill(0).map((_, i) => (
                    <div key={i} className="line-number">{i + 1}</div>
                  ))}
                </div>
                <pre ref={codeContainerRef} className="code-container"></pre>
              </div>
            </div>
          </div>
        </div>
        
        <div className="features-section">
          <h2 className="section-title">Powerful Features</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Lightning Fast</h3>
              <p>Optimized for performance to handle your most complex projects with ease and speed.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Beautiful Themes</h3>
              <p>Choose from professionally designed light or dark themes to code in comfort and style.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔌</div>
              <h3>Multiple Languages</h3>
              <p>Support for JavaScript, TypeScript, HTML, CSS, Python, Java, C++ and more languages.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI Assistant</h3>
              <p>Get intelligent code suggestions and improvements with our built-in AI assistant.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Live Execution</h3>
              <p>Run your code directly in the editor and see results instantly as you code.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h3>Version Control</h3>
              <p>Built-in Git integration to manage your code versions with ease.</p>
            </div>
          </div>
        </div>
        
        <div className="ai-assistant-section">
          <div className="section-content">
            <h2>AI-Powered Code Assistant</h2>
            <p>
              Write better code faster with our intelligent AI assistant. Get smart
              suggestions, automatic code improvements, and help solving complex 
              programming problems - all integrated directly into your workflow.
            </p>
            <ul className="ai-features-list">
              <li>
                <span className="check-icon">✓</span>
                <span>Smart code completion</span>
              </li>
              <li>
                <span className="check-icon">✓</span>
                <span>Code optimization suggestions</span>
              </li>
              <li>
                <span className="check-icon">✓</span>
                <span>Bug detection and fixes</span>
              </li>
              <li>
                <span className="check-icon">✓</span>
                <span>Natural language code generation</span>
              </li>
            </ul>
            <button className="ai-cta-button" onClick={handleGetStarted}>Try AI Assistant</button>
          </div>
          <div className="ai-illustration">
            <div className="ai-chat-interface">
              <div className="ai-chat-header">
                <span>🤖 AI Assistant</span>
              </div>
              <div className="ai-chat-messages">
                <div className="user-message">
                  <span className="message-label">You:</span>
                  <div className="message-content">Can you optimize this function for better performance?</div>
                </div>
                <div className="ai-message">
                  <span className="message-label">AI:</span>
                  <div className="message-content">
                    I analyzed your code and found a few optimization opportunities:
                    <ol>
                      <li>Replace the nested loops with a single map operation</li>
                      <li>Use a Set instead of Array for O(1) lookups</li>
                      <li>Cache repeated calculations outside the loop</li>
                    </ol>
                    Here's the improved version...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            Geist<span>Editor</span>
          </div>
          
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <ul>
                <li><a href="#">Features</a></li>
                <li><a href="#">Pricing</a></li>
                <li><a href="#">AI Assistant</a></li>
                <li><a href="#">Download</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4>Resources</h4>
              <ul>
                <li><a href="#">Documentation</a></li>
                <li><a href="#">API Reference</a></li>
                <li><a href="#">Tutorials</a></li>
                <li><a href="#">Blog</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4>Company</h4>
              <ul>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#">Legal</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4>Connect</h4>
              <ul className="social-links">
                <li><a href="#">Twitter</a></li>
                <li><a href="#">GitHub</a></li>
                <li><a href="#">Discord</a></li>
                <li><a href="#">LinkedIn</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 GeistEditor. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;