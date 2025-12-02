process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../server');
const Threat = require('../schemas/Threat');

jest.mock('../schemas/Threat');

describe('Threat Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/threats', () => {
    it('should return active threats', async () => {
      const mockThreats = [
        { threatId: 't1', title: 'Test Threat', risk: 'high' },
        { threatId: 't2', title: 'Another Threat', risk: 'medium' }
      ];
      Threat.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue(mockThreats)
      });
      Threat.countDocuments.mockResolvedValue(2);

      const response = await request(app).get('/api/threats');

      expect(response.status).toBe(200);
      expect(response.body.threats).toEqual(mockThreats);
      expect(response.body.total).toBe(2);
    });
  });

  describe('GET /api/threats/:threatId', () => {
    it('should return specific threat', async () => {
      const mockThreat = { threatId: 't1', title: 'Test Threat' };
      Threat.findOne.mockResolvedValue(mockThreat);

      const response = await request(app).get('/api/threats/t1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockThreat);
    });

    it('should return 404 if threat not found', async () => {
      Threat.findOne.mockResolvedValue(null);

      const response = await request(app).get('/api/threats/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Threat not found');
    });
  });

  describe('POST /api/threats/:threatId/view', () => {
    it('should mark threat as read', async () => {
      const mockThreat = { threatId: 't1', markAsRead: jest.fn() };
      Threat.findOne.mockResolvedValue(mockThreat);

      const response = await request(app)
        .post('/api/threats/t1/view')
        .send({ userId: 'user123' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Threat marked as read');
      expect(mockThreat.markAsRead).toHaveBeenCalledWith('user123');
    });
  });

  describe('POST /api/threats/:threatId/report', () => {
    it('should add report to threat', async () => {
      const mockThreat = { threatId: 't1', addReport: jest.fn() };
      Threat.findOne.mockResolvedValue(mockThreat);

      const response = await request(app)
        .post('/api/threats/t1/report')
        .send({ userId: 'user123', anonymous: true });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Report added to threat');
      expect(mockThreat.addReport).toHaveBeenCalledWith('user123', true);
    });
  });

  describe('GET /api/threats/stats/overview', () => {
    it('should return threat statistics', async () => {
      const mockAggregateResult = [
        {
          total: 5,
          byRisk: ['high', 'high', 'medium', 'medium', 'low'],
          byType: ['scam', 'scam', 'scam', 'harassment', 'harassment'],
          byCountry: ['Kenya', 'Kenya', 'Kenya', 'Nigeria', 'Nigeria']
        }
      ];
      Threat.aggregate.mockResolvedValue(mockAggregateResult);

      const response = await request(app).get('/api/threats/stats/overview');

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(5);
      expect(response.body.byRisk).toEqual({ high: 2, medium: 2, low: 1 });
      expect(response.body.byType).toEqual({ scam: 3, harassment: 2 });
      expect(response.body.byCountry).toEqual({ Kenya: 3, Nigeria: 2 });
    });
  });
});