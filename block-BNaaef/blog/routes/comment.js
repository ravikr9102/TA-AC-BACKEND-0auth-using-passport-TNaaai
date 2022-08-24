let express = require('express');
let router = express.Router();
var Comment = require('../models/Comment');
var Article = require('../models/Article');
var auth = require('../middlewares/auth');

router.use(auth.loggedInUser);

router.get('/:commentId/edit', (req, res, next) => {
  let commentId = req.params.commentId;
  Comment.findById(commentId, (err, comment) => {
    if (err) return next(err);
    res.render('commentEdit', { comment });
  });
});

//update comment
router.post('/:commentId/edit', (req, res, next) => {
  let commentId = req.params.commentId;
  Comment.findByIdAndUpdate(commentId, req.body, (err, comment) => {
    if (err) return next(err);
    Article.findById(comment.articleId, (err, article) => {
      if (err) return next(err);
      res.redirect('/users/' + article.userId + '/articles/' + article.slug);
    });
  });
});

//delete comment
router.get('/:commentId/delete', (req, res, next) => {
  let commentId = req.params.commentId;
  Comment.findByIdAndDelete(commentId, (err, comment) => {
    if (err) return next(err);
    Article.findByIdAndUpdate(
      comment.articleId,
      { $pull: { comment: comment._id } },
      (err, article) => {
        if (err) return next(err);
        res.redirect(
          '/users/' + req.session.userId + '/articles/' + article.slug
        );
      }
    );
  });
});

//like comment
router.get('/:commentId/like', (req, res, next) => {
  let commentId = req.params.commentId;
  Comment.findByIdAndUpdate(
    commentId,
    { $inc: { like: +1 } },
    (err, comment) => {
      if (err) return next(err);
      Article.findById(comment.articleId, (err, article) => {
        if (err) return next(err);
        res.redirect(
          '/users/' + req.session.userId + '/articles/' + article.slug
        );
      });
    }
  );
});

//dislike comment
router.get('/:commentId/dislike', (req, res, next) => {
  let commentId = req.params.commentId;
  Comment.findById(commentId, (err, comment) => {
    if (err) return next(err);
    if (comment.like > 0) {
      Comment.findByIdAndUpdate(
        commentId,
        { $inc: { like: -1 } },
        (err, comment) => {
          if (err) return next(err);
          Article.findById(comment.articleId, (err, article) => {
            if (err) return next(err);
            res.redirect(
              '/users/' + req.session.userId + '/articles/' + article.slug
            );
          });
        }
      );
    } else {
      Article.findById(comment.articleId, (err, article) => {
        if (err) return next(err);
        res.redirect(
          '/users/' + req.session.userId + '/articles/' + article.slug
        );
      });
    }
  });
});

module.exports = router;
