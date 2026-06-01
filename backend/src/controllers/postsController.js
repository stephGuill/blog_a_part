const models = require("../models");

const POST_STATUSES = ["draft", "pending", "published", "archived"];

const normalizePostPayload = (payload, user) => {
  const status = POST_STATUSES.includes(payload.status) ? payload.status : "draft";

  return {
    ...payload,
    author_id: user?.role === "editor" || !payload.author_id ? user.id : payload.author_id,
    published_at: status === "published" ? payload.published_at || new Date() : null,
    status,
  };
};

const browse = (req, res) => {
  const query =
    !req.user
      ? models.posts.findPublishedPublic()
      : req.user?.globalRole === "admin"
      ? models.posts.findAll()
      : models.posts.findAccessibleByUser(req.user.id);

  query
    .then(([rows]) => res.send(rows))
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
};

const read = (req, res) => {
  models.posts
    .find(req.params.id)
    .then(([rows]) => {
      if (rows[0] == null) {
        res.sendStatus(404);
      } else {
        res.send(rows[0]);
      }
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
};

const edit = (req, res) => {
  const posts = normalizePostPayload(req.body, req.user);
  posts.id = parseInt(req.params.id, 10);

  models.posts
    .update(posts)
    .then(([result]) => {
      if (result.affectedRows === 0) {
        res.sendStatus(404);
      } else {
        res.sendStatus(204);
      }
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
};

const add = (req, res) => {
  const posts = normalizePostPayload(req.body, req.user);

  models.posts
    .insert(posts)
    .then(([result]) => {
      res.location(`/posts/${result.insertId}`).sendStatus(201);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
};

const destroy = (req, res) => {
  models.posts
    .delete(req.params.id)
    .then(([result]) => {
      if (result.affectedRows === 0) {
        res.sendStatus(404);
      } else {
        res.sendStatus(204);
      }
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
};

module.exports = {
  add,
  browse,
  destroy,
  edit,
  read,
};
