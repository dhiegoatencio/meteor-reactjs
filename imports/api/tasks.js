import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

if (Meteor.isServer) {
  //only publish tasks that are public or belong to the current user
  Meteor.publish('tasks', function tasksPublication() {
    return Tasks.find({
      $or: [
        { private: { $ne: true } },
        { owner: this.userId },
      ],
    });
  });
}

export const Tasks = new Mongo.Collection('tasks');

Meteor.methods({

  'tasks.insert'(text) {
    check(text, String);

    //make sure the user is logged in before inserting a tasks
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    Tasks.insert({
      text,
      createdAt: new Date(),
      owner: this.userId,
      username: Meteor.users.findOne(this.userId).username,
    });
  },

  'tasks.remove'(taskId) {
    check(taskId, String);
    const task = Tasks.findOne(taskId);
    if (task.owner !== this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    Tasks.remove(taskId);
  },

  'tasks.setChecked'(taskId, setChecked) {
    check(taskId, String);
    check(setChecked, Boolean);
    const task = Tasks.findOne(taskId);
    if (task.private && task.owner !== this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    Tasks.update(taskId, { $set: { checked: setChecked } });
  },

  'tasks.setPrivate'(taskId, setToPrivate) {
    check(taskId, String);
    check(setToPrivate, Boolean);

    const task = Tasks.findOne(taskId);

    //make sure ony the task owner can make a task private
    if (task.owner !== this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    Tasks.update(taskId, {$set: {private: setToPrivate } });
  }

});