should = require 'should'
path = require 'path'
fs = require 'fs'
Promise = require 'bluebird'
express = require 'express'
{exec} = require 'child_process'
Promise.promisifyAll fs

configd = require '../src/configd'
config = require './config'

app = express()

app.get '/http.json', (req, res) -> res.send(require("./assets/http.json"))

app.listen 3333

describe 'Main', ->

  @timeout 15000

  it 'should read configs from different sources and merge them into destination', (done) ->

    sources = [
      "#{__dirname}/assets/default.json"
      "#{__dirname}/assets/custom.json"  # Read from json
      "#{__dirname}/assets/ext.js"  # Read from js file
      "http://localhost:3333/http.json"  # Read form http/https server
      "git://#{path.join(__dirname, '../')}:test/assets/git.json"
      "#{__dirname}/assets/coffee.coffee"  # Read from coffee script file
      "#{__dirname}/assets/local.json5"  # Read asset by configd-json5 plugin
    ]

    mergedConfig =
      app: 'awesome app'
      db: 'mongodb://localhost:27017'
      redis: '127.0.0.1'
      port: 3333
      host: 'github.com'
      zen: "I am written in coffee"
      contributors: ['sailxjx']

    if config.ssh
      $prepare = new Promise (resolve, reject) ->
        # Upload ssh.json to remote server
        sources.push "ssh://#{config.ssh}:~/ssh.json"
        mergedConfig["ssh-key"] = "key"
        child = exec "scp #{__dirname}/assets/ssh.json #{config.ssh}:~/ssh.json"
        child.stdout.pipe process.stdout
        child.on 'exit', (code) ->
          return reject(new Error("  The upload process exit with a non-zero value!")) unless code is 0
          resolve()
    else
      console.warn "  Set up your ssh server to test ssh reader"
      $prepare = Promise.resolve()

    $prepare.then -> configd sources

    .then (merged) -> merged.should.eql mergedConfig

    .nodeify done
