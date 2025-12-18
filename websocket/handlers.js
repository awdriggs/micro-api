import { handleColorValue } from '../controllers/colorValueController.js';
import { handleShadesOfBlue } from '../controllers/shadesOfBlueController.js';

export function getProjectHandlers(streamManager) {
  const broadcast = (streams, streamName, message, sender) => {
    streamManager.broadcast(streamName, message, sender);
  };

  return {
    'color-value': (msg, ws) => handleColorValue(msg, ws, streamManager.streams, broadcast),
    'shades-of-blue': (msg, ws) => handleShadesOfBlue(msg, ws, streamManager.streams, broadcast)
  };
}
