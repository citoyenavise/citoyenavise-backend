/**
 * WebSocket Server — Real-time updates
 */

const WebSocket = require('ws');
const logger = require('../utils/logger');

class WebSocketServer {
  constructor(httpServer) {
    this.server = null;
    this.clients = new Map(); // Map<ideaId, Set<WebSocket>>
    this.userConnections = new Map(); // Map<userId, Set<WebSocket>>
    this.httpServer = httpServer;
  }

  /**
   * Initialiser et attacher au serveur HTTP
   */
  attach() {
    this.server = new WebSocket.Server({ server: this.httpServer });

    this.server.on('connection', (ws) => {
      logger.debug('WebSocket client connected');

      // Envoyer message de bienvenue
      ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(ws, message);
        } catch (err) {
          logger.warn('WebSocket parse error', { meta: { error: err.message } });
          ws.send(JSON.stringify({ type: 'error', error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        logger.debug('WebSocket client disconnected');
        this.handleDisconnect(ws);
      });

      ws.on('error', (err) => {
        logger.error('WebSocket error', { meta: { error: err.message } });
      });
    });
  }

  /**
   * Gérer les messages du client
   */
  handleMessage(ws, message) {
    const { type, ideaId, userId } = message;

    switch (type) {
      case 'subscribe':
        this.subscribe(ws, ideaId, userId);
        break;
      case 'unsubscribe':
        this.unsubscribe(ws, ideaId);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      default:
        logger.warn('Unknown message type', { meta: { type } });
    }
  }

  /**
   * Subscribe a client to an idea's updates
   */
  subscribe(ws, ideaId, userId) {
    if (!ideaId) return;

    // Ajouter aux rooms idea
    if (!this.clients.has(ideaId)) {
      this.clients.set(ideaId, new Set());
    }
    this.clients.get(ideaId).add(ws);

    // Ajouter aux connections utilisateur
    if (userId) {
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId).add(ws);
    }

    // Stocker metadata sur le WebSocket
    ws.ideaId = ideaId;
    ws.userId = userId;

    // Confirmer subscription
    ws.send(JSON.stringify({
      type: 'subscribed',
      ideaId,
      timestamp: new Date().toISOString(),
    }));

    logger.debug('WebSocket subscribed to idea', { meta: { ideaId, userId } });
  }

  /**
   * Unsubscribe a client
   */
  unsubscribe(ws, ideaId) {
    if (!ideaId) return;

    const room = this.clients.get(ideaId);
    if (room) {
      room.delete(ws);
      if (room.size === 0) {
        this.clients.delete(ideaId);
      }
    }

    ws.send(JSON.stringify({
      type: 'unsubscribed',
      ideaId,
    }));
  }

  /**
   * Nettoyer quand un client se déconnecte
   */
  handleDisconnect(ws) {
    const ideaId = ws.ideaId;
    const userId = ws.userId;

    if (ideaId) {
      const room = this.clients.get(ideaId);
      if (room) {
        room.delete(ws);
        if (room.size === 0) {
          this.clients.delete(ideaId);
        }
      }
    }

    if (userId) {
      const userRooms = this.userConnections.get(userId);
      if (userRooms) {
        userRooms.delete(ws);
        if (userRooms.size === 0) {
          this.userConnections.delete(userId);
        }
      }
    }
  }

  /**
   * Broadcast message to all clients in a room
   */
  broadcast(ideaId, message) {
    const room = this.clients.get(ideaId);
    if (!room || room.size === 0) return;

    const payload = JSON.stringify({
      type: message.type || 'update',
      ideaId,
      timestamp: new Date().toISOString(),
      data: message.data || {},
    });

    room.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });

    logger.debug('WebSocket broadcast', { meta: { ideaId, clients: room.size, messageType: message.type } });
  }

  /**
   * Send message to specific user (all their connections)
   */
  sendToUser(userId, message) {
    const userRooms = this.userConnections.get(userId);
    if (!userRooms || userRooms.size === 0) return;

    const payload = JSON.stringify({
      type: message.type || 'update',
      timestamp: new Date().toISOString(),
      data: message.data || {},
    });

    userRooms.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  }

  /**
   * Get connection stats
   */
  getStats() {
    let totalConnections = 0;
    this.clients.forEach(room => {
      totalConnections += room.size;
    });

    return {
      totalConnections,
      rooms: this.clients.size,
      users: this.userConnections.size,
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    if (this.server) {
      this.server.clients.forEach(ws => {
        ws.close();
      });
      this.server.close();
      logger.info('WebSocket server closed');
    }
  }
}

module.exports = WebSocketServer;
