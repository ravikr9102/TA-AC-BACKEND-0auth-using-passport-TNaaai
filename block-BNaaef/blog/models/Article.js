let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let slug = require('slug');

let articleSchema = new Schema({
  title: { type: String },
  description: { type: String },
  likes: { type: Number, default: 0 },
  comment: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  author: { type: String },
  slug: { type: String, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
});

articleSchema.pre('save', function (next) {
  this.slug = slug(this.title, '-');
  return next();
});

module.exports = mongoose.model('Article', articleSchema);
