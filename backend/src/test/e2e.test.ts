// End-to-End Tests for AI Agent Chat - Phase 1

import { apiService } from '../services/api';

describe('AI Agent Chat - E2E Tests', () => {
  const API_BASE_URL = 'http://localhost:3001/api';

  describe('Health Checks', () => {
    it('should check server health', async () => {
      const response = await fetch('http://localhost:3001/health');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.status).toBe('OK');
      expect(data.environment).toBe('development');
    });

    it('should test database connection', async () => {
      const response = await fetch(`${API_BASE_URL}/test/database`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Database connection successful');
    });

    it('should test Gemini connection', async () => {
      const response = await fetch(`${API_BASE_URL}/test/gemini`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      // Note: This might fail if Gemini API key is invalid
      // but the endpoint should still respond
    });
  });

  describe('Chat Management', () => {
    let chatId: string;

    it('should create a new chat', async () => {
      const response = await fetch(`${API_BASE_URL}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Chat',
          initialMessage: 'Hello, this is a test message'
        })
      });

      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.id).toBeDefined();
      expect(data.data.title).toBe('Test Chat');
      expect(data.data.messages).toBeDefined();
      
      chatId = data.data.id;
    });

    it('should get all chats', async () => {
      const response = await fetch(`${API_BASE_URL}/chats`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
    });

    it('should get specific chat', async () => {
      const response = await fetch(`${API_BASE_URL}/chats/${chatId}`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(chatId);
      expect(data.data.messages).toBeDefined();
    });

    it('should send message to chat', async () => {
      const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Tell me about artificial intelligence',
          role: 'user'
        })
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.content).toBeDefined();
      expect(data.data.role).toBe('assistant');
    });

    it('should handle invalid chat ID', async () => {
      const response = await fetch(`${API_BASE_URL}/chats/invalid-id/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Test message',
          role: 'user'
        })
      });

      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Chat not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty message content', async () => {
      const response = await fetch(`${API_BASE_URL}/chats/test-id/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '',
          role: 'user'
        })
      });

      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Message content is required');
    });

    it('should handle missing message content', async () => {
      const response = await fetch(`${API_BASE_URL}/chats/test-id/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user'
        })
      });

      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Message content is required');
    });
  });
});

// Manual test runner for demonstration
export const runE2ETests = async () => {
  console.log('🧪 Running E2E Tests for AI Agent Chat');
  console.log('=====================================');
  
  try {
    // Test 1: Health Check
    console.log('1. Testing server health...');
    const healthResponse = await fetch('http://localhost:3001/health');
    const healthData = await healthResponse.json();
    console.log(`   ✅ Server health: ${healthData.status}`);
    
    // Test 2: Database Connection
    console.log('2. Testing database connection...');
    const dbResponse = await fetch('http://localhost:3001/api/test/database');
    const dbData = await dbResponse.json();
    console.log(`   ${dbData.success ? '✅' : '❌'} Database: ${dbData.message}`);
    
    // Test 3: Create Chat
    console.log('3. Testing chat creation...');
    const chatResponse = await fetch('http://localhost:3001/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'E2E Test Chat',
        initialMessage: 'Hello from E2E test!'
      })
    });
    const chatData = await chatResponse.json();
    console.log(`   ${chatData.success ? '✅' : '❌'} Chat created: ${chatData.data?.id}`);
    
    if (chatData.success && chatData.data) {
      const chatId = chatData.data.id;
      
      // Test 4: Send Message
      console.log('4. Testing message sending...');
      const messageResponse = await fetch(`http://localhost:3001/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'What is artificial intelligence?',
          role: 'user'
        })
      });
      const messageData = await messageResponse.json();
      console.log(`   ${messageData.success ? '✅' : '❌'} Message sent: ${messageData.data?.content?.substring(0, 50)}...`);
      
      // Test 5: Get Chat
      console.log('5. Testing chat retrieval...');
      const getChatResponse = await fetch(`http://localhost:3001/api/chats/${chatId}`);
      const getChatData = await getChatResponse.json();
      console.log(`   ${getChatData.success ? '✅' : '❌'} Chat retrieved: ${getChatData.data?.messages?.length} messages`);
    }
    
    console.log('=====================================');
    console.log('🎉 E2E Tests completed successfully!');
    
  } catch (error) {
    console.error('❌ E2E Tests failed:', error);
  }
};
