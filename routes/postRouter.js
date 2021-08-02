var express = require('express');
var router = express.Router();
var Post = require('../models/post');
var Likes = require('../models/likes');
var authenticate = require('../middleware/authenticate');

router.get('/', authenticate.verifyUser, (req, res, next) => {
    Post.find({})
        .then(posts => {
            if (posts.length === 0) {
                res.setHeader('Content-Type', 'application/json');
                res.status(200).json({ message: "No post yet" });
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.status(200).json(posts);
            }
        }, (err) => { next(err) })
        .catch(err => { next(err) });
});
router.post('/', authenticate.verifyUser, (req, res, next) => {
    var { content } = req.body;
    content = content.trim();
    if (content.trim() == "") {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.json({ success: false, message: "content can't be empty" })
    }
    else {
        const newPost = new Post({ //creating new post
            content,
            username: req.userData.username,
            likes: 0,
            comments: [],
        });
        newPost.save()
            .then((post) => {
                var showPost = {
                    success: true,
                    status: 'Tweet posted successfully',
                    newPost: post,
                };
                res.setHeader('Content-Type', 'application/json');
                res.status(200).json(showPost);
            }, (err) => { next(err) })
            .catch(err => { next(err) });
    }

});

router.delete('/', authenticate.verifyUser, (req, res, next) => {
    var username = req.userData.username;
    Post.remove({ username: username })
        .then((resp) => {
            if (resp.n === 0) {
                res.setHeader('Content-Type', 'application/json');
                res.status(404).json({ success: false, message: 'No post found' });
            }
            else {
                res.setHeader('Content-Type', 'application/json');
                res.status(200).json({ success: true, message: "deleted", resp });
            }
        }, (err) => { next(err) })
        .catch(err => { next(err) });
});

router.get('/:id', authenticate.verifyUser, (req, res, next) => {
    Post.findById(req.params.id)
        .then((post) => {
            if (!post) {
                res.setHeader('Content-Type', 'application/json');
                res.status(404).json({ message: 'No post found' });
            }
            else {
                res.setHeader('Content-Type', 'application/json');
                res.status(200).json(post);
            }
        }, (err) => { next(err) })
        .catch(err => { next(err) });
});

router.put('/:id', authenticate.verifyUser, (req, res, next) => {
    var content = req.body.content;
    if (content.trim == "") {
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ message: "content can't be empty" });
    }
    else {
        Post.findById({ _id: req.params.id })
            .then((foundPost) => {
                if (!foundPost) {
                    res.setHeader('Content-Type', 'application/json');
                    res.status(404).json({ success: false, message: "post not found" });
                }
                else if (foundPost.username != req.userData.username) {
                    res.setHeader('Content-Type', 'application/json');
                    res.status(403).json({ message: `You can not update other's post` });
                }
                else {
                    foundPost.content = content;
                    foundPost.save((err, post) => {
                        if (err) {
                            next(err)
                        }
                        else {
                            res.setHeader('Content-Type', 'application/json');
                            res.status(200).json({ message: "Post updated successfully", post });
                        }
                    });
                }
            }, (err) => { next(err) })
            .catch((err) => {
                next(err);
            });
    }

});

router.delete('/:id', authenticate.verifyUser, (req, res, next) => {
    Post.findById({ _id: req.params.id })
        .then((foundPost) => {
            if (!foundPost) {
                res.setHeader('Content-Type', 'application/json');
                res.status(404).json({ message: 'No post found' });
            }
            else if (foundPost.username != req.userData.username) {
                res.setHeader('Content-Type', 'application/json');
                res.status(403).json({ message: `You can not delete other's post` });
            }
            else {
                Post.remove({ _id: req.params.id })
                    .then((resp) => {
                        if (resp.n === 0) {
                            res.setHeader('Content-Type', 'application/json');
                            res.status(404).json({ success: false, message: 'No post found' });
                        }
                        else {
                            res.setHeader('Content-Type', 'application/json');
                            res.status(200).json({ success: true, message: "deleted", resp });
                        }
                    }, (err) => { next(err) })
                    .catch(err => { next(err) });
            }
        });
});

router.get('/:id/like', authenticate.verifyUser, (req, res, next) => {
    Post.findById(req.params.id)
        .then((foundpost) => {
            if (!foundpost) {
                res.setHeader('Content-Type', 'application/json');
                res.status(404).json({ success: false, message: "post not found" });
            }
            else {
                Likes.find({ username: req.userData.username, postId: req.params.id })
                    .then((foundLike) => {
                        if (foundLike.length === 0) {
                            var newLike = new Likes({ username: req.userData.username, postId: req.params.id });
                            newLike.save((err, like) => {
                                if (err) { next(err) }
                            })
                            foundpost.likes++;
                            foundpost.save((err, post) => {
                                if (err) { next(err) }
                                else {
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).json({ message: "Liked successfully", post });
                                }
                            });
                        }
                        else {
                            res.setHeader('Content-Type', 'application/json');
                            res.status(403).json({ message: "Already liked" });
                        }
                    }, (err) => { next(err) })
                    .catch(err => { next(err) });
            }
        }, (err) => { next(err) })
        .catch(err => { next(err) });
});

router.get('/:id/unlike', authenticate.verifyUser, (req, res, next) => {
    Post.findById(req.params.id)
        .then((foundpost) => {
            if (!foundpost) {
                res.setHeader('Content-Type', 'application/json');
                res.status(404).json({ success: false, message: "post not found" });
            }
            else {
                Likes.find({ username: req.userData.username, postId: req.params.id })
                    .then((foundLike) => {
                        if (foundLike.length > 0) {
                            Likes.deleteOne(foundLike._id)
                                .then((resp) => {
                                    console.log("removed like from DB");
                                }, (err) => { next(err) })
                                .catch(err => { next(err) });
                            foundpost.likes--;
                            foundpost.save((err, post) => {
                                if (err) { next(err) }
                                else {
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(200).json({ message: "Unliked successfully" });
                                }
                            });
                        }
                        else {
                            res.setHeader('Content-Type', 'application/json');
                            res.status(403).json({ message: "You can not unlike a comment which you have not liked" });
                        }
                    }, (err) => { next(err) })
                    .catch(err => { next(err) });
            }
        }, (err) => { next(err) })
        .catch(err => { next(err) });
});

router.get('/:id/comment', authenticate.verifyUser, (req, res, next) => {
    Post.findById(req.params.id)
        .then((foundPost) => {
            if (!foundPost) {
                res.setHeader('Content-Type', 'application/json');
                res.status(404).json({ message: 'No post found' });
            }
            else {
                if (foundPost.comments.length === 0) {
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).json({ message: `No comments on post with ID ${req.params.id}` });
                }
                else {
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).json(foundPost.comments);
                }
            }
        }, (err) => { next(err) })
        .catch(err => { next(err) });
});

router.post('/:id/comment', authenticate.verifyUser, (req, res, next) => {
    var comment = req.body.comment;
    if (comment.trim == "") {
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ message: "Comment cannot be empty" });
    }
    else {
        Post.findById(req.params.id)
            .then((foundPost) => {
                if (!foundPost) {
                    res.setHeader('Content-Type', 'application/json');
                    res.status(404).json({ message: 'No post found' });
                }
                else {
                    foundPost.comments.push({ comment: comment, username: req.userData.username });
                    foundPost.save((err, post) => {
                        if (err) { next(err) }
                        else {
                            res.setHeader('Content-Type', 'application/json');
                            res.status(200).json({ message: 'Comment added successfully', post });
                        }
                    });
                }
            }, (err) => { next(err) })
            .catch(err => { next(err) });
    }
});

router.delete('/:id/comment', authenticate.verifyUser, (req, res, next) => { // error
    Post.findById(req.params.id)
        .then((foundPost) => {
            if (!foundPost) {
                res.setHeader('Content-Type', 'application/json');
                res.status(404).json({ message: 'No post found' });
            }
            else if (foundPost.comments.length === 0) {
                res.setHeader('Content-Type', 'application/json');
                res.status(200).json({ message: `No comments available on this tweet` });
            }
            else {
                var c = 0;
                for (var i = (foundPost.comments.length - 1); i >= 0; i--) {
                    if (foundPost.comments[i].username === req.userData.username) {
                        foundPost.comments[i].remove();
                        c++;
                    }
                }
                if (c == 0) {
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).json({ message: `you have not made any comments on this tweet` });
                }
                else {
                    foundPost.save((err, post) => {
                        if (err) { next(err) }
                        else {
                            res.setHeader('Content-Type', 'application/json');
                            res.status(200).json({ message: 'all your Comment on this post is deleted successfully' });
                        }
                    });
                }
            }
        }, (err) => { next(err) })
        .catch(err => { next(err) });
});

router.get('/:id/comment/:commentId', authenticate.verifyUser, (req, res, next) => {
    Post.findById(req.params.id)
        .then((foundPost) => {
            if (!foundPost) {
                res.setHeader('Content-Type', 'application/json');
                res.status(404).json({ message: 'No post found' });
            }
            else {
                if (foundPost.comments.length === 0) {
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).json({ message: `No comments on post with ID ${req.params.id}` });
                }
                else {
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).json(foundPost.comments.id(req.params.commentId));
                }
            }
        }, (err) => { next(err) })
        .catch(err => { next(err) });
});

router.put('/:id/comment/:commentId', authenticate.verifyUser, (req, res, next) => {
    var newComment = req.body.comment;
    if (newComment.trim() === "") {
        return res.status(400).json({ message: "Comment cannot be empty" });
    }
    else {
        Post.findById(req.params.id)
            .then((foundPost) => {
                var commentDetails = foundPost.comments.id(req.params.commentId);
                if (!foundPost) {
                    res.setHeader('Content-Type', 'application/json');
                    res.status(404).json({ message: 'No post found' });
                }
                else if (foundPost.comments.length === 0) {
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).json({ message: `No comments available on this tweet` });
                }
                else if (commentDetails.username != req.userData.username) {
                    res.setHeader('Content-Type', 'application/json');
                    res.status(403).json({ message: `You can not update other's comment` });
                }
                else {
                    foundPost.comments.id(req.params.commentId).comment = newComment;
                    foundPost.save((err, post) => {
                        if (err) { next(err) }
                        else {
                            res.setHeader('Content-Type', 'application/json');
                            res.status(200).json({ message: 'Comment updated successfully', post });
                        }
                    });
                }
            }, (err) => { next(err) })
            .catch(err => { next(err) });
    }

});

router.delete('/:id/comment/:commentId', authenticate.verifyUser, (req, res, next) => {
    Post.findById(req.params.id)
        .then((foundPost) => {
            var commentDetails = foundPost.comments.id(req.params.commentId);
            if (!foundPost) {
                res.setHeader('Content-Type', 'application/json');
                res.status(404).json({ message: 'No post found' });
            }
            else if (foundPost.comments.length === 0) {
                res.setHeader('Content-Type', 'application/json');
                res.status(200).json({ message: `No comments available on this tweet` });
            }
            else if (commentDetails.username != req.userData.username) {
                res.setHeader('Content-Type', 'application/json');
                res.status(403).json({ message: `You can not delete other's comment` });
            }
            else {
                if (foundPost.comments.length === 0) {
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).json({ message: `you have not made any comments on this tweet` });
                }
                foundPost.comments.id(req.params.commentId).remove();
                foundPost.save((err, post) => {
                    if (err) { next(err) }
                    else {
                        res.setHeader('Content-Type', 'application/json');
                        res.status(200).json({ message: 'Comment deleted successfully', post });
                    }
                });
            }
        }, (err) => { next(err) })
        .catch(err => { next(err) });
});

module.exports = router;