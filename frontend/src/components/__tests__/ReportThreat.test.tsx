import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ReportThreat } from '../ReportThreat';
import { storageService } from '../../services/storageService';
import { Analytics } from '../../utils/analytics';

// Mock dependencies
vi.mock('../../services/storageService');
vi.mock('../../utils/analytics');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ReportThreat Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the report form', () => {
    renderWithRouter(<ReportThreat />);

    expect(screen.getByText('Report a Threat')).toBeInTheDocument();
    expect(screen.getByLabelText('Category *')).toBeInTheDocument();
    expect(screen.getByLabelText('Description *')).toBeInTheDocument();
    expect(screen.getByLabelText('Submit anonymously')).toBeInTheDocument();
  });

  it('submits report successfully', async () => {
    const mockNavigate = vi.fn();
    vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);

    (storageService.addReport as any).mockResolvedValue(undefined);

    renderWithRouter(<ReportThreat />);

    // Fill form
    fireEvent.change(screen.getByLabelText('Category *'), {
      target: { value: 'harassment' }
    });
    fireEvent.change(screen.getByLabelText('Description *'), {
      target: { value: 'Test description' }
    });

    // Submit
    fireEvent.click(screen.getByText('Submit Report'));

    await waitFor(() => {
      expect(storageService.addReport).toHaveBeenCalledWith({
        category: 'harassment',
        description: 'Test description',
        anonymous: true
      });
      expect(Analytics.reportSubmitted).toHaveBeenCalledWith('harassment', true);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows error on submission failure', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    (storageService.addReport as any).mockRejectedValue(new Error('Submission failed'));

    renderWithRouter(<ReportThreat />);

    fireEvent.change(screen.getByLabelText('Category *'), {
      target: { value: 'harassment' }
    });
    fireEvent.change(screen.getByLabelText('Description *'), {
      target: { value: 'Test description' }
    });

    fireEvent.click(screen.getByText('Submit Report'));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Failed to submit report. Please try again.');
    });

    alertMock.mockRestore();
  });

  it('validates required fields', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderWithRouter(<ReportThreat />);

    fireEvent.click(screen.getByText('Submit Report'));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Please fill in all required fields.');
    });

    alertMock.mockRestore();
  });
});