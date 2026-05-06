/**
 * Event: CommentCreated
 * Émis quand un nouveau commentaire est créé
 */

class CommentCreated {
  constructor(data) {
    this.eventName = 'comment.created';
    this.commentId = data.commentId;
    this.postId = data.postId;
    this.userId = data.userId;
    this.postOwnerId = data.postOwnerId;
    this.timestamp = data.timestamp || new Date().toISOString();
  }

  validate() {
    const required = ['commentId', 'postId', 'userId', 'postOwnerId'];
    for (const field of required) {
      if (!this[field]) {
        throw new Error(`missing required field: ${field}`);
      }
    }
    return true;
  }

  toJSON() {
    return {
      eventName: this.eventName,
      commentId: this.commentId,
      postId: this.postId,
      userId: this.userId,
      postOwnerId: this.postOwnerId,
      timestamp: this.timestamp,
    };
  }
}

module.exports = CommentCreated;
