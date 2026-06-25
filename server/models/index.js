// FILE: server/models/index.js
// Central import — use this everywhere in controllers

const User         = require("./User");
const Video        = require("./Video");
const Comment      = require("./Comment");
const Subscription = require("./Subscription");
const WatchHistory = require("./WatchHistory");
const Notification = require("./Notification");
const LiveStream   = require("./LiveStream");
const Payment      = require("./Payment");
const Conversation = require("./Conversation");
const ChatMessage  = require("./ChatMessage");
const Report       = require("./Report");
const AdCampaign   = require("./AdCampaign");
const FocusSession = require("./FocusSession");
const Interaction  = require("./Interaction");
const EarlyAccess  = require("./EarlyAccess");
const Category     = require('./Category');


module.exports = {
  User,
  Video,
  Comment,
  Subscription,
  WatchHistory,
  Notification,
  LiveStream,
  Payment,
  Conversation,
  ChatMessage,
  Report,
  AdCampaign,
  FocusSession,
  Interaction,
  EarlyAccess,
  Category,

};