import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 text-center py-6 border-t border-gray-300 mt-auto">
      <p className="text-gray-600">&copy; {new Date().getFullYear()} Appointment System. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
