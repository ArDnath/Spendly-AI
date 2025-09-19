import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Import API route handlers
import { GET as getHealth } from '../app/api/health/route';
import { GET as getKeys, POST as postKeys } from '../app/api/keys/route';
import { GET as getUsageSummary } from '../app/api/dashboard/usage-summary/route';
import { GET as getBudgets, POST as postBudgets } from '../app/api/budgets/route';
import { GET as getAlerts, POST as postAlerts } from '../app/api/alerts/route';
import { GET as getOrganizations, POST as postOrganizations } from '../app/api/organizations/route';
import { GET as getProjects, POST as postProjects } from '../app/api/projects/route';

const prisma = new PrismaClient();

// Mock NextAuth session
const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User'
  }
};

// Mock getServerSession
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(() => Promise.resolve(mockSession))
}));

describe('API Endpoints Integration Tests', () => {
  let testUserId: string;
  let testApiKeyId: string;
  let testOrganizationId: string;
  let testProjectId: string;

  beforeAll(async () => {
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User'
      }
    });
    testUserId = testUser.id;

    // Create test organization
    const testOrg = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        description: 'Test organization for API testing',
        members: {
          create: {
            userId: testUserId,
            role: 'OWNER'
          }
        }
      }
    });
    testOrganizationId = testOrg.id;

    // Create test project
    const testProject = await prisma.project.create({
      data: {
        name: 'Test Project',
        description: 'Test project for API testing',
        organizationId: testOrganizationId
      }
    });
    testProjectId = testProject.id;

    // Create test API key
    const testApiKey = await prisma.apiKey.create({
      data: {
        userId: testUserId,
        provider: 'openai',
        encryptedKey: 'encrypted-test-key',
        name: 'Test API Key',
        lastUsed: new Date(),
        projectId: testProjectId
      }
    });
    testApiKeyId = testApiKey.id;

    // Create test usage data
    await prisma.usage.create({
      data: {
        apiKeyId: testApiKeyId,
        userId: testUserId,
        provider: 'openai',
        endpoint: 'chat/completions',
        modelUsed: 'gpt-4',
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        requests: 1,
        cost: 0.003,
        date: new Date(),
        projectId: testProjectId
      }
    });

    // Create provider rates
    await prisma.providerRate.create({
      data: {
        provider: 'openai',
        model: 'gpt-4',
        inputTokenPrice: 0.00003,
        outputTokenPrice: 0.00006,
        effectiveDate: new Date()
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.usage.deleteMany({ where: { userId: testUserId } });
    await prisma.apiKey.deleteMany({ where: { userId: testUserId } });
    await prisma.project.deleteMany({ where: { organizationId: testOrganizationId } });
    await prisma.organizationMember.deleteMany({ where: { userId: testUserId } });
    await prisma.organization.deleteMany({ where: { id: testOrganizationId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.providerRate.deleteMany({ where: { provider: 'openai' } });
    await prisma.$disconnect();
  });

  describe('Health Check API', () => {
    it('should return system health status', async () => {
      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await getHealth(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('database');
      expect(data).toHaveProperty('backgroundJobs');
      expect(data).toHaveProperty('circuitBreakers');
    });
  });

  describe('API Keys Management', () => {
    it('should list API keys for authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/keys');
      const response = await getKeys(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('keys');
      expect(Array.isArray(data.keys)).toBe(true);
      expect(data.keys.length).toBeGreaterThan(0);
      expect(data.keys[0]).toHaveProperty('id');
      expect(data.keys[0]).toHaveProperty('name');
      expect(data.keys[0]).toHaveProperty('provider');
      expect(data.keys[0]).not.toHaveProperty('encryptedKey'); // Should not expose encrypted key
    });

    it('should create new API key', async () => {
      const requestBody = {
        provider: 'openai',
        apiKey: 'sk-test-key-123',
        name: 'New Test Key',
        description: 'Test key for API testing',
        projectId: testProjectId
      };

      const request = new NextRequest('http://localhost:3000/api/keys', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await postKeys(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('key');
      expect(data.key).toHaveProperty('id');
      expect(data.key.name).toBe(requestBody.name);
      expect(data.key.provider).toBe(requestBody.provider);

      // Clean up
      await prisma.apiKey.delete({ where: { id: data.key.id } });
    });

    it('should validate API key creation input', async () => {
      const invalidRequestBody = {
        provider: 'invalid-provider',
        apiKey: '',
        name: ''
      };

      const request = new NextRequest('http://localhost:3000/api/keys', {
        method: 'POST',
        body: JSON.stringify(invalidRequestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await postKeys(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Usage Summary API', () => {
    it('should return usage summary for authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/dashboard/usage-summary');
      const response = await getUsageSummary(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('currentMonth');
      expect(data).toHaveProperty('projectedMonth');
      expect(data).toHaveProperty('dailyAverage');
      expect(data).toHaveProperty('trends');
      expect(data.currentMonth).toHaveProperty('cost');
      expect(data.currentMonth).toHaveProperty('tokens');
      expect(data.currentMonth).toHaveProperty('requests');
    });

    it('should handle date range filters', async () => {
      const request = new NextRequest('http://localhost:3000/api/dashboard/usage-summary?startDate=2024-01-01&endDate=2024-12-31');
      const response = await getUsageSummary(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('currentMonth');
    });
  });

  describe('Budget Management API', () => {
    it('should list budgets for authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/budgets');
      const response = await getBudgets(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('budgets');
      expect(Array.isArray(data.budgets)).toBe(true);
    });

    it('should create new budget', async () => {
      const requestBody = {
        name: 'Test Budget',
        amount: 100,
        period: 'MONTHLY',
        scope: 'USER',
        hardLimit: false
      };

      const request = new NextRequest('http://localhost:3000/api/budgets', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await postBudgets(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('budget');
      expect(data.budget.name).toBe(requestBody.name);
      expect(data.budget.amount).toBe(requestBody.amount);

      // Clean up
      await prisma.budget.delete({ where: { id: data.budget.id } });
    });
  });

  describe('Alerts Management API', () => {
    it('should list alerts for authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/alerts');
      const response = await getAlerts(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('alerts');
      expect(Array.isArray(data.alerts)).toBe(true);
    });

    it('should create new alert', async () => {
      const requestBody = {
        name: 'Test Alert',
        type: 'COST',
        threshold: 50,
        comparison: 'GREATER_THAN',
        period: 'DAILY',
        channelIds: []
      };

      const request = new NextRequest('http://localhost:3000/api/alerts', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await postAlerts(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('alert');
      expect(data.alert.name).toBe(requestBody.name);
      expect(data.alert.type).toBe(requestBody.type);

      // Clean up
      await prisma.alert.delete({ where: { id: data.alert.id } });
    });
  });

  describe('Organization Management API', () => {
    it('should list organizations for authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/organizations');
      const response = await getOrganizations(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('organizations');
      expect(Array.isArray(data.organizations)).toBe(true);
      expect(data.organizations.length).toBeGreaterThan(0);
    });

    it('should create new organization', async () => {
      const requestBody = {
        name: 'New Test Organization',
        description: 'Test organization created via API'
      };

      const request = new NextRequest('http://localhost:3000/api/organizations', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await postOrganizations(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('organization');
      expect(data.organization.name).toBe(requestBody.name);

      // Clean up
      await prisma.organizationMember.deleteMany({ where: { organizationId: data.organization.id } });
      await prisma.organization.delete({ where: { id: data.organization.id } });
    });
  });

  describe('Project Management API', () => {
    it('should list projects for authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/projects');
      const response = await getProjects(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('projects');
      expect(Array.isArray(data.projects)).toBe(true);
      expect(data.projects.length).toBeGreaterThan(0);
    });

    it('should create new project', async () => {
      const requestBody = {
        name: 'New Test Project',
        description: 'Test project created via API',
        organizationId: testOrganizationId
      };

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await postProjects(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('project');
      expect(data.project.name).toBe(requestBody.name);

      // Clean up
      await prisma.project.delete({ where: { id: data.project.id } });
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthenticated requests', async () => {
      // Mock unauthenticated session
      const originalMock = require('next-auth/next').getServerSession;
      require('next-auth/next').getServerSession.mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/keys');
      const response = await getKeys(request);

      expect(response.status).toBe(401);

      // Restore mock
      require('next-auth/next').getServerSession = originalMock;
    });

    it('should handle invalid JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/keys', {
        method: 'POST',
        body: 'invalid-json',
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await postKeys(request);
      expect(response.status).toBe(400);
    });

    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      const originalQuery = prisma.apiKey.findMany;
      prisma.apiKey.findMany = jest.fn().mockRejectedValueOnce(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/keys');
      const response = await getKeys(request);

      expect(response.status).toBe(500);

      // Restore original method
      prisma.apiKey.findMany = originalQuery;
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting for API endpoints', async () => {
      // Make multiple rapid requests to test rate limiting
      const requests = Array.from({ length: 10 }, () => 
        getKeys(new NextRequest('http://localhost:3000/api/keys'))
      );

      const responses = await Promise.all(requests);
      
      // At least some requests should succeed
      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Data Validation', () => {
    it('should validate required fields in API key creation', async () => {
      const invalidData = [
        { provider: '', apiKey: 'sk-test', name: 'Test' }, // Missing provider
        { provider: 'openai', apiKey: '', name: 'Test' }, // Missing API key
        { provider: 'openai', apiKey: 'sk-test', name: '' }, // Missing name
      ];

      for (const data of invalidData) {
        const request = new NextRequest('http://localhost:3000/api/keys', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await postKeys(request);
        expect(response.status).toBe(400);
      }
    });

    it('should validate budget creation parameters', async () => {
      const invalidBudgets = [
        { name: '', amount: 100, period: 'MONTHLY' }, // Missing name
        { name: 'Test', amount: -10, period: 'MONTHLY' }, // Negative amount
        { name: 'Test', amount: 100, period: 'INVALID' }, // Invalid period
      ];

      for (const budget of invalidBudgets) {
        const request = new NextRequest('http://localhost:3000/api/budgets', {
          method: 'POST',
          body: JSON.stringify(budget),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await postBudgets(request);
        expect(response.status).toBe(400);
      }
    });
  });

  describe('Performance Tests', () => {
    it('should handle large dataset queries efficiently', async () => {
      const startTime = Date.now();
      
      const request = new NextRequest('http://localhost:3000/api/dashboard/usage-summary');
      const response = await getUsageSummary(request);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });

    it('should handle concurrent requests', async () => {
      const concurrentRequests = Array.from({ length: 5 }, () => 
        getUsageSummary(new NextRequest('http://localhost:3000/api/dashboard/usage-summary'))
      );

      const responses = await Promise.all(concurrentRequests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});
