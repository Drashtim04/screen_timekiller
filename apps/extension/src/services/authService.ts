/**
 * Extension Auth Service
 * Listens for external authentication messages from the web dashboard to sync JWT tokens,
 * enabling seamless single sign-on (SSO) between web and extension.
 */
export interface ExtensionSession {
  access_token: string;
  user: {
    id: string;
    email?: string;
  };
}

export class AuthService {
  private session: ExtensionSession | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    const data = await chrome.storage.local.get('authSession');
    if (data.authSession) {
      this.session = data.authSession;
    }

    // Listen for messages from web dashboard
    chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
      if (message.type === 'SYNC_AUTH') {
        this.updateSession(message.session);
        sendResponse({ success: true });
      }
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.authSession) {
        this.session = changes.authSession.newValue;
      }
    });
  }

  public async updateSession(session: ExtensionSession | null) {
    this.session = session;
    await chrome.storage.local.set({ authSession: session });
  }

  public getSession(): ExtensionSession | null {
    return this.session;
  }

  public isAuthenticated(): boolean {
    return !!this.session?.access_token;
  }
}

export const authService = new AuthService();
