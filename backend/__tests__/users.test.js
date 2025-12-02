const request = require('supertest');
const app = require('../server');
const UserProfile = require('../schemas/User');

jest.mock('../schemas/User');

describe('User Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users/:userId', () => {
    it('should return user profile', async () => {
      const mockUser = { userId: 'test123', ageRange: '18-25', safetyScore: 80 };
      UserProfile.findOne.mockResolvedValue(mockUser);

      const response = await request(app).get('/api/users/test123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(UserProfile.findOne).toHaveBeenCalledWith({ userId: 'test123' });
    });

    it('should return 404 if user not found', async () => {
      UserProfile.findOne.mockResolvedValue(null);

      const response = await request(app).get('/api/users/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('POST /api/users/:userId', () => {
    it('should create or update user profile', async () => {
      const userData = { ageRange: '18-25', interests: ['safety'], country: 'Kenya' };
      const mockUser = { userId: 'test123', ...userData };
      UserProfile.findOneAndUpdate.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/users/test123')
        .send(userData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
    });
  });

  describe('PATCH /api/users/:userId/safety-score', () => {
    it('should update safety score', async () => {
      const mockUser = { userId: 'test123', updateSafetyScore: jest.fn() };
      UserProfile.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .patch('/api/users/test123/safety-score')
        .send({ safetyScore: 85 });

      expect(response.status).toBe(200);
      expect(mockUser.updateSafetyScore).toHaveBeenCalledWith(85);
    });
  });

  describe('GET /api/users/:userId/quests', () => {
    it('should return user quests', async () => {
      const mockUser = { userId: 'test123', completedQuests: [{ questId: 'q1', score: 90 }] };
      UserProfile.findOne.mockResolvedValue(mockUser);

      const response = await request(app).get('/api/users/test123/quests');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser.completedQuests);
    });
  });

  describe('POST /api/users/:userId/quests', () => {
    it('should add completed quest', async () => {
      const mockUser = {
        userId: 'test123',
        completedQuests: [],
        save: jest.fn().mockResolvedValue()
      };
      UserProfile.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/users/test123/quests')
        .send({ questId: 'q1', score: 90 });

      expect(response.status).toBe(200);
      expect(mockUser.completedQuests).toContainEqual({ questId: 'q1', score: 90, completedAt: expect.any(Date) });
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should return 400 if quest already completed', async () => {
      const mockUser = {
        userId: 'test123',
        completedQuests: [{ questId: 'q1', score: 90 }]
      };
      UserProfile.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/users/test123/quests')
        .send({ questId: 'q1', score: 95 });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Quest already completed');
    });
  });
});