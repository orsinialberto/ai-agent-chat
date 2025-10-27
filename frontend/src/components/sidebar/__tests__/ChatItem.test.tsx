import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatItem } from '../ChatItem';
import { Chat } from '../../../services/api';

const mockChat: Chat = {
  id: '1',
  title: 'Test Chat',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  messages: [
    {
      id: '1',
      chatId: '1',
      role: 'user',
      content: 'Hello, this is a test message',
      createdAt: new Date('2024-01-01')
    }
  ]
};

describe('ChatItem', () => {
  const mockOnSelect = vi.fn();
  const mockOnUpdateTitle = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render chat item with title and last message', () => {
    render(
      <ChatItem
        chat={mockChat}
        isActive={false}
        onSelect={mockOnSelect}
        onUpdateTitle={mockOnUpdateTitle}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Test Chat')).toBeInTheDocument();
    expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
  });

  it('should show active state when isActive is true', () => {
    const { container } = render(
      <ChatItem
        chat={mockChat}
        isActive={true}
        onSelect={mockOnSelect}
        onUpdateTitle={mockOnUpdateTitle}
        onDelete={mockOnDelete}
      />
    );

    // Find the outer div that has the background color class
    const chatItem = container.querySelector('.bg-sky-100\\/50');
    expect(chatItem).toBeInTheDocument();
    expect(chatItem).toHaveClass('bg-sky-100/50');
  });

  it('should call onSelect when clicked', () => {
    render(
      <ChatItem
        chat={mockChat}
        isActive={false}
        onSelect={mockOnSelect}
        onUpdateTitle={mockOnUpdateTitle}
        onDelete={mockOnDelete}
      />
    );

    const chatItem = screen.getByText('Test Chat').closest('div');
    fireEvent.click(chatItem!);

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('should enter edit mode when edit button is clicked', async () => {
    render(
      <ChatItem
        chat={mockChat}
        isActive={false}
        onSelect={mockOnSelect}
        onUpdateTitle={mockOnUpdateTitle}
        onDelete={mockOnDelete}
      />
    );

    // Hover to show action buttons
    const chatItem = screen.getByText('Test Chat').closest('div');
    fireEvent.mouseEnter(chatItem!);

    // Wait for edit button to appear
    await waitFor(() => {
      const editButton = screen.getByTitle('Rename chat');
      expect(editButton).toBeInTheDocument();
    });

    const editButton = screen.getByTitle('Rename chat');
    fireEvent.click(editButton);

    // Should show input field
    const input = screen.getByDisplayValue('Test Chat');
    expect(input).toBeInTheDocument();
  });

  it('should save title when form is submitted', async () => {
    render(
      <ChatItem
        chat={mockChat}
        isActive={false}
        onSelect={mockOnSelect}
        onUpdateTitle={mockOnUpdateTitle}
        onDelete={mockOnDelete}
      />
    );

    // Enter edit mode
    const chatItem = screen.getByText('Test Chat').closest('div');
    fireEvent.mouseEnter(chatItem!);

    await waitFor(() => {
      const editButton = screen.getByTitle('Rename chat');
      fireEvent.click(editButton);
    });

    // Change title
    const input = screen.getByDisplayValue('Test Chat');
    fireEvent.change(input, { target: { value: 'New Title' } });
    fireEvent.submit(input);

    expect(mockOnUpdateTitle).toHaveBeenCalledWith('New Title');
  });

  it('should cancel editing when Escape key is pressed', async () => {
    render(
      <ChatItem
        chat={mockChat}
        isActive={false}
        onSelect={mockOnSelect}
        onUpdateTitle={mockOnUpdateTitle}
        onDelete={mockOnDelete}
      />
    );

    // Enter edit mode
    const chatItem = screen.getByText('Test Chat').closest('div');
    fireEvent.mouseEnter(chatItem!);

    await waitFor(() => {
      const editButton = screen.getByTitle('Rename chat');
      fireEvent.click(editButton);
    });

    // Press Escape
    const input = screen.getByDisplayValue('Test Chat');
    fireEvent.keyDown(input, { key: 'Escape' });

    // Should exit edit mode
    expect(screen.getByText('Test Chat')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Test Chat')).not.toBeInTheDocument();
  });

  it('should show delete modal when delete button is clicked', async () => {
    render(
      <ChatItem
        chat={mockChat}
        isActive={false}
        onSelect={mockOnSelect}
        onUpdateTitle={mockOnUpdateTitle}
        onDelete={mockOnDelete}
      />
    );

    // Hover to show action buttons
    const chatItem = screen.getByText('Test Chat').closest('div');
    fireEvent.mouseEnter(chatItem!);

    // Wait for delete button to appear
    await waitFor(() => {
      const deleteButton = screen.getByTitle('Delete chat');
      expect(deleteButton).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Delete chat');
    fireEvent.click(deleteButton);

    // Should show delete modal
    expect(screen.getByText('Delete Chat')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete', { exact: false })).toBeInTheDocument();
    // The title appears in the modal
    const modalContent = screen.getByText('This action cannot be undone', { exact: false });
    expect(modalContent).toBeInTheDocument();
  });

  it('should handle chat without title', () => {
    const chatWithoutTitle = { ...mockChat, title: undefined };

    render(
      <ChatItem
        chat={chatWithoutTitle}
        isActive={false}
        onSelect={mockOnSelect}
        onUpdateTitle={mockOnUpdateTitle}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Untitled Chat')).toBeInTheDocument();
  });

  it('should handle chat without messages', () => {
    const chatWithoutMessages = { ...mockChat, messages: [] };

    render(
      <ChatItem
        chat={chatWithoutMessages}
        isActive={false}
        onSelect={mockOnSelect}
        onUpdateTitle={mockOnUpdateTitle}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('No messages yet')).toBeInTheDocument();
  });
});
