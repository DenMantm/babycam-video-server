#!/bin/bash
# bash script here
$MyInvocation.MyCommand.Path
[Environment]::CurrentDirectory = $PWD
node server.js supersecret 8081 8082 
[Environment]::CurrentDirectory = $PWD

