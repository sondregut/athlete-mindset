try {
  require('dotenv').config();
  console.log('[app.config.js] Environment variables loaded');
  console.log('[app.config.js] ELEVENLABS_API_KEY:', process.env.ELEVENLABS_API_KEY ? `${process.env.ELEVENLABS_API_KEY.substring(0, 10)}...` : 'NOT SET');
} catch (e) {
  console.log('dotenv not installed, using fallback');
}

module.exports = {
  expo: {
    name: "Athlete Mindset",
    slug: "athlete-mindset-rork",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#4A6FFF"
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
      "assets/images/**/*.png",
      "assets/images/**/*.jpg",
      "assets/fonts/**/*.ttf",
      "assets/fonts/**/*.otf",
      "assets/audio/**/*.mp3",
      "!**/.DS_Store",
      "!**/Thumbs.db",
      "!**/*.md"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.sondregut.athletemindset",
      googleServicesFile: "./GoogleService-Info.plist",
      infoPlist: {
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [
              "com.googleusercontent.apps.860569454039-tjvf38os5g430uct33se2lbra2sl6is1"
            ]
          }
        ]
      }
    },
    android: {
      package: "app.rork.athlete-mindset-toolkit-jda24fe",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#4A6FFF"
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      ...(process.env.EAS_BUILD_PROFILE !== 'production' ? ["expo-dev-client"] : []),
      [
        "expo-router",
        {
          "origin": "https://rork.com/"
        }
      ],
      "expo-apple-authentication"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      elevenLabsApiKey: process.env.ELEVENLABS_API_KEY || '',
      openaiApiKey: process.env.OPENAI_API_KEY || '', // For personalization only
      eas: {
        projectId: "4657ce48-4822-4f18-bf07-8ab679a24a7a"
      }
    }
  }
};