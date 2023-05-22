import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const dht = require('dht-rpc');
const socket = io('http://localhost:8080');
const dhtNode = dht();

function send(username, message) {
  const timestamp = new Date().toLocaleString();
  socket.emit('message', { timestamp, username, message });
}

function receive(data) {
  const { timestamp, username, message } = data;
  console.log(`[${timestamp}] ${username}: ${message}`);
}

socket.on('connect', () => {
  console.log('connected to server');
});

socket.on('message', (data) => {
  receive(data);
});

dhtNode.lookup('my-app-key', (err, res) => {
  if (err) {
    console.error(err);
  } else {
    res.forEach((peer) => {
      const conn = socket.conn();
      if (!conn || conn.remoteAddress !== peer.address) {
        console.log('connecting to peer:', peer.address);
        const peerSocket = io(`http://${peer.address}:${peer.port}`);
        peerSocket.on('connect', () => {
          console.log('connected to peer:', peer.address);
          socket.on('message', (data) => {
            peerSocket.emit('message', data);
            receive(data);
          });
        });
      }
    });
  }
});

function Home() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    socket.connect();
    return () => socket.disconnect();
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    send(username, message);
    setMessage('');
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <input
          type="text"
          placeholder="Message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
