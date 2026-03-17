const appJson = require('./app.json');

function upsertPlugin(plugins, name, config) {
  const next = Array.isArray(plugins) ? [...plugins] : [];
  const index = next.findIndex((p) => {
    if (typeof p === 'string') return p === name;
    if (Array.isArray(p)) return p[0] === name;
    return false;
  });

  const entry = config ? [name, config] : name;

  if (index === -1) {
    next.push(entry);
    return next;
  }

  next[index] = entry;
  return next;
}

module.exports = ({ config }) => {
  const base = (appJson && appJson.expo) || {};

  const androidGoogleMapsApiKey =
    process.env.ANDROID_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  const iosGoogleMapsApiKey =
    process.env.IOS_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

  let plugins = base.plugins;
  plugins = upsertPlugin(plugins, 'expo-font');
  plugins = upsertPlugin(
    plugins,
    'expo-location',
    {
      locationWhenInUsePermission:
        'Allow $(PRODUCT_NAME) to access your location to show nearby places on the map.',
    }
  );

  const ios = {
    ...(base.ios || {}),
    ...(iosGoogleMapsApiKey
      ? {
          config: {
            ...((base.ios && base.ios.config) || {}),
            googleMapsApiKey: iosGoogleMapsApiKey,
          },
        }
      : {}),
  };

  const android = {
    ...(base.android || {}),
    ...(androidGoogleMapsApiKey
      ? {
          config: {
            ...((base.android && base.android.config) || {}),
            googleMaps: {
              ...(((base.android && base.android.config) || {}).googleMaps || {}),
              apiKey: androidGoogleMapsApiKey,
            },
          },
        }
      : {}),
  };

  return {
    ...config,
    ...base,
    ios,
    android,
    plugins,
  };
};
