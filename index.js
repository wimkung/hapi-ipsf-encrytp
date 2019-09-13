'use strict';

const path = require('path');
const Axios = require('axios');
const Hapi = require('@hapi/hapi');
const ipfsClient = require('ipfs-http-client');

const encrypt = require('./encrypt');
const decrypt = require('./decrypt');

require('dotenv').config({
  path: path.join(__dirname, './.env')
});

const ipfs = ipfsClient({ host: process.env.IPFS_HOST, port: process.env.IPFS_PORT, protocol: process.env.IPFS_PROTOCOL });
const baseIpfsUrl = process.env.IPFS_URL;

let contentType;

const init = async () => {

  const server = Hapi.server({
    port: 3000,
    host: 'localhost'
  });

  server.route({
    method: 'GET',
    path:'/',
    options: {
      handler: (request, h) => {

        return 'Hello World!';
      }
    }
  });

  server.route({
    method: 'POST',
    path:'/ipfs',
    options: {
      payload: {
        output: 'stream',
        maxBytes: 100 * 1024 * 1024
      },
      handler: async (request, h) => {
        try {
          const { file } = request.payload;

          const encrypted = await encrypt({ data: file._data, password: '20Scoops!' });

          const result = await ipfs.add(encrypted);
          const { hash, size } = result[0];

          contentType = file.hapi.headers['content-type'];

          return {
            message: 'upload file',
            url: `${baseIpfsUrl}${hash}`,
            hash,
            size,
            contentType
          };
        } catch (e) {
          console.log(e);
          return e;
        }
      }
    }
  });

  server.route({
    method: 'GET',
    path:'/ipfs/{hash}',
    options: {
      handler: async (request, h) => {
        const { hash } = request.params;

        const result = await Axios({
          url: `${baseIpfsUrl}${hash}`,
          method: 'GET',
          responseType: 'stream'
        })

        if (result.status !== 200) {
          return { message: 'caget file' };
        }

        const decrypted = await decrypt({ rawStream: result.data, password: '20Scoops!'});

        return h.response(decrypted).type(contentType);
      }
    }
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

  console.log(err);
  process.exit(1);
});

init();