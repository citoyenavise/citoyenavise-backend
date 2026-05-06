/**
 * Event : LikeAdded
 * Emitted when a user likes a post
 *
 * Data structure :
 * {
 *   postId: uuid,           # ID du post aimé
 *   userId: uuid,           # ID de l'utilisateur qui like
 *   postOwnerId: uuid,      # ID du propriétaire du post
 *   timestamp: ISO string   # Quand le like a eu lieu
 * }
 *
 * Use cases :
 * - Increment owner's "likes received" score
 * - Send notification to post owner
 * - Update user's "likes given" score
 * - Trigger gamification (badges, reputation)
 */

class LikeAdded {
  constructor(data) {
    this.eventName = 'like.added';
    this.postId = data.postId;
    this.userId = data.userId;
    this.postOwnerId = data.postOwnerId;
    this.timestamp = data.timestamp || new Date().toISOString();
  }

  toJSON() {
    return {
      eventName: this.eventName,
      postId: this.postId,
      userId: this.userId,
      postOwnerId: this.postOwnerId,
      timestamp: this.timestamp,
    };
  }

  validate() {
    const required = ['postId', 'userId', 'postOwnerId'];
    for (const field of required) {
      if (!this[field]) {
        throw new Error(`LikeAdded: missing required field '${field}'`);
      }
    }
    return true;
  }
}

module.exports = LikeAdded;
