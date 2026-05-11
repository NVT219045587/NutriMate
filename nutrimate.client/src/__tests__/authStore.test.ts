import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Targets the API exposed by docker-compose.override.yml (port 18080 → container 8080).
// Override with API_BASE_URL env var when running against a different environment.
// In production compose (no override), the API is only reachable through the
// nginx proxy on port 8090 — port 18080 is only mapped in the dev override.
const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:8090';

// ── Store unit tests ──────────────────────────────────────────────────────────

describe('authStore — state transitions', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('initialises with null user and token', () => {
    const { user, csrfToken } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(csrfToken).toBeNull();
  });

  it('isAuthenticated returns false on fresh store', () => {
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  it('setAuth persists user, token and clears loading flag', () => {
    const mockUser = { userId: '1', username: 'testuser', fullName: 'Test User' };
    useAuthStore.getState().setAuth(mockUser, 'csrf-abc');

    const { user, csrfToken, isLoading } = useAuthStore.getState();
    expect(user).toEqual(mockUser);
    expect(csrfToken).toBe('csrf-abc');
    expect(isLoading).toBe(false);
  });

  it('isAuthenticated returns true after setAuth', () => {
    useAuthStore.getState().setAuth(
      { userId: '1', username: 'test', fullName: 'Test' },
      'csrf-abc'
    );
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
  });

  it('clearAuth resets user and token to null', () => {
    useAuthStore.getState().setAuth(
      { userId: '1', username: 'test', fullName: 'Test' },
      'csrf-abc'
    );
    useAuthStore.getState().clearAuth();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().csrfToken).toBeNull();
  });

  it('isAuthenticated returns false when csrfToken is null', () => {
    useAuthStore.setState({
      user: { userId: '1', username: 'test', fullName: 'Test' },
      csrfToken: null,
    });
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  it('setLoading updates the loading flag', () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);

    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});

// ── API integration tests — 401 / 403 ────────────────────────────────────────

describe(`API auth protection (${API_BASE})`, () => {
  function assertHttpError(err: any, expectedStatus: number): void {
    if (!err.response) {
      throw new Error(
        `API not reachable at ${API_BASE} — is the container running? (${err.message})`
      );
    }
    expect(err.response.status).toBe(expectedStatus);
  }

  it('GET /api/nutrition/daily returns 401 without a session', async () => {
    expect.assertions(1);
    try {
      await axios.get(`${API_BASE}/api/nutrition/daily`);
    } catch (err: any) {
      assertHttpError(err, 401);
    }
  });

  it('GET /api/user/profile returns 401 without a session', async () => {
    expect.assertions(1);
    try {
      await axios.get(`${API_BASE}/api/user/profile`);
    } catch (err: any) {
      assertHttpError(err, 401);
    }
  });

  it('POST /api/auth/login with invalid credentials returns 401', async () => {
    expect.assertions(1);
    try {
      await axios.post(
        `${API_BASE}/api/auth/login`,
        { username: '__invalid_test_user__', password: '__wrong_pw__' },
        { withCredentials: true }
      );
    } catch (err: any) {
      assertHttpError(err, 401);
    }
  });
});
