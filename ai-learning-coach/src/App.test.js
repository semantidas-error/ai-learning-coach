import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock the global fetch function
global.fetch = jest.fn();

// Mock window.alert
global.alert = jest.fn();

describe('App Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    alert.mockClear();
  });

  test('renders the initial UI correctly', () => {
    render(<App />);
    
    expect(screen.getByText('🤖 AI Learning Coach Dashboard')).toBeInTheDocument();
    expect(screen.getByLabelText('Paste your quiz answers or summary of understanding here:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit to AI Coach' })).toBeInTheDocument();
    expect(screen.queryByText('Call 1: Performance Score')).not.toBeInTheDocument();
  });

  test('allows the user to type in the textarea', () => {
    render(<App />);
    const textarea = screen.getByLabelText('Paste your quiz answers or summary of understanding here:');
    
    fireEvent.change(textarea, { target: { value: 'This is a test answer.' } });
    
    expect(textarea.value).toBe('This is a test answer.');
  });

  test('handles successful form submission and displays results', async () => {
    const mockSuccessResponse = {
      score: 85,
      responseType: 'advanced_challenge',
      message: 'You have a good grasp of the basics. Here is a challenge for you.',
      roadmap: ['Learn advanced topic A', 'Practice with project B', 'Review concept C'],
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse,
    });

    render(<App />);

    const textarea = screen.getByLabelText('Paste your quiz answers or summary of understanding here:');
    const submitButton = screen.getByRole('button', { name: 'Submit to AI Coach' });

    fireEvent.change(textarea, { target: { value: 'This is a test for success.' } });
    fireEvent.click(submitButton);

    // Check for loading state
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Evaluating via AI...')).toBeInTheDocument();

    // Wait for the results to be displayed
    await waitFor(() => {
      expect(screen.getByText('Call 1: Performance Score')).toBeInTheDocument();
    });

    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('🟢 Advanced Challenge Path')).toBeInTheDocument();
    expect(screen.getByText('You have a good grasp of the basics. Here is a challenge for you.')).toBeInTheDocument();
    expect(screen.getByText('Learn advanced topic A')).toBeInTheDocument();
    expect(screen.getByText('Practice with project B')).toBeInTheDocument();
    expect(screen.getByText('Review concept C')).toBeInTheDocument();
    
    // Check if loading state is removed
    expect(submitButton).not.toBeDisabled();
  });

  test('handles network error during form submission', async () => {
    // Spy on console.error to check if it's called
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    fetch.mockRejectedValueOnce(new Error('Network response error'));

    render(<App />);

    const textarea = screen.getByLabelText('Paste your quiz answers or summary of understanding here:');
    const submitButton = screen.getByRole('button', { name: 'Submit to AI Coach' });

    fireEvent.change(textarea, { target: { value: 'This is a test for error.' } });
    fireEvent.click(submitButton);

    // Wait for the alert to be called
    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith('Failed to connect to the AI backend.');
    });

    // Check that console.error was called with the expected error
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error contacting AI Coach:', expect.any(Error));
    
    // Ensure no results are displayed
    expect(screen.queryByText('Call 1: Performance Score')).not.toBeInTheDocument();

    // Check if loading state is removed
    expect(submitButton).not.toBeDisabled();

    // Clean up spy
    consoleErrorSpy.mockRestore();
  });
});
