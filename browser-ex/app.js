const valueSlider = document.getElementById('value-slider');
const valueDisplay = document.getElementById('value-display');
const sendButton = document.getElementById('send-button');
const statusDisplay = document.getElementById('status');
const messagesDiv = document.getElementById('messages');

const STREAM_NAME = 'example';

// Connect to WebSocket server
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
// const ws = new WebSocket(`${protocol}//${window.location.host}`);
const ws = new WebSocket(`${protocol}//localhost:3000`); //for testing right now

ws.onopen = () => {
  console.log('Connected to server');
  statusDisplay.textContent = 'Connected';
  statusDisplay.style.color = 'green';

  // Join the stream
  ws.send(JSON.stringify({
    type: 'join',
    stream: STREAM_NAME
  }));
};

ws.onclose = () => {
  console.log('Disconnected from server');
  statusDisplay.textContent = 'Disconnected';
  statusDisplay.style.color = 'red';
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  statusDisplay.textContent = 'Error';
  statusDisplay.style.color = 'red';
};

ws.onmessage = (event) => {
  console.log('Message from server:', event.data);
  try {
    const data = JSON.parse(event.data);

    // Handle join confirmation
    if (data.type === 'joined') {
      console.log('Joined stream:', data.stream);
      addMessage(`Joined stream: ${data.stream}`, 'system');
    }

    // Handle error messages
    if (data.type === 'error') {
      console.error('Server error:', data.message);
      addMessage(`Error: ${data.message}`, 'error');
    }

    // Handle data messages from other clients
    if (data.type === 'data') {
      addMessage(`Received: ${JSON.stringify(data)}`, 'received');

      // Update slider if value is present
      if (data.value !== undefined) {
        valueSlider.value = data.value;
        valueDisplay.textContent = data.value;
      }
    }

  } catch (error) {
    console.error('Error parsing message:', error);
  }
};

// Update display when slider moves
valueSlider.addEventListener('input', (e) => {
  const value = e.target.value;
  valueDisplay.textContent = value;
});

// Send value when slider changes
valueSlider.addEventListener('change', (e) => {
  const value = e.target.value;
  if (ws.readyState === WebSocket.OPEN) {
    const message = {
      type: 'data',
      value: parseInt(value)
    };
    ws.send(JSON.stringify(message));
    addMessage(`Sent: ${JSON.stringify(message)}`, 'sent');
  }
});

// Send button for custom messages
sendButton.addEventListener('click', () => {
  if (ws.readyState === WebSocket.OPEN) {
    const message = {
      type: 'data',
      value: parseInt(valueSlider.value),
      timestamp: Date.now()
    };
    ws.send(JSON.stringify(message));
    addMessage(`Sent: ${JSON.stringify(message)}`, 'sent');
  }
});

// Add message to display
function addMessage(text, type) {
  const messageEl = document.createElement('p');
  messageEl.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;

  if (type === 'sent') {
    messageEl.style.color = 'blue';
  } else if (type === 'received') {
    messageEl.style.color = 'green';
  } else if (type === 'error') {
    messageEl.style.color = 'red';
  } else if (type === 'system') {
    messageEl.style.color = 'gray';
  }

  messagesDiv.prepend(messageEl);

  // Keep only last 20 messages
  while (messagesDiv.children.length > 20) {
    messagesDiv.removeChild(messagesDiv.lastChild);
  }
}
