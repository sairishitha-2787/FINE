import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { MoodProvider } from '../contexts/MoodContext';

// Mock the contexts
const MockApp = () => (
  <BrowserRouter>
    <AuthProvider>
      <ThemeProvider>
        <MoodProvider>
          <App />
        </MoodProvider>
      </ThemeProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<MockApp />);
  });

  it('renders the landing page by default', () => {
    render(<MockApp />);
    // The landing page should contain the main heading
    expect(screen.getByText(/FINE/i)).toBeInTheDocument();
  });

  it('has proper routing structure', () => {
    render(<MockApp />);
    // Check if the main navigation elements are present
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
