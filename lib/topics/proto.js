/**
 * Module dependencies.
 */

import user from '../user/user.js';
import request from '../request/request.js';
import Stateful from '../stateful/stateful.js';
import debug from 'debug';
import config from '../config/config';

let log = debug('democracyos:topics-proto');

export default class Topics extends Stateful {
  constructor () {
    super();
    // instance bindings
    this.middleware = this.middleware.bind(this);
    this.fetch = this.fetch.bind(this);
    this.forum = null;

    this.state('initializing');

    // Re-fetch topics on user sign-in
    user.on('loaded', this.fetch);

    this.fetch();
  }

  /**
   * Fetch `topics` from source
   *
   * @param {String} src
   * @api public
   */

  fetch (src, forum) {
    log('request in process');
    src = src || '/api/topic/all';

    this.state('loading');

    const req = request
    .get(src)

    if (forum) {
      if (forum != this.forum) this.items = [];
      this.forum = forum;
      req.query({forum: forum.id});
    }

    req.end(onresponse.bind(this));

    function onresponse(err, res) {
      if (err || !res.ok) {
        var message = 'Unable to load topics. Please try reloading the page. Thanks!';
        return this.error(message);
      };

      this.set(res.body);
    }
  }

  /**
   * Set items to `v`
   *
   * @param {Array} v
   * @return {Topics} Instance of `Topics`
   * @api public
   */

  set (v) {
    this.items = v;
    this.state('loaded');
    return this;
  }

  /**
   * Get current `items`
   *
   * @return {Array} Current `items`
   * @api public
   */

  get () {
    return this.items;
  }

  /**
   * Middleware for `page.js` like
   * routers
   *
   * @param {Object} ctx
   * @param {Function} next
   * @api public
   */

  middleware (ctx, next) {
    if (ctx.forum) {
      this.fetch(null, ctx.forum);
    }
    this.ready(next);
  }

  /**
   * Handle errors
   *
   * @param {String} error
   * @return {Topics} Instance of `Topics`
   * @api public
   */

  error (message) {
    // TODO: We should use `Error`s instead of
    // `Strings` to handle errors...
    // Ref: http://www.devthought.com/2011/12/22/a-string-is-not-an-error/
    this.state('error', message);
    log('error found: %s', message);

    // Unregister all `ready` listeners
    this.off('ready');
    return this;
  }
}
