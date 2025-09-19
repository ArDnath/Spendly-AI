#!/usr/bin/env tsx

/**
 * Manual API endpoint testing script
 * Run with: npx tsx scripts/test-api-endpoints.ts
 */

import { PrismaClient } from '../../../packages/database/generated/prisma';

const prisma = new PrismaClient();

interface TestResult {
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  responseTime?: number;
}

class APITester {
  private results: TestResult[] = [];
  private baseUrl = 'http://localhost:3000';

  async runTests() {
    console.log('🚀 Starting API Endpoint Tests...\n');

    // Test database connection first
    await this.testDatabaseConnection();

    // Test health endpoint
    await this.testHealthEndpoint();

    // Test authentication endpoints
    await this.testAuthEndpoints();

    // Test API key management
    await this.testApiKeyEndpoints();

    // Test usage analytics
    await this.testUsageEndpoints();

    // Test budget management
    await this.testBudgetEndpoints();

    // Test alert management
    await this.testAlertEndpoints();

    // Test organization management
    await this.testOrganizationEndpoints();

    // Test project management
    await this.testProjectEndpoints();

    // Test billing endpoints
    await this.testBillingEndpoints();

    // Test proxy endpoint
    await this.testProxyEndpoint();

    // Print results
    this.printResults();

    await prisma.$disconnect();
  }

  private async testDatabaseConnection() {
    try {
      await prisma.$connect();
      await prisma.user.findFirst();
      this.addResult('Database', 'CONNECT', 'PASS', 'Database connection successful');
    } catch (error) {
      this.addResult('Database', 'CONNECT', 'FAIL', `Database connection failed: ${error}`);
    }
  }

  private async testHealthEndpoint() {
    try {
      const startTime = Date.now();
      const response = await fetch(`${this.baseUrl}/api/health`);
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        if (data.status && data.database && data.timestamp) {
          this.addResult('/api/health', 'GET', 'PASS', 'Health check passed', responseTime);
        } else {
          this.addResult('/api/health', 'GET', 'FAIL', 'Health check response missing required fields');
        }
      } else {
        this.addResult('/api/health', 'GET', 'FAIL', `Health check failed with status ${response.status}`);
      }
    } catch (error) {
      this.addResult('/api/health', 'GET', 'FAIL', `Health check error: ${error}`);
    }
  }

  private async testAuthEndpoints() {
    // Test unauthenticated access
    try {
      const response = await fetch(`${this.baseUrl}/api/keys`);
      if (response.status === 401) {
        this.addResult('/api/keys', 'GET', 'PASS', 'Properly returns 401 for unauthenticated requests');
      } else {
        this.addResult('/api/keys', 'GET', 'FAIL', `Expected 401, got ${response.status}`);
      }
    } catch (error) {
      this.addResult('/api/keys', 'GET', 'FAIL', `Auth test error: ${error}`);
    }
  }

  private async testApiKeyEndpoints() {
    // Test GET /api/keys (without auth - should fail)
    try {
      const response = await fetch(`${this.baseUrl}/api/keys`);
      if (response.status === 401) {
        this.addResult('/api/keys', 'GET', 'PASS', 'Requires authentication');
      } else {
        this.addResult('/api/keys', 'GET', 'FAIL', `Expected 401, got ${response.status}`);
      }
    } catch (error) {
      this.addResult('/api/keys', 'GET', 'FAIL', `Error: ${error}`);
    }

    // Test POST /api/keys with invalid data
    try {
      const response = await fetch(`${this.baseUrl}/api/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invalid: 'data' })
      });
      
      if (response.status === 400 || response.status === 401) {
        this.addResult('/api/keys', 'POST', 'PASS', 'Properly validates input and requires auth');
      } else {
        this.addResult('/api/keys', 'POST', 'FAIL', `Expected 400/401, got ${response.status}`);
      }
    } catch (error) {
      this.addResult('/api/keys', 'POST', 'FAIL', `Error: ${error}`);
    }
  }

  private async testUsageEndpoints() {
    try {
      const response = await fetch(`${this.baseUrl}/api/dashboard/usage-summary`);
      if (response.status === 401) {
        this.addResult('/api/dashboard/usage-summary', 'GET', 'PASS', 'Requires authentication');
      } else {
        this.addResult('/api/dashboard/usage-summary', 'GET', 'FAIL', `Expected 401, got ${response.status}`);
      }
    } catch (error) {
      this.addResult('/api/dashboard/usage-summary', 'GET', 'FAIL', `Error: ${error}`);
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/usage`);
      if (response.status === 401) {
        this.addResult('/api/analytics/usage', 'GET', 'PASS', 'Requires authentication');
      } else {
        this.addResult('/api/analytics/usage', 'GET', 'FAIL', `Expected 401, got ${response.status}`);
      }
    } catch (error) {
      this.addResult('/api/analytics/usage', 'GET', 'FAIL', `Error: ${error}`);
    }
  }

  private async testBudgetEndpoints() {
    try {
      const response = await fetch(`${this.baseUrl}/api/budgets`);
      if (response.status === 401) {
        this.addResult('/api/budgets', 'GET', 'PASS', 'Requires authentication');
      } else {
        this.addResult('/api/budgets', 'GET', 'FAIL', `Expected 401, got ${response.status}`);
      }
    } catch (error) {
      this.addResult('/api/budgets', 'GET', 'FAIL', `Error: ${error}`);
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invalid: 'data' })
      });
      
      if (response.status === 400 || response.status === 401) {
        this.addResult('/api/budgets', 'POST', 'PASS', 'Properly validates input and requires auth');
      } else {
        this.addResult('/api/budgets', 'POST', 'FAIL', `Expected 400/401, got ${response.status}`);
      }
    } catch (error) {
      this.addResult('/api/budgets', 'POST', 'FAIL', `Error: ${error}`);
    }
  }

  private async testAlertEndpoints() {
    try {
      const response = await fetch(`${this.baseUrl}/api/alerts`);
      if (response.status === 401) {
        this.addResult('/api/alerts', 'GET', 'PASS', 'Requires authentication');
      } else {
        this.addResult('/api/alerts', 'GET', 'FAIL', `Expected 401, got ${response.status}`);
      }
    } catch (error) {
      this.addResult('/api/alerts', 'GET', 'FAIL', `Error: ${error}`);
    }
  }

  private async testOrganizationEndpoints() {
    try {
      const response = await fetch(`${this.baseUrl}/api/organizations`);
      if (response.status === 401) {
        this.addResult('/api/organizations', 'GET', 'PASS', 'Requires authentication');
      } else {
        this.addResult('/api/organizations', 'GET', 'FAIL', `Expected 401, got ${response.status}`);
      }
    } catch (error) {
      this.addResult('/api/organizations', 'GET', 'FAIL', `Error: ${error}`);
    }
  }

  private async testProjectEndpoints() {
    try {
      const response = await fetch(`${this.baseUrl}/api/projects`);
      if (response.status === 401) {
        this.addResult('/api/projects', 'GET', 'PASS', 'Requires authentication');
      } else {
        this.addResult('/api/projects', 'GET', 'FAIL', `Expected 401, got ${response.status}`);
      }
    } catch (error) {
      this.addResult('/api/projects', 'GET', 'FAIL', `Error: ${error}`);
    }
  }

  private async testBillingEndpoints() {
    try {
      const response = await fetch(`${this.baseUrl}/api/billing/subscription`);
      if (response.status === 401) {
        this.addResult('/api/billing/subscription', 'GET', 'PASS', 'Requires authentication');
      } else {
        this.addResult('/api/billing/subscription', 'GET', 'FAIL', `Expected 401, got ${response.status}`);
      }
    } catch (error) {
      this.addResult('/api/billing/subscription', 'GET', 'FAIL', `Error: ${error}`);
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'pro' })
      });
      
      if (response.status === 401) {
        this.addResult('/api/billing/checkout', 'POST', 'PASS', 'Requires authentication');
      } else {
        this.addResult('/api/billing/checkout', 'POST', 'FAIL', `Expected 401, got ${response.status}`);
      }
    } catch (error) {
      this.addResult('/api/billing/checkout', 'POST', 'FAIL', `Error: ${error}`);
    }
  }

  private async testProxyEndpoint() {
    try {
      const response = await fetch(`${this.baseUrl}/api/proxy/openai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      
      if (response.status === 401 || response.status === 400) {
        this.addResult('/api/proxy/openai', 'POST', 'PASS', 'Requires authentication and validates input');
      } else {
        this.addResult('/api/proxy/openai', 'POST', 'FAIL', `Expected 401/400, got ${response.status}`);
      }
    } catch (error) {
      this.addResult('/api/proxy/openai', 'POST', 'FAIL', `Error: ${error}`);
    }
  }

  private addResult(endpoint: string, method: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, responseTime?: number) {
    this.results.push({ endpoint, method, status, message, responseTime });
  }

  private printResults() {
    console.log('\n📊 Test Results Summary\n');
    console.log('=' .repeat(80));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%\n`);
    
    // Print detailed results
    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
      const time = result.responseTime ? ` (${result.responseTime}ms)` : '';
      console.log(`${icon} ${result.method} ${result.endpoint}${time}`);
      console.log(`   ${result.message}\n`);
    });

    // Print failed tests summary
    const failedTests = this.results.filter(r => r.status === 'FAIL');
    if (failedTests.length > 0) {
      console.log('\n🔍 Failed Tests Details:');
      console.log('=' .repeat(40));
      failedTests.forEach(test => {
        console.log(`❌ ${test.method} ${test.endpoint}`);
        console.log(`   ${test.message}\n`);
      });
    }

    // Performance summary
    const testsWithTiming = this.results.filter(r => r.responseTime);
    if (testsWithTiming.length > 0) {
      const avgResponseTime = testsWithTiming.reduce((sum, r) => sum + (r.responseTime || 0), 0) / testsWithTiming.length;
      const maxResponseTime = Math.max(...testsWithTiming.map(r => r.responseTime || 0));
      
      console.log('\n⚡ Performance Summary:');
      console.log('=' .repeat(30));
      console.log(`Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
      console.log(`Max Response Time: ${maxResponseTime}ms`);
      console.log(`Tests with timing: ${testsWithTiming.length}\n`);
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new APITester();
  tester.runTests().catch(console.error);
}

export { APITester };
