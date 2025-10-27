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
    expect(screen.getByTitle('New Chat')).toBeInTheDocument();
    expect(screen.getByText('Test Chat 1')).toBeInTheDocument();
    expect(screen.getByText('Test Chat 2')).toBeInTheDocument();
  });

  it('should show close button when onToggle is provided', () => {
    const { container } = render(
      <Sidebar
        currentChatId="1"
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );
    const footerButtons = container.querySelectorAll('.lg\\:hidden');
    // When onToggle is provided and sidebar is open, we expect footer content
    expect(footerButtons.length).toBeGreaterThan(0);
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

    // When onToggle is not provided, there should be no clickable close button in footer
    const footerButtons = document.querySelectorAll('button.lg\\:hidden');
    expect(footerButtons.length).toBe(0);
  });

  it('should call onToggle when close button is clicked', () => {
    const { container } = render(
      <Sidebar
        currentChatId="1"
        onChatSelect={mockOnChatSelect}
        onNewChat={mockOnNewChat}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    const closeButton = container.querySelector('button.lg\\:hidden');
    if (closeButton) {
      fireEvent.click(closeButton);
    }

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

    const overlay = document.querySelector('.fixed.inset-0.bg-black.z-40');
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

    const overlay = document.querySelector('.fixed.inset-0.bg-black.z-40');
    expect(overlay).not.toBeInTheDocument();
  });
});
