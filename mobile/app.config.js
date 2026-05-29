const fs = require("fs");
const path = require("path");

const appJson = require("./app.json");

/** Firebase native files are gitignored — omit from config when missing (avoids Expo parse errors). */
function withOptionalGoogleServices(expo) {
  const next = { ...expo, ios: { ...expo.ios }, android: { ...expo.android } };
  const root = __dirname;

  const androidGs = path.join(root, "google-services.json");
  if (!fs.existsSync(androidGs)) {
    delete next.android.googleServicesFile;
  }

  const iosPlist = path.join(root, "GoogleService-Info.plist");
  if (!fs.existsSync(iosPlist)) {
    delete next.ios.googleServicesFile;
  }

  return next;
}

module.exports = ({ config }) => {
  const base = config?.expo ? config : appJson;
  return {
    expo: withOptionalGoogleServices(base.expo),
  };
};
