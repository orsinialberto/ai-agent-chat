import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteChatModal } from '../DeleteChatModal';

describe('DeleteChatModal', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <DeleteChatModal
        isOpen={false}
        chatTitle="Test Chat"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByText('Delete Chat')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <DeleteChatModal
        isOpen={true}
        chatTitle="Test Chat"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Delete Chat')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete "Test Chat"?')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone and will permanently remove all messages in this chat.')).toBeInTheDocument();
  });

  it('should call onCancel when Cancel button is clicked', () => {
    render(
      <DeleteChatModal
        isOpen={true}
        chatTitle="Test Chat"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should call onConfirm when Delete button is clicked', () => {
    render(
      <DeleteChatModal
        isOpen={true}
        chatTitle="Test Chat"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('should call onCancel when backdrop is clicked', () => {
    render(
      <DeleteChatModal
        isOpen={true}
        chatTitle="Test Chat"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const backdrop = screen.getByRole('button', { hidden: true }); // The backdrop div
    fireEvent.click(backdrop);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should call onCancel when Escape key is pressed', () => {
    render(
      <DeleteChatModal
        isOpen={true}
        chatTitle="Test Chat"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should prevent body scroll when modal is open', () => {
    render(
      <DeleteChatModal
        isOpen={true}
        chatTitle="Test Chat"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should restore body scroll when modal is closed', () => {
    const { unmount } = render(
      <DeleteChatModal
        isOpen={true}
        chatTitle="Test Chat"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    unmount();

    expect(document.body.style.overflow).toBe('unset');
  });

  it('should display chat title in confirmation message', () => {
    render(
      <DeleteChatModal
        isOpen={true}
        chatTitle="My Special Chat"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Are you sure you want to delete "My Special Chat"?')).toBeInTheDocument();
  });
});
