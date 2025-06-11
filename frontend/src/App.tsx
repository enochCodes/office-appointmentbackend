import React, { useEffect } from 'react';
import Header from './Header';
import Main from './Main';
import Footer from './Footer';
import './index.css'; // Main CSS with Tailwind directives

const App: React.FC = () => {
  useEffect(() => {
    console.log('Document loaded. Frontend is ready! (React version)');
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 text-gray-800 font-sans">
      <Header />
      <main className="flex-grow"> {/* Use flex-grow to push footer down */}
        <Main />
      </main>
      <Footer />
    </div>
  );
}

export default App;
