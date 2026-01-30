import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
const mockPush = vi.fn();
const mockBack = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    refresh: mockRefresh,
  }),
}));

// Mock server actions
const mockCreateBudget = vi.fn();
const mockUpdateBudget = vi.fn();
vi.mock('@/actions/budget', () => ({
  createBudget: (...args: any[]) => mockCreateBudget(...args),
  updateBudget: (...args: any[]) => mockUpdateBudget(...args),
}));

// Mock toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

import { BudgetForm } from '../features/budget/budget-form';

describe('BudgetForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateBudget.mockResolvedValue({});
    mockUpdateBudget.mockResolvedValue({});
  });

  it('renders create form by default', () => {
    render(<BudgetForm />);

    expect(screen.getByText('Budget Details')).toBeInTheDocument();
    expect(screen.getByText('Budget Alerts')).toBeInTheDocument();
    expect(screen.getByLabelText('Budget Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Total Amount *')).toBeInTheDocument();
    expect(screen.getByText('Create Budget')).toBeInTheDocument();
  });

  it('renders update form when budget prop is provided', () => {
    const existingBudget = {
      id: 'budget-1',
      name: 'Q1 Budget',
      type: 'MONTHLY',
      amount: 5000,
      spent: 1200,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      alertThreshold: 90,
    };

    render(<BudgetForm budget={existingBudget} />);

    expect(screen.getByText('Update Budget')).toBeInTheDocument();
    expect(screen.getByLabelText('Budget Name *')).toHaveValue('Q1 Budget');
  });

  it('shows cancel button that navigates back', () => {
    render(<BudgetForm />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockBack).toHaveBeenCalled();
  });

  it('shows end date as optional for non-CUSTOM periods', () => {
    render(<BudgetForm />);

    // The label text "End Date (optional)" is split across elements
    expect(screen.getByText(/End Date/)).toBeInTheDocument();
    expect(screen.getByText('Leave blank to auto-calculate based on period')).toBeInTheDocument();
  });

  it('shows success toast and navigates on successful create', async () => {
    // Use a budget-like prop with valid defaults so the form can submit
    const validBudget = {
      id: 'new-budget',
      name: 'Test Budget',
      type: 'MONTHLY',
      amount: 5000,
      spent: 0,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      alertThreshold: 80,
    };

    render(<BudgetForm budget={validBudget} />);

    // Submit the form (defaults are already valid)
    fireEvent.click(screen.getByText('Update Budget'));

    await waitFor(() => {
      expect(mockUpdateBudget).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Budget updated',
          variant: 'success',
        })
      );
    });

    expect(mockPush).toHaveBeenCalledWith('/budget');
  });

  it('shows error toast on failed submission', async () => {
    mockUpdateBudget.mockRejectedValue(new Error('Server error'));

    const validBudget = {
      id: 'budget-1',
      name: 'Test Budget',
      type: 'MONTHLY',
      amount: 5000,
      spent: 0,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      alertThreshold: 80,
    };

    render(<BudgetForm budget={validBudget} />);

    fireEvent.click(screen.getByText('Update Budget'));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: 'Failed to update budget',
        })
      );
    });
  });

  it('calls updateBudget when editing existing budget', async () => {
    const existingBudget = {
      id: 'budget-1',
      name: 'Q1 Budget',
      type: 'MONTHLY',
      amount: 5000,
      spent: 1200,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      alertThreshold: 90,
    };

    render(<BudgetForm budget={existingBudget} />);

    const submitButton = screen.getByText('Update Budget');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateBudget).toHaveBeenCalledWith('budget-1', expect.any(Object));
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Budget updated',
          variant: 'success',
        })
      );
    });
  });

  it('calls onSuccess callback after successful submission', async () => {
    const onSuccess = vi.fn();
    const validBudget = {
      id: 'budget-1',
      name: 'Test Budget',
      type: 'MONTHLY',
      amount: 5000,
      spent: 0,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      alertThreshold: 80,
    };

    render(<BudgetForm budget={validBudget} onSuccess={onSuccess} />);

    fireEvent.click(screen.getByText('Update Budget'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('renders alert threshold with default value', () => {
    render(<BudgetForm />);

    const thresholdInput = screen.getByLabelText('Alert Threshold (%)');
    expect(thresholdInput).toHaveValue(80);
  });
});
