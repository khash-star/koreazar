// KakaoTalk Authentication Service
// Firebase Authentication-тай холбохын тулд Kakao token-ийг custom token руу хөрвүүлэх хэрэгтэй

/**
 * Kakao SDK-ийг ачаалах
 */
export const loadKakaoSDK = () => {
  return new Promise((resolve, reject) => {
    if (window.Kakao && window.Kakao.isInitialized()) {
      resolve(window.Kakao);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
    script.async = true;
    script.onload = () => {
      const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY;
      if (!KAKAO_JS_KEY) {
        reject(new Error('KAKAO_JS_KEY environment variable is not set'));
        return;
      }
      window.Kakao.init(KAKAO_JS_KEY);
      resolve(window.Kakao);
    };
    script.onerror = () => reject(new Error('Failed to load Kakao SDK'));
    document.head.appendChild(script);
  });
};

/**
 * Kakao-р нэвтрэх
 */
export const loginWithKakao = async () => {
  try {
    const Kakao = await loadKakaoSDK();
    
    return new Promise((resolve, reject) => {
      Kakao.Auth.login({
        success: async (authObj) => {
          try {
            // Get Kakao user info
            Kakao.API.request({
              url: '/v2/user/me',
              success: async (userInfo) => {
                try {
                  // Get custom token from backend
                  const response = await fetch('/api/auth/kakao', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      kakaoToken: authObj.access_token,
                      kakaoUserInfo: {
                        id: userInfo.id,
                        email: userInfo.kakao_account?.email,
                        nickname: userInfo.kakao_account?.profile?.nickname,
                        profile_image: userInfo.kakao_account?.profile?.profile_image_url,
                      },
                    }),
                  });

                  if (!response.ok) {
                    throw new Error('Failed to get custom token');
                  }

                  const { customToken } = await response.json();
                  
                  // Sign in with custom token
                  const { signInWithCustomToken } = await import('firebase/auth');
                  const { auth } = await import('@/firebase/config');
                  const userCredential = await signInWithCustomToken(auth, customToken);
                  
                  resolve(userCredential.user);
                } catch (error) {
                  console.error('Error signing in with Kakao:', error);
                  reject(error);
                }
              },
              fail: (error) => {
                console.error('Failed to get Kakao user info:', error);
                reject(error);
              },
            });
          } catch (error) {
            reject(error);
          }
        },
        fail: (error) => {
          console.error('Kakao login failed:', error);
          reject(error);
        },
      });
    });
  } catch (error) {
    console.error('Error loading Kakao SDK:', error);
    throw error;
  }
};

/**
 * Kakao-с гарах
 */
export const logoutFromKakao = async () => {
  try {
    const Kakao = await loadKakaoSDK();
    if (Kakao.Auth.getAccessToken()) {
      Kakao.Auth.logout();
    }
  } catch (error) {
    console.error('Error logging out from Kakao:', error);
  }
};

