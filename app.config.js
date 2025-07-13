try {
  require('dotenv').config();
} catch (e) {
  console.log('dotenv not installed, using fallback');
}

module.exports = {
  expo: {
    name: "Athlete Mindset",
    slug: "athlete-mindset-rork",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
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
      bundleIdentifier: "com.athletemindset.app"
    },
    android: {
      package: "com.athletemindset.app",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#000000"
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      openaiApiKey: process.env.OPENAI_API_KEY || ''
    }
  }
};