var express = require('express');
var router = express.Router();
var User = require('../models/User');
var Article = require('../models/Article');
var Comment = require('../models/Comment');
var passport = require('passport');
var auth = require('../middlewares/auth');

//render a form for registration
router.get('/register', (req, res) => {
  let err = req.flash('error')[0];
  res.render('register', { err });
});

// capture the data
router.post('/register', (req, res, next) => {
  User.create(req.body, (err, user) => {
    if (err) {
      if (err.name === 'MongoServerError') {
        req.flash('error', 'This email is already exist');
        return res.redirect('/users/register');
      }
      if (err.name === 'ValidationError') {
        req.flash('error', err.message);
        return res.redirect('/users/register');
      }
    }
    res.redirect('/users/login');
  });
});

//login form
router.get('/login', (req, res) => {
  let err = req.flash('error')[0];
  res.render('login', { err });
});

// capture the data
router.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/users/login',
    successRedirect: '/users',
    failureFlash: true,
  })
);

router.use(auth.loggedInUser);

/* dashboard */
router.get('/', function (req, res, next) {
  let userId = req.session.userId;
  res.render('dashboard', { userId });
});

//logout
router.get('/logout', (req, res) => {
  res.clearCookie('connect.sid');
  req.session.destroy();
  res.redirect('/users/login');
});

//list of articles
router.get('/:userId/articles', (req, res, next) => {
  let userId = req.params.userId;
  User.findById(userId)
    .populate('articles')
    .exec((err, user) => {
      if (err) return next(err);
      res.render('articlesList', { userId, user });
    });
});

//render a article form
router.get('/:userId/articles/new', (req, res, next) => {
  let userId = req.params.userId;
  res.render('articleForm', { userId });
});

//capture the articles data
router.post('/:userId/articles/new', (req, res, next) => {
  let userId = req.params.userId;
  //appending userId
  req.body.userId = userId;
  // create the article and store in mongodb
  Article.create(req.body, (err, articles) => {
    if (err) return next(err);
    //push the article id into userShcema
    User.findByIdAndUpdate(
      userId,
      { $push: { articles: articles._id } },
      (err, user) => {
        if (err) return next(err);
      }
    );
    res.redirect('/users/' + userId + '/articles');
  });
});

//articles details
router.get('/:userId/articles/:articleSlug', (req, res, next) => {
  let articleSlug = req.params.articleSlug;
  Article.findOne({ slug: articleSlug })
    .populate('comment')
    .exec((err, article) => {
      if (err) return next(err);
      res.render('articleDetails', { article });
    });
});

//render a edit articles form
router.get('/:userId/articles/:articleSlug/edit', (req, res, next) => {
  let articleSlug = req.params.articleSlug;
  Article.findOne({ slug: articleSlug }, (err, article) => {
    if (err) return next(err);
    res.render('articleEdit', { article });
  });
});

//update articles
router.post('/:userId/articles/:articleSlug/edit', (req, res, next) => {
  let articleSlug = req.params.articleSlug;
  Article.findOneAndUpdate({ slug: articleSlug }, req.body, (err, article) => {
    if (err) return next(err);
    res.redirect('/users/' + article.userId + '/articles/' + articleSlug);
  });
});

//like articles
router.get('/:userId/articles/:articleSlug/like', (req, res, next) => {
  let articleSlug = req.params.articleSlug;
  Article.findOneAndUpdate(
    { slug: articleSlug },
    { $inc: { likes: +1 } },
    (err, article) => {
      if (err) return next(err);
      res.redirect('/users/' + article.userId + '/articles/' + articleSlug);
    }
  );
});

//dislike articles
router.get('/:userId/articles/:articleSlug/dislike', (req, res, next) => {
  let articleSlug = req.params.articleSlug;
  Article.findOne({ slug: articleSlug }, (err, article) => {
    if (err) return next(err);
    if (article.likes > 0) {
      Article.findOneAndUpdate(
        { slug: articleSlug },
        { $inc: { likes: -1 } },
        (err, article) => {
          if (err) return next(err);
          res.redirect('/users/' + article.userId + '/articles/' + articleSlug);
        }
      );
    } else {
      res.redirect('/users/' + article.userId + '/articles/' + articleSlug);
    }
  });
});

//delete articles
router.get('/:userId/articles/:articleSlug/delete', (req, res, next) => {
  let articleSlug = req.params.articleSlug;
  //deleting the article
  Article.findOneAndDelete({ slug: articleSlug }, (err, article) => {
    if (err) return next(err);
    //deleting the articlesIDs from user Shchema
    User.findOneAndDelete(
      { slug: article.slug },
      { $pull: { articles: article._id } },
      (err, info) => {
        if (err) return next(err);
        //deleting the commentId from article comment
        Comment.deleteMany({ articleSlug: article._id }, (err, info) => {
          if (err) return next(err);
          res.redirect('/users/' + article.userId + '/articles');
        });
      }
    );
  });
});

//creating the comment
router.post('/articles/:articleId/comment', (req, res, next) => {
  let articleId = req.params.articleId;
  if (req.body.title !== '') {
    //appending a articleID
    req.body.articleId = articleId;
    //creating a comment
    Comment.create(req.body, (err, comment) => {
      if (err) return next(err);
      //pushing the comment id
      Article.findByIdAndUpdate(
        articleId,
        { $push: { comment: comment._id } },
        (err, article) => {
          if (err) return next(err);
          res.redirect(
            '/users/' + article.userId + '/articles/' + article.slug
          );
        }
      );
    });
  } else {
    Article.findById(articleId, (err, article) => {
      if (err) return next(err);
      res.redirect('/users/' + article.userId + '/articles/' + article.slug);
    });
  }
});
module.exports = router;
