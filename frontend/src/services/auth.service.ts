
const API_URL = 'https://api.gramchat.ru';



interface User {

  id: string;

  telegramId: string;

  firstName: string;

  lastName?: string;

  username?: string;

  role: string;

  hasFullAccess?: boolean;

  shop?: any;

}



class AuthService {

  private token: string | null = null;



  constructor() {

    this.token = localStorage.getItem('authToken');

  }



  async validateToken(token: string, inviteCode?: string): Promise<{ token: string; user: User }> {
    console.log('Validating token:', token, 'with invite code:', inviteCode);
    console.log('API URL:', `${API_URL}/auth/validate-token`);
    
    const response = await fetch(`${API_URL}/auth/validate-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, inviteCode }),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('Auth error response:', error);
      throw new Error(error.message || 'Invalid token');
    }

    const data = await response.json();
    console.log('Auth success:', data);
    
    this.token = data.token;
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }



  async getCurrentUser(): Promise<User | null> {

    if (!this.token) return null;



    try {

      const response = await fetch(`${API_URL}/auth/me`, {

        headers: {

          'Authorization': `Bearer ${this.token}`,

        },

      });



      if (!response.ok) {

        this.logout();

        return null;

      }



      return response.json();

    } catch (error) {

      console.error('Failed to get current user:', error);

      return null;

    }

  }



  logout(): void {

    this.token = null;

    localStorage.removeItem('authToken');

    localStorage.removeItem('user');

  }



  getToken(): string | null {

    return this.token;

  }



  isAuthenticated(): boolean {

    return !!this.token;

  }

}



export const authService = new AuthService();

