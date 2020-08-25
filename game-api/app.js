const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');
const cors = require('cors')
const fs = require('fs-extra');
const clusters = require('./clusters');

const PodService = require('./podservice');
const PummelService = require('./pummelservice');
const LPMService = require('./lpmservice');
const ClusterService = require('./clusterservice');

module.exports = async function main() {
  // Creates an ExpressJS compatible Feathers application
  const app = express(feathers());
  // Enable Cors for ALL
  app.use(cors({ origin: (origin, cb) => cb(null, true) }));

  // Parse HTTP JSON bodies
  app.use(express.json());
  // Parse URL-encoded params
  app.use(express.urlencoded({ extended: true }));
  // Host static files from the current folder
  app.use(express.static(__dirname));
  // Add REST API support
  app.configure(express.rest());
  // Configure Socket.io real-time APIs
  app.configure(socketio());

  app.use('/pods', new PodService(clusters));
  const lpmService = new LPMService();
  app.use('/lpm', lpmService)

  const targets = JSON.parse(await fs.readFile('./targets.json'));
  app.use('/pummels', new PummelService(targets, lpmService));

  app.use('/clusters', new ClusterService(clusters));




  // Register a nicer error handler than the default Express one
  app.use(express.errorHandler());

  // Add any new real-time connection to the `everybody` channel
  app.on('connection', connection =>
    app.channel('everybody').join(connection)
  );
  // Publish all events to the `everybody` channel
  app.publish(data => app.channel('everybody'));

  // Start the server
  app.listen(3030).on('listening', () =>
    console.log('Feathers server listening on http://localhost:3030')
  );

  return app;
}