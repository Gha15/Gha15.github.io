#!/usr/bin/env node
// Simple dev server with proper 404 fallback for /users/* routes
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(ROOT, req.url === '/' ? '/index.html' : req.url);
  
  // Remove query string
  const queryIndex = filePath.indexOf('?');
  if (queryIndex !== -1) {
    filePath = filePath.substring(0, queryIndex);
  }

  // If directory, try index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      // Handle /users/* routes by serving /users/index.html
      if (req.url.startsWith('/users/') && !req.url.includes('.')) {
        fs.readFile(path.join(ROOT, 'users', 'index.html'), (err2, content2) => {
          if (err2) {
            // Fallback to root 404.html
            fs.readFile(path.join(ROOT, '404.html'), (err3, content3) => {
              res.writeHead(404, { 'Content-Type': 'text/html' });
              res.end(content3 || '<h1>404 Not Found</h1>', 'utf-8');
            });
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content2, 'utf-8');
          }
        });
      } else {
        // Serve 404.html for other missing files
        fs.readFile(path.join(ROOT, '404.html'), (err2, content2) => {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(content2 || '<h1>404 Not Found</h1>', 'utf-8');
        });
      }
    } else {
      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Matix dev server running at http://localhost:${PORT}/`);
  console.log(`   Now /users/test will work just like /users/ghadi`);
  console.log(`   Press Ctrl+C to stop`);
});
