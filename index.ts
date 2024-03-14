import socket, { Server } from 'socket.io';
import sqlite3 from 'sqlite3';

const io: Server = new socket.Server(3000);
const db = new sqlite3.Database('db.sqlite3');

interface Message {
    username: string;
    socketId: string;
}

const users: Message[] = [];

db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT)');
db.run('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, username TEXT, message TEXT, user_id INTEGER, FOREIGN KEY(user_id) REFERENCES users(id))');

io.on('connection', (socket) => {
    console.log('a user connected to the server with id ' + socket.id);
  socket.on('login', (username: string) => {
      users.push({username, socketId: socket.id});
        db.run('INSERT INTO users (username) VALUES (?)', username);
      console.log('user added with username ' + username + ' and id ' + socket.id);
      socket.emit('login', true);
  });

  socket.on('disconnect', () => {
    const index =  users.map((user) => user.socketId).indexOf(socket.id);
    if (index > -1) {
      users.splice(index, 1);
    }
  });

  socket.on('message', (message: string) => {
    console.log('message received from ' + users.map((user) => user.socketId).indexOf(socket.id) + ': ' + message);
    db.run('INSERT INTO messages (username, message, user_id) VALUES (?, ?, ?)', users.map((user) => user.username), message, socket.id);
    io.emit('message', {username: users.map((user) => user.username) , message:  message});
  });
});