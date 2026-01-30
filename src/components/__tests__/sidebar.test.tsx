import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock next/navigation
const mockPathname = vi.fn().mockReturnValue('/dashboard');
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import { Sidebar } from '../layout/sidebar';

describe('Sidebar', () => {
  beforeEach(() => {
    mockPathname.mockReturnValue('/dashboard');
  });

  it('renders all navigation items', () => {
    render(<Sidebar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Sends')).toBeInTheDocument();
    expect(screen.getByText('Gift Catalog')).toBeInTheDocument();
    expect(screen.getByText('Recipients')).toBeInTheDocument();
    expect(screen.getByText('Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Budget')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Integrations')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders the app logo', () => {
    render(<Sidebar />);

    expect(screen.getByText('Juniply')).toBeInTheDocument();
  });

  it('highlights the active navigation item', () => {
    mockPathname.mockReturnValue('/sends');
    render(<Sidebar />);

    const sendsLink = screen.getByText('Sends').closest('a');
    expect(sendsLink?.className).toContain('bg-primary');

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink?.className).toContain('text-muted-foreground');
  });

  it('highlights parent route for nested paths', () => {
    mockPathname.mockReturnValue('/campaigns/campaign-123/edit');
    render(<Sidebar />);

    const campaignsLink = screen.getByText('Campaigns').closest('a');
    expect(campaignsLink?.className).toContain('bg-primary');
  });

  it('collapses when toggle button is clicked', () => {
    render(<Sidebar />);

    // Should show nav labels when expanded
    expect(screen.getByText('Dashboard')).toBeVisible();
    expect(screen.getByText('Juniply')).toBeInTheDocument();

    // Click the collapse toggle button
    const collapseButton = screen.getByRole('button');
    fireEvent.click(collapseButton);

    // Nav labels should be hidden when collapsed
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Juniply')).not.toBeInTheDocument();
  });

  it('expands when toggle button is clicked again', () => {
    render(<Sidebar />);

    const collapseButton = screen.getByRole('button');

    // Collapse
    fireEvent.click(collapseButton);
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();

    // Expand
    fireEvent.click(collapseButton);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Juniply')).toBeInTheDocument();
  });

  it('links to correct routes', () => {
    render(<Sidebar />);

    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/dashboard');
    expect(screen.getByText('Settings').closest('a')).toHaveAttribute('href', '/settings');
    expect(screen.getByText('Budget').closest('a')).toHaveAttribute('href', '/budget');
  });
});
