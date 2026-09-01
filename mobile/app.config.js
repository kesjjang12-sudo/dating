// 동적 설정 — GitHub Pages 등 서브패스 배포 시 EXPO_WEB_BASE로 baseUrl 지정
// 예: EXPO_WEB_BASE=/dating npx expo export --platform web
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: process.env.EXPO_WEB_BASE || undefined,
  },
});
