import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSidebar } from '../useSidebar';
import { apiService } from '../../services/api';

// Mock the API service
vi.mock('../../services/api', () => ({
  apiService: {
    getChats: vi.fn(),
    getChat: vi.fn(),
    updateChat: vi.fn(),
    deleteChat: vi.fn(),
    createChat: vi.fn(),
  }
}));

const mockApiService = vi.mocked(apiService);

describe('useSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load chats on mount', async () => {
    const mockChats = [
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
    ];

    mockApiService.getChats.mockResolvedValue({
      success: true,
      data: mockChats
    });

    const { result } = renderHook(() => useSidebar());

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.chats).toEqual(mockChats);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle error when loading chats fails', async () => {
    mockApiService.getChats.mockResolvedValue({
      success: false,
      error: 'Failed to load chats'
    });

    const { result } = renderHook(() => useSidebar());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.chats).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Failed to load chats');
  });

  it('should create new chat successfully', async () => {
    const newChat = {
      id: '3',
      title: 'New Chat',
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: []
    };

    mockApiService.createChat.mockResolvedValue({
      success: true,
      data: newChat
    });

    const { result } = renderHook(() => useSidebar());

    let createdChat;
    await act(async () => {
      createdChat = await result.current.createNewChat();
    });

    expect(createdChat).toEqual(newChat);
    expect(result.current.chats).toContain(newChat);
  });

  it('should update chat title successfully', async () => {
    const existingChat = {
      id: '1',
      title: 'Old Title',
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: []
    };

    const updatedChat = {
      ...existingChat,
      title: 'New Title'
    };

    mockApiService.updateChat.mockResolvedValue({
      success: true,
      data: updatedChat
    });

    const { result } = renderHook(() => useSidebar());

    // Set initial state
    act(() => {
      result.current.chats = [existingChat];
    });

    await act(async () => {
      await result.current.updateChatTitle('1', 'New Title');
    });

    expect(mockApiService.updateChat).toHaveBeenCalledWith('1', 'New Title');
  });

  it('should delete chat successfully', async () => {
    const chatToDelete = {
      id: '1',
      title: 'Chat to Delete',
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: []
    };

    mockApiService.deleteChat.mockResolvedValue({
      success: true,
      data: { message: 'Chat deleted successfully' }
    });

    const { result } = renderHook(() => useSidebar());

    // Set initial state
    act(() => {
      result.current.chats = [chatToDelete];
    });

    await act(async () => {
      await result.current.deleteChat('1');
    });

    expect(mockApiService.deleteChat).toHaveBeenCalledWith('1');
    expect(result.current.chats).not.toContain(chatToDelete);
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useSidebar());

    act(() => {
      result.current.error = 'Some error';
    });

    expect(result.current.error).toBe('Some error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });
});
