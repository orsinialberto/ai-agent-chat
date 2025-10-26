import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from '../Sidebar';

// Mock the useSidebar hook
vi.mock('../../../hooks/useSidebar', () => ({
  useSidebar: () => ({
    chats: [
      {
        id: '1',
        title: 'Test Chat 1',
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: []
      },
      {
        id: '2',
        title: 'Test Chat 2',
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: []
      }
    ],
    isLoading: false,
    error: null,
    selectChat: vi.fn(),
    updateChatTitle: vi.fn(),
    deleteChat: vi.fn(),
    createNewChat: vi.fn(),
    clearError: vi.fn()
  })
}));

describe('Sidebar', () => {
  const mockOnChatSelect = vi.fn();
  const mockOnNewChat = vi.fn();
  const mockOnToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render sidebar with chat list', () => {
    render(
      <Sidebar
        currentChatId="1"
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText('Chats')).toBeInTheDocument();
    expect(screen.getByText('New Chat')).toBeInTheDocument();
    expect(screen.getByText('Test Chat 1')).toBeInTheDocument();
    expect(screen.getByText('Test Chat 2')).toBeInTheDocument();
  });

  it('should show close button on mobile when onToggle is provided', () => {
    render(
      <Sidebar
        currentChatId="1"
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('should not show close button when onToggle is not provided', () => {
    render(
      <Sidebar
        currentChatId="1"
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
        isOpen={true}
      />
    );

    const closeButton = screen.queryByRole('button', { name: /close/i });
    expect(closeButton).not.toBeInTheDocument();
  });

  it('should call onToggle when close button is clicked', () => {
    render(
      <Sidebar
        currentChatId="1"
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('should show mobile overlay when open', () => {
    render(
      <Sidebar
        currentChatId="1"
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    const overlay = screen.getByRole('button', { hidden: true }); // The overlay div
    expect(overlay).toBeInTheDocument();
  });

  it('should not show mobile overlay when closed', () => {
    render(
      <Sidebar
        currentChatId="1"
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
        isOpen={false}
        onToggle={mockOnToggle}
      />
    );

    const overlay = screen.queryByRole('button', { hidden: true });
    expect(overlay).not.toBeInTheDocument();
  });
});
